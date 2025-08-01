"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, BarChart, Send, Trash, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import SettingsDialog from "@/components/settings-dialog"
import SettingsSummary from "@/components/settings-summary"
import DispatchPlan from "@/components/dispatch-plan"
import StockChart from "@/components/stock-chart"
import { simulateDispatch } from "@/lib/dispatch-logic"
import { addDays, parseISO, differenceInDays } from "date-fns"
import { useCompanyStore } from "@/lib/company-store"
import { useDispatchStore, type DeliveryDetailWithStatus } from "@/lib/dispatch-store"
import { useToast } from "@/hooks/use-toast"
import { usePathname, useRouter } from "next/navigation"
import { getBioSettingOrDefault } from "@/lib/bio-setting-service"
import { sendNotificationRequest, PRODUCT_TO_CHEMICAL_MAP, type NotificationPayload } from "@/lib/notification-api"
import ComparisonPanel from "@/components/comparison-panel"
import { saveEditHistory } from "@/lib/edit-history-service"
import { getCurrentUserName } from "@/lib/auth-service"

export type TimeBlock = {
  startHour: number
  endHour: number
  usage: number
}

export type DailyUsageConfig = {
  type: "single" | "hourly"
  value: number | TimeBlock[]
}

export type DispatchSettings = {
  minLevel: number
  maxLevel: number
  currentStock: number
  deliveryAmount: number
  dailyUsage: DailyUsageConfig[]
  startDate: string
  endDate: string
  companyId?: number
  productName: string
  // 환산 비율 추가
  conversionRate?: number // 1ton = ? mm
  unit?: string // 'ton' 또는 'mm'
  plant?: string
  planDays?: number
}

export type DeliveryDetail = {
  id?: string
  date: string
  morningStock: number
  eveningStock: number
  deliveryCount: number
  deliveryTimes: string[]
  preDeliveryStock: number[]
  postDeliveryStock: number[]
  status?: string
  companyId?: number
  productName?: string
  deliveryQuantity?: number
  deliveryAmount?: number
  note?: string
  oldDeliveryTimes?: string[]
}

export type StockLogEntry = {
  timestamp: string
  stock: number
}

export type SimulationResult = {
  deliveryDetails: DeliveryDetail[]
  stockLog: StockLogEntry[]
}

// 품명별 기본 설정값 정의 (단위와 환산 비율 포함)
const productDefaultSettings = {
  유동사: {
    minLevel: 30,
    maxLevel: 80,
    deliveryAmount: 29,
    dailyUsage: 40,
    unit: "ton",
    conversionRate: 1, // ton to ton (no conversion)
  },
  고령토: {
    minLevel: 25,
    maxLevel: 70,
    deliveryAmount: 30,
    dailyUsage: 35,
    unit: "ton",
    conversionRate: 1,
  },
  요소수: {
    minLevel: 1000, // mm
    maxLevel: 4500, // mm
    deliveryAmount: 20, // ton (입고량은 ton으로 표시)
    dailyUsage: 10, // ton/day (사용량은 ton으로 표시)
    unit: "mm",
    conversionRate: 100, // 1ton = 100mm
  },
  황산암모늄: {
    minLevel: 1000, // mm
    maxLevel: 6000, // mm
    deliveryAmount: 30, // ton (입고량은 ton으로 표시)
    dailyUsage: 12, // ton/day (사용량은 ton으로 표시)
    unit: "mm",
    conversionRate: 153, // 1ton = 153mm
  },
  소석회: {
    minLevel: 10,
    maxLevel: 60,
    deliveryAmount: 30,
    dailyUsage: 14,
    unit: "ton",
    conversionRate: 1,
  },
  중탄산나트륨: {
    minLevel: 10,
    maxLevel: 25,
    deliveryAmount: 30,
    dailyUsage: 20,
    unit: "ton",
    conversionRate: 1,
  },
}

// 품명을 Chemical enum 값으로 변환하는 매핑 (대문자)
const PRODUCT_TO_CHEMICAL_ENUM: Record<string, string> = {
  유동사: "SAND",
  고령토: "KAOLIN",
  요소수: "UREA",
  황산암모늄: "SULFATE",
  소석회: "HYDRATED",
  중탄산나트륨: "SODIUM",
}

interface DraftSystemProps {
  productName: string
  plant?: string
}

export default function DraftSystem({ productName = "유동사", plant = "bio1" }: DraftSystemProps) {
  const getKoreanDate = (offsetDays = 0) => {
    const now = new Date()
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000) // UTC+9
    if (offsetDays !== 0) {
      koreanTime.setUTCDate(koreanTime.getUTCDate() + offsetDays)
    }
    return koreanTime.toISOString().split("T")[0]
  }

  const today = getKoreanDate(0)
  const nextWeek = getKoreanDate(7)

  const { companies, getDefaultCompany } = useCompanyStore()
  const store = useDispatchStore()
  const { result, activeTab, addToFinal, updateDeliveryStatus, deleteDraftRows } = store

  // setSettings 함수가 없는 경우 대체 함수 생성
  const setSettings =
    store.setSettings ||
    ((newSettings: DispatchSettings) => {
      console.warn("setSettings function not available, using fallback")
      // 임시로 로컬 상태 사용
    })

  const setResult =
    store.setResult ||
    ((newResult: SimulationResult | null) => {
      console.warn("setResult function not available, using fallback")
    })
  const setActiveTab =
    store.setActiveTab ||
    ((tab: string) => {
      console.warn("setActiveTab function not available, using fallback")
    })

  const settings = store.settings
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // 현재 상태 관련 코드에 전체 선택 상태 추가
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [allSelected, setAllSelected] = useState(false)

  // 삭제 확인 다이얼로그 상태 추가
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // 비교 패널 상태 추가
  const [isComparisonPanelOpen, setIsComparisonPanelOpen] = useState(false)

  // 비교 버튼을 표시할 chemical 목록
  const CHEMICALS_WITH_COMPARISON = ["sand", "kaolin", "hydrated", "sodium"]
  console.log("settings : ", settings)

  const actualProductName = productName
  // DB 저장용 제품명 (bio2는 테이블명에만 사용, product_name은 실제 제품명)
  const dbProductName = actualProductName

  // Initialize settings if not already set or if product changed
  useEffect(() => {
    // 현재 설정이 없거나 품명이 다른 경우 초기화
    if (!settings || settings.productName !== actualProductName || settings.plant !== plant) {
      const loadSettings = async () => {
        const defaultSettings =
          productDefaultSettings[actualProductName as keyof typeof productDefaultSettings] ||
          productDefaultSettings["유동사"]

        // Bio 설정에서 factor 값 가져오기
        const bioSetting = await getBioSettingOrDefault(plant, actualProductName)
        const conversionRate = bioSetting.factor || defaultSettings.conversionRate || 1

        console.log(`${actualProductName}의 환산계수(factor): ${conversionRate}`)

        // 기본 설정 생성
        const initialSettings: DispatchSettings = {
          minLevel: defaultSettings.minLevel,
          maxLevel: defaultSettings.maxLevel,
          currentStock: defaultSettings.unit === "mm" ? 2500 : 50, // mm 단위면 2500, ton이면 50
          deliveryAmount: defaultSettings.deliveryAmount,
          // 시작일부터 종료일까지의 일수 계산
          dailyUsage: Array(differenceInDays(parseISO(nextWeek), parseISO(today)) + 1).fill({
            type: "single",
            value: bioSetting.flow || defaultSettings.dailyUsage,
          }),
          startDate: today,
          endDate: nextWeek,
          planDays: differenceInDays(parseISO(nextWeek), parseISO(today)) + 1, // planDays 명시적 설정
          productName: actualProductName,
          unit: defaultSettings.unit,
          conversionRate: conversionRate, // Bio 설정에서 가져온 factor 값 사용
          plant: plant, // plant 정보 추가
        }

        // 기본 업체 설정
        const defaultCompany =
          getDefaultCompany(actualProductName) ||
          companies.find((c) => c.productName === actualProductName && c.isDefault)
        if (defaultCompany) {
          initialSettings.companyId = defaultCompany.id
        }

        setSettings(initialSettings)
        setResult(null) // 결과 초기화
      }

      loadSettings()
    }
  }, [settings, setSettings, today, nextWeek, getDefaultCompany, actualProductName, companies, plant])

  const generatePlan = async (newSettings?: DispatchSettings) => {
    // 새로운 설정이 전달되면 그것을 사용하고, 아니면 기존 설정 사용
    const currentSettings = newSettings || settings
    if (!currentSettings) return

    // 기본 업체 확인 및 설정
    let finalSettings = currentSettings
    if (!currentSettings.companyId) {
      const defaultCompany =
        getDefaultCompany(currentSettings.productName) ||
        companies.find((c) => c.productName === currentSettings.productName && c.isDefault)
      if (defaultCompany) {
        finalSettings = {
          ...currentSettings,
          companyId: defaultCompany.id,
        }
        // 새로운 설정이 전달된 경우에만 상태 업데이트
        if (newSettings) {
          setSettings(finalSettings)
        }
      }
    }

    // 시작일과 종료일 기반으로 planDays 계산
    const planDays = differenceInDays(parseISO(finalSettings.endDate), parseISO(finalSettings.startDate)) + 1

    // dailyUsage 배열 길이가 planDays와 일치하는지 확인하고 조정
    let adjustedDailyUsage = [...finalSettings.dailyUsage]
    if (adjustedDailyUsage.length !== planDays) {
      if (adjustedDailyUsage.length > planDays) {
        // 배열이 더 길면 잘라냄
        adjustedDailyUsage = adjustedDailyUsage.slice(0, planDays)
      } else {
        // 배열이 더 짧으면 마지막 값으로 채움
        const lastConfig = adjustedDailyUsage[adjustedDailyUsage.length - 1] || {
          type: "single",
          value: 15,
        }
        while (adjustedDailyUsage.length < planDays) {
          adjustedDailyUsage.push({ ...lastConfig })
        }
      }
    }

    finalSettings = {
      ...finalSettings,
      planDays,
      dailyUsage: adjustedDailyUsage,
    }

    const simulationResult = simulateDispatch(finalSettings)
    setResult(simulationResult)
    setActiveTab("plan")
    setIsSettingsOpen(false)

    // 배차계획 작성 히스토리 저장
    const userName = getCurrentUserName()
    const chemicalEnum = PRODUCT_TO_CHEMICAL_ENUM[actualProductName] || "SAND"

    await saveEditHistory(
      userName,
      plant,
      chemicalEnum,
      today,
      "draft_create",
      null,
      {
        planDays: planDays,
        deliveryCount: simulationResult.deliveryDetails.reduce((sum, detail) => sum + detail.deliveryCount, 0),
        startDate: finalSettings.startDate,
        endDate: finalSettings.endDate,
      },
      `배차계획 작성 - ${planDays}일간 계획 생성`,
    )
  }

  const toggleView = () => {
    setActiveTab(activeTab === "plan" ? "chart" : "plan")
  }

  // Calculate hourly usage rate based on settings - 환산계수 적용
  const getHourlyUsageRate = (dayIndex: number): number => {
    if (!settings || !settings.dailyUsage || settings.dailyUsage.length === 0) return 0

    const dayConfig =
      dayIndex < settings.dailyUsage.length
        ? settings.dailyUsage[dayIndex]
        : settings.dailyUsage[settings.dailyUsage.length - 1]

    let dailyUsage = 0
    if (dayConfig.type === "single") {
      dailyUsage = dayConfig.value as number
    } else {
      // For hourly configuration, calculate total
      const timeBlocks = dayConfig.value as TimeBlock[]
      dailyUsage = timeBlocks.reduce((sum, block) => sum + block.usage, 0)
    }

    // factor 적용: 사용량에 factor를 곱함
    const convertedDailyUsage = dailyUsage * (settings.conversionRate || 1)

    console.log(
      `시간당 사용량 계산 - 품명: ${settings.productName}, 일일사용량: ${dailyUsage}, factor: ${
        settings.conversionRate || 1
      }, 변환된 일일사용량: ${convertedDailyUsage}`,
    )

    return convertedDailyUsage / 24 // 시간당 사용량
  }

  // Get the day index from a date string
  const getDayIndex = (date: string): number => {
    if (!settings) return 0
    const startDate = parseISO(settings.startDate)
    const currentDate = parseISO(date)
    const diffDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Calculate stock at a specific time without considering any deliveries
  const calculateBaseStock = (date: string, hour: number): number => {
    if (!settings || !result) return 0
    const dayIndex = getDayIndex(date)
    const hourlyRate = getHourlyUsageRate(dayIndex) // 이미 환산계수가 적용된 값

    // 00:00 ~ 05:00 시간대 처리 (전날 저녁 재고 기준)
    if (hour >= 0 && hour < 6) {
      // 현재 날짜가 첫 번째 날인 경우, 설정된 초기 재고에서 야간 사용량 차감
      if (dayIndex === 0) {
        // 초기 재고(currentStock)에서 06:00부터 20:00까지의 사용량을 차감한 후, 20:00부터 현재 시간까지의 사용량 추가 차감
        const stockAt20 = settings.currentStock - 14 * hourlyRate // 06:00부터 20:00까지 14시간
        const hoursFrom20 = hour + 4 // 20:00부터 현재 시간까지 (20->0: 4시간, 0->hour: hour시간)
        return Math.max(0, stockAt20 - hoursFrom20 * hourlyRate)
      } else {
        // 전날 저녁 재고에서 야간 사용량 차감
        const previousDayIndex = dayIndex - 1
        const previousDay = result.deliveryDetails[previousDayIndex]
        if (previousDay) {
          const hoursFrom20 = hour + 4 // 20:00부터 현재 시간까지
          return Math.max(0, previousDay.eveningStock - hoursFrom20 * hourlyRate)
        }
      }
      return 0
    }

    // 06:00 ~ 23:59 시간대 처리 (기존 로직)
    let stock = 0
    const day = result.deliveryDetails.find((d) => d.date === date)
    if (day) {
      stock = day.morningStock
    } else {
      return 0 // Day not found
    }

    // Calculate usage from 06:00 to the target hour
    const hoursElapsed = hour - 6 // Hours since 06:00
    if (hoursElapsed > 0) {
      stock -= hoursElapsed * hourlyRate
    }

    return Math.max(0, stock)
  }

  // Calculate stock at a specific time considering all deliveries up to that time
  const calculateStockWithDeliveries = (
    date: string,
    hour: number,
    deliveryTimes: string[],
    deliveryAmount: number,
  ): number => {
    let stock = calculateBaseStock(date, hour)

    // Add deliveries that happened before this hour with factor applied
    for (const timeStr of deliveryTimes) {
      const deliveryHour = Number.parseInt(timeStr.split(":")[0])
      if (deliveryHour < hour) {
        // factor 적용: 입고량에 factor를 곱함
        const convertedAmount = deliveryAmount * (settings?.conversionRate || 1)
        stock += convertedAmount
      }
    }

    return stock
  }

  // Recalculate evening stock (20:00)
  const recalculateEveningStock = (date: string, deliveryTimes: string[], deliveryAmount: number): number => {
    // Use the same conversion logic as other functions
    return calculateStockWithDeliveries(date, 20, deliveryTimes, deliveryAmount)
  }

  // 기존 recalculateStocksFromDay 함수 뒤에 stockLog 재생성 함수 추가

  // StockLog 재생성 함수 추가
  const regenerateStockLog = (updatedResult: SimulationResult, settings: DispatchSettings) => {
    const stockLog: StockLogEntry[] = []
    const hourlyRates: number[] = []

    // 각 날짜별 시간당 사용량 미리 계산
    for (let dayIdx = 0; dayIdx < updatedResult.deliveryDetails.length; dayIdx++) {
      hourlyRates[dayIdx] = getHourlyUsageRate(dayIdx)
    }

    // 각 날짜별로 시간별 재고 계산
    for (let dayIdx = 0; dayIdx < updatedResult.deliveryDetails.length; dayIdx++) {
      const day = updatedResult.deliveryDetails[dayIdx]
      const hourlyRate = hourlyRates[dayIdx]

      // 해당 날짜의 00:00부터 23:59까지 시간별 재고 계산
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = `${day.date}T${hour.toString().padStart(2, "0")}:00:00`
        let stock = 0

        if (hour < 6) {
          // 00:00~05:59: 전날 저녁 재고에서 야간 사용량 차감
          if (dayIdx === 0) {
            // 첫날의 경우 초기 재고에서 계산
            const stockAt20 = settings.currentStock - 14 * hourlyRate
            const hoursFrom20 = hour + 4
            stock = Math.max(0, stockAt20 - hoursFrom20 * hourlyRate)
          } else {
            // 전날 저녁 재고에서 야간 사용량 차감
            const previousDay = updatedResult.deliveryDetails[dayIdx - 1]
            const hoursFrom20 = hour + 4
            stock = Math.max(0, previousDay.eveningStock - hoursFrom20 * hourlyRate)
          }

          // 00:00~현재시간 사이의 입고량 추가
          const deliveriesBeforeHour = day.deliveryTimes.filter((time) => {
            const deliveryHour = Number.parseInt(time.split(":")[0])
            return deliveryHour < hour
          })

          for (const _ of deliveriesBeforeHour) {
            const deliveryQuantity = day.deliveryQuantity || settings.deliveryAmount
            const convertedAmount =
              settings.unit === "mm" ? deliveryQuantity * (settings.conversionRate || 1) : deliveryQuantity
            stock += convertedAmount
          }
        } else {
          // 06:00~23:59: 아침 재고에서 시작
          stock = day.morningStock

          // 06:00부터 현재 시간까지의 사용량 차감
          const hoursElapsed = hour - 6
          if (hoursElapsed > 0) {
            stock -= hoursElapsed * hourlyRate
          }

          // 06:00~현재시간 사이의 입고량 추가
          const deliveriesBeforeHour = day.deliveryTimes.filter((time) => {
            const deliveryHour = Number.parseInt(time.split(":")[0])
            return deliveryHour >= 6 && deliveryHour < hour
          })

          for (const _ of deliveriesBeforeHour) {
            const deliveryQuantity = day.deliveryQuantity || settings.deliveryAmount
            const convertedAmount =
              settings.unit === "mm" ? deliveryQuantity * (settings.conversionRate || 1) : deliveryQuantity
            stock += convertedAmount
          }
        }

        stockLog.push({
          timestamp,
          stock: Math.max(0, stock),
        })
      }
    }

    updatedResult.stockLog = stockLog
  }

  // updateDeliveryTime 함수 수정 - stockLog 재생성 추가
  const updateDeliveryTime = (dayIndex: number, deliveryIndex: number, newTime: string) => {
    if (!result || !settings) return

    console.log(`입고시간 변경 - 날짜 인덱스: ${dayIndex}, 입고 인덱스: ${deliveryIndex}, 새 시간: ${newTime}`)

    // Create a deep copy of the result
    const updatedResult = JSON.parse(JSON.stringify(result)) as SimulationResult
    const day = updatedResult.deliveryDetails[dayIndex]

    // Update the delivery time
    day.deliveryTimes[deliveryIndex] = newTime

    // 입고시간을 시간순으로 정렬
    const timeIndices = day.deliveryTimes.map((time, index) => ({ time, index }))
    timeIndices.sort((a, b) => {
      const hourA = Number.parseInt(a.time.split(":")[0])
      const hourB = Number.parseInt(b.time.split(":")[0])
      return hourA - hourB
    })

    // 정렬된 순서로 입고시간 재배열
    day.deliveryTimes = timeIndices.map((item) => item.time)

    // 해당 날짜부터 모든 후속 날짜의 재고를 다시 계산
    recalculateStocksFromDay(updatedResult, dayIndex, settings)

    // StockLog 재생성
    regenerateStockLog(updatedResult, settings)

    setResult(updatedResult)
  }

  // 다음 가능한 입고시간을 찾는 함수 추가
  const getNextAvailableDeliveryTime = (existingTimes: string[]): string => {
    // 기본 입고시간 후보들 (시간순으로 정렬)
    const possibleHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

    // 기존 입고시간들을 시간으로 변환
    const existingHours = existingTimes.map((time) => Number.parseInt(time.split(":")[0])).sort((a, b) => a - b)

    // 가장 늦은 기존 입고시간 찾기
    const latestExistingHour = existingHours.length > 0 ? Math.max(...existingHours) : 8

    // 가장 늦은 시간보다 늦은 시간 중에서 첫 번째 가능한 시간 찾기
    for (const hour of possibleHours) {
      if (hour > latestExistingHour && !existingHours.includes(hour)) {
        return `${hour.toString().padStart(2, "0")}:00`
      }
    }

    // 모든 후보 시간이 사용된 경우, 가장 늦은 시간에 1시간 추가
    const nextHour = Math.min(latestExistingHour + 1, 18)
    return `${nextHour.toString().padStart(2, "0")}:00`
  }

  // onUpdateDeliveryCount 함수를 수정하여 시간순 정렬 보장
  const onUpdateDeliveryCount = (dayIndex: number, newCount: number) => {
    if (!result || !settings) return

    console.log(`입고대수 변경 - 날짜 인덱스: ${dayIndex}, 새 입고대수: ${newCount}`)

    // Create a deep copy of the result
    const updatedResult = JSON.parse(JSON.stringify(result)) as SimulationResult
    const day = updatedResult.deliveryDetails[dayIndex]
    const currentCount = day.deliveryCount

    // If increasing count
    if (newCount > currentCount) {
      // 추가할 입고 횟수만큼 새로운 입고시간 생성
      for (let i = currentCount; i < newCount; i++) {
        const newTime = getNextAvailableDeliveryTime(day.deliveryTimes)
        day.deliveryTimes.push(newTime)
        console.log(`새 입고시간 추가: ${newTime}`)
      }
    }
    // If decreasing count
    else if (newCount < currentCount) {
      // 가장 늦은 시간부터 제거 (시간순 정렬 후 뒤에서부터 제거)
      day.deliveryTimes.sort((a, b) => {
        const hourA = Number.parseInt(a.split(":")[0])
        const hourB = Number.parseInt(b.split(":")[0])
        return hourA - hourB
      })
      day.deliveryTimes = day.deliveryTimes.slice(0, newCount)
      console.log(`입고시간 제거 후: ${day.deliveryTimes.join(", ")}`)
    }

    // Update delivery count
    day.deliveryCount = newCount

    // 입고시간을 시간순으로 정렬 (최종 확인)
    day.deliveryTimes.sort((a, b) => {
      const hourA = Number.parseInt(a.split(":")[0])
      const hourB = Number.parseInt(b.split(":")[0])
      return hourA - hourB
    })

    console.log(`최종 입고시간 순서: ${day.deliveryTimes.join(", ")}`)

    // 해당 날짜부터 모든 후속 날짜의 재고를 다시 계산
    recalculateStocksFromDay(updatedResult, dayIndex, settings)

    // StockLog 재생성
    regenerateStockLog(updatedResult, settings)

    setResult(updatedResult)
  }

  // 새로운 재고 재계산 함수 추가 (해당 날짜부터 모든 후속 날짜 재계산)
  const recalculateStocksFromDay = (
    updatedResult: SimulationResult,
    fromDayIndex: number,
    settings: DispatchSettings,
  ) => {
    console.log(`${fromDayIndex}번째 날짜부터 재고 재계산 시작`)

    // factor 적용하여 변환된 입고량 계산
    const factor = settings.conversionRate || 1
    const convertedDeliveryAmount = settings.deliveryAmount * factor

    console.log(
      `재고 재계산 - 기본 입고량: ${settings.deliveryAmount}ton, factor: ${factor}, 변환된 입고량: ${convertedDeliveryAmount}`,
    )

    for (let dayIdx = fromDayIndex; dayIdx < updatedResult.deliveryDetails.length; dayIdx++) {
      const day = updatedResult.deliveryDetails[dayIdx]

      // 아침 재고 계산: 첫 번째 날이 아닌 경우 전날 저녁 재고에서 야간 사용량을 뺀 값
      if (dayIdx > 0) {
        const previousDay = updatedResult.deliveryDetails[dayIdx - 1]
        const previousDayHourlyRate = getHourlyUsageRate(dayIdx - 1)
        const nightUsage = previousDayHourlyRate * 10 // 20:00부터 06:00까지 10시간

        // 전날 20:00 이후 입고량 계산 (21:00, 22:00, 23:00 입고)
        const nightDeliveries = previousDay.deliveryTimes.filter((time) => {
          const [hour] = time.split(":").map(Number)
          return hour > 20 // 20:00 이후 입고만
        })

        const nightDeliveryAmount = nightDeliveries.length * convertedDeliveryAmount

        // 연속성 보장: 전날 저녁 재고 + 야간 입고량 - 야간 사용량
        day.morningStock = Math.max(0, previousDay.eveningStock + nightDeliveryAmount - nightUsage)

        console.log(
          `${dayIdx}일차 아침 재고: 전날저녁(${previousDay.eveningStock}) + 야간입고(${nightDeliveryAmount}) - 야간사용(${nightUsage.toFixed(2)}) = ${day.morningStock.toFixed(2)}`,
        )
      }

      // 입고시간을 시간순으로 정렬 (재계산 전에 정렬 보장)
      day.deliveryTimes.sort((a, b) => {
        const hourA = Number.parseInt(a.split(":")[0])
        const hourB = Number.parseInt(b.split(":")[0])
        return hourA - hourB
      })

      // 입고 전/후 재고 계산
      day.preDeliveryStock = []
      day.postDeliveryStock = []

      let currentStock = day.morningStock
      const hourlyRate = getHourlyUsageRate(dayIdx)

      // 각 입고시간별로 재고 계산 (시간순으로 정렬된 상태)
      for (let i = 0; i < day.deliveryCount; i++) {
        if (i >= day.deliveryTimes.length) break

        const timeStr = day.deliveryTimes[i]
        const [hour, minute] = timeStr.split(":").map(Number)
        const deliveryHour = hour + minute / 60

        // 새벽 시간대 입고 처리 (00:00~05:59)
        if (hour >= 0 && hour < 6) {
          // 전날 저녁 재고에서 시작
          let nightStock = day.morningStock
          if (dayIdx > 0) {
            const previousDay = updatedResult.deliveryDetails[dayIdx - 1]
            if (previousDay) {
              nightStock = previousDay.eveningStock
            }
          }

          // 20:00부터 현재 입고 시간까지의 사용량 계산
          const hoursFromEvening = deliveryHour + 4 // 20:00부터 현재 시간까지 (20->0: 4시간, 0->hour: hour시간)
          const usageFromEvening = hoursFromEvening * hourlyRate

          // 입고 전 재고
          const preStock = Math.max(0, nightStock - usageFromEvening)
          day.preDeliveryStock.push(preStock)

          // 입고 후 재고
          const deliveryQuantity = day.deliveryQuantity || settings.deliveryAmount
          const actualConvertedAmount = deliveryQuantity * factor
          const postStock = preStock + actualConvertedAmount
          day.postDeliveryStock.push(postStock)

          // 06:00 재고 업데이트 (새벽 입고가 있는 경우)
          if (i === 0 || day.deliveryTimes.every((time, idx) => idx >= i || Number.parseInt(time.split(":")[0]) >= 6)) {
            // 새벽 입고 후 06:00까지의 사용량 계산
            const hoursTo6AM = 6 - deliveryHour
            const usageTo6AM = hoursTo6AM * hourlyRate
            day.morningStock = Math.max(0, postStock - usageTo6AM)
            currentStock = day.morningStock
          }
        } else {
          // 06:00 이후 입고 처리 (기존 로직)
          // 이전 시점부터 현재 입고 시간까지의 사용량 계산
          let previousHour = 6 // 첫 번째는 06:00부터
          if (i > 0) {
            const prevTimeStr = day.deliveryTimes[i - 1]
            const [prevHour, prevMinute] = prevTimeStr.split(":").map(Number)
            // 이전 입고가 새벽 시간대였다면 06:00부터 시작
            if (prevHour < 6) {
              previousHour = 6
            } else {
              previousHour = prevHour + prevMinute / 60
            }
          }

          // 사용량 차감
          const hoursElapsed = Math.max(0, deliveryHour - previousHour)
          currentStock -= hoursElapsed * hourlyRate

          // 입고 전 재고
          const preStock = Math.max(0, currentStock)
          day.preDeliveryStock.push(preStock)

          // 입고 후 재고 - factor 적용된 입고량 사용
          const deliveryQuantity = day.deliveryQuantity || settings.deliveryAmount
          const actualConvertedAmount = deliveryQuantity * factor
          const postStock = preStock + actualConvertedAmount
          day.postDeliveryStock.push(postStock)
          currentStock = postStock
        }
      }

      // 저녁 재고 계산 (20:00) - 연속성 보장
      const eveningStock = day.morningStock

      // 06:00부터 20:00까지 14시간의 사용량
      const dailyUsage = hourlyRate * 14

      // 06:00 이후에 발생한 입고들만 찾아서 반영 (새벽 입고는 이미 아침 재고에 포함됨)
      const deliveriesAfter6Before20 = day.deliveryTimes.filter((time) => {
        const [hour] = time.split(":").map(Number)
        return hour >= 6 && hour <= 20 // 06:00 이후 20:00 이전 입고만
      })

      // 06:00 이후 20:00 이전 입고들의 총량 계산
      const totalDeliveryAfter6Before20 = deliveriesAfter6Before20.length * convertedDeliveryAmount

      // 저녁 재고 = 아침 재고 + 06:00 이후 입고량 - 일일 사용량
      day.eveningStock = Math.max(0, day.morningStock + totalDeliveryAfter6Before20 - dailyUsage)

      console.log(
        `${dayIdx}일차 재계산 완료 - 아침: ${day.morningStock.toFixed(2)}, 저녁: ${day.eveningStock.toFixed(2)}, 입고대수: ${day.deliveryCount}, 입고시간: ${day.deliveryTimes.join(", ")}`,
      )
    }
  }

  const addNewRow = () => {
    if (!result || !settings || result.deliveryDetails.length === 0) return

    // Get the last day and create a new day based on it
    const lastDay = result.deliveryDetails[result.deliveryDetails.length - 1]
    const lastDate = new Date(lastDay.date)
    const newDate = addDays(lastDate, 1)
    const newDateStr = newDate.toISOString().split("T")[0]

    // Create a new day with default values
    const newDay: DeliveryDetailWithStatus = {
      date: newDateStr,
      morningStock: lastDay.eveningStock - 15, // Approximate: evening stock minus daily usage
      eveningStock: lastDay.eveningStock - 15, // Start with same as morning
      deliveryCount: 0,
      deliveryTimes: [],
      preDeliveryStock: [],
      postDeliveryStock: [],
      status: "draft", // 새 행은 draft 상태로 시작
      companyId: settings.companyId, // 회사 ID 설정
      plant: plant, // plant 정보 추가
    }

    // Add the new day to the list
    const updatedResult = {
      ...result,
      deliveryDetails: [...result.deliveryDetails, newDay],
    }

    setResult(updatedResult)
  }

  // 아침 재고(06:00) 업데이트 함수
  const updateMorningStock = (dayIndex: number, newValue: number) => {
    if (!result || !settings) return

    // Create a deep copy of the result
    const updatedResult = JSON.parse(JSON.stringify(result)) as SimulationResult
    const day = updatedResult.deliveryDetails[dayIndex]

    // 변경 전 아침 재고량 저장 (변화량 계산용)
    const previousMorningStock = day.morningStock

    // 새 재고량 설정
    day.morningStock = newValue

    // 재고량 변화 계산
    const stockChange = newValue - previousMorningStock

    // Convert delivery amount to appropriate unit
    const convertedDeliveryAmount =
      settings.unit === "mm" ? settings.deliveryAmount * (settings.conversionRate || 1) : settings.deliveryAmount

    // 같은 날의 입고 전 재고량 업데이트
    for (let j = 0; j < day.preDeliveryStock.length; j++) {
      // 입고 시간이 06:00 이후인 경우에만 업데이트
      const deliveryHour = Number.parseInt(day.deliveryTimes[j].split(":")[0])
      if (deliveryHour >= 6) {
        day.preDeliveryStock[j] += stockChange
        day.postDeliveryStock[j] = day.preDeliveryStock[j] + convertedDeliveryAmount
      }
    }

    // 같은 날의 저녁 재고량 업데이트
    day.eveningStock += stockChange

    // 다음날부터 모든 날짜의 재고량 업데이트
    if (stockChange !== 0 && dayIndex < updatedResult.deliveryDetails.length - 1) {
      for (let i = dayIndex + 1; i < updatedResult.deliveryDetails.length; i++) {
        const nextDay = updatedResult.deliveryDetails[i]

        // 다음날 아침 재고량 업데이트
        nextDay.morningStock += stockChange

        // 다음날 입고 전 재고량 업데이트
        for (let j = 0; j < nextDay.preDeliveryStock.length; j++) {
          nextDay.preDeliveryStock[j] += stockChange
          nextDay.postDeliveryStock[j] = nextDay.preDeliveryStock[j] + convertedDeliveryAmount
        }

        // 다음날 저녁 재고량 업데이트
        nextDay.eveningStock += stockChange
      }
    }

    // StockLog 재생성
    regenerateStockLog(updatedResult, settings)

    setResult(updatedResult)
  }

  // 저녁 재고(20:00) 업데이트 함수
  const updateEveningStock = (dayIndex: number, newValue: number) => {
    if (!result || !settings) return

    // Create a deep copy of the result
    const updatedResult = JSON.parse(JSON.stringify(result)) as SimulationResult
    const day = updatedResult.deliveryDetails[dayIndex]

    // 변경 전 저녁 재고량 저장 (변화량 계산용)
    const previousEveningStock = day.eveningStock

    // 새 재고량 설정
    day.eveningStock = newValue

    // 재고량 변화 계산
    const stockChange = newValue - previousEveningStock

    // Convert delivery amount to appropriate unit
    const convertedDeliveryAmount =
      settings.unit === "mm" ? settings.deliveryAmount * (settings.conversionRate || 1) : settings.deliveryAmount

    // 다음날부터 모든 날짜의 재고량 업데이트
    if (stockChange !== 0 && dayIndex < updatedResult.deliveryDetails.length - 1) {
      for (let i = dayIndex + 1; i < updatedResult.deliveryDetails.length; i++) {
        const nextDay = updatedResult.deliveryDetails[i]

        // 다음날 아침 재고량 업데이트
        nextDay.morningStock += stockChange

        // 다음날 입고 전 재고량 업데이트
        for (let j = 0; j < nextDay.preDeliveryStock.length; j++) {
          nextDay.preDeliveryStock[j] += stockChange
          nextDay.postDeliveryStock[j] = nextDay.preDeliveryStock[j] + convertedDeliveryAmount
        }

        // 다음날 저녁 재고량 업데이트
        nextDay.eveningStock += stockChange
      }
    }

    // StockLog 재생성
    regenerateStockLog(updatedResult, settings)

    setResult(updatedResult)
  }

  // 입고량 업데이트 함수
  const updateDeliveryQuantity = (dayIndex: number, newQuantity: number) => {
    if (!result || !settings) return

    console.log(`입고량 변경 시작 - 품명: ${settings.productName}, 새 입고량: ${newQuantity}`)

    // Create a deep copy of the result
    const updatedResult = JSON.parse(JSON.stringify(result)) as SimulationResult
    const day = updatedResult.deliveryDetails[dayIndex] as DeliveryDetailWithStatus

    // 기존 입고량 저장
    const oldQuantity = day.deliveryQuantity || settings.deliveryAmount

    // 새 입고량 설정
    day.deliveryQuantity = newQuantity
    day.deliveryAmount = newQuantity

    // factor 적용하여 실제 재고에 반영될 값 계산
    const factor = settings.conversionRate || 1
    const convertedOldAmount = oldQuantity * factor
    const convertedNewAmount = newQuantity * factor
    const quantityChange = convertedNewAmount - convertedOldAmount

    console.log(
      `입고량 변경 - 기존: ${oldQuantity}ton (변환: ${convertedOldAmount}), 새값: ${newQuantity}ton (변환: ${convertedNewAmount}), 변화량: ${quantityChange}`,
    )

    // 입고 후 재고 재계산 - factor 적용된 값으로
    for (let i = 0; i < day.postDeliveryStock.length; i++) {
      day.postDeliveryStock[i] = day.preDeliveryStock[i] + convertedNewAmount
    }

    // 저녁 재고 재계산 - 20:00 이전 입고만 반영
    const deliveriesBefore20Count = day.deliveryTimes.filter((time) => {
      const [hour] = time.split(":").map(Number)
      return hour <= 20 // 20:00 입고도 포함
    }).length

    // 20:00 이전 입고들의 총 변화량만 반영 (factor 적용된 값)
    const totalDeliveryChangeBefore20 = quantityChange * deliveriesBefore20Count
    day.eveningStock += totalDeliveryChangeBefore20

    console.log(
      `저녁 재고 변경 - 20:00 이전 입고 변화량: ${totalDeliveryChangeBefore20}, 새 저녁 재고: ${day.eveningStock}`,
    )

    // 다음날부터 모든 날짜의 재고량 업데이트
    if (totalDeliveryChangeBefore20 !== 0 && dayIndex < updatedResult.deliveryDetails.length - 1) {
      for (let i = dayIndex + 1; i < updatedResult.deliveryDetails.length; i++) {
        const nextDay = updatedResult.deliveryDetails[i] as DeliveryDetailWithStatus

        // 다음날 아침 재고량 업데이트
        nextDay.morningStock += totalDeliveryChangeBefore20

        // 다음날 입고 전 재고량 업데이트
        for (let j = 0; j < nextDay.preDeliveryStock.length; j++) {
          nextDay.preDeliveryStock[j] += totalDeliveryChangeBefore20
          // 다음날의 입고량으로 입고 후 재고 계산 (factor 적용)
          const nextDayQuantity = nextDay.deliveryQuantity || settings.deliveryAmount
          const convertedNextDayAmount = nextDayQuantity * factor
          nextDay.postDeliveryStock[j] = nextDay.preDeliveryStock[j] + convertedNextDayAmount
        }

        // 다음날 저녁 재고량 업데이트
        nextDay.eveningStock += totalDeliveryChangeBefore20
      }
    }

    // StockLog 재생성
    regenerateStockLog(updatedResult, settings)

    setResult(updatedResult)
  }

  // handleRowSelect 함수를 수정
  const handleRowSelect = (dayIndex: number, selected: boolean) => {
    if (selected) {
      setSelectedRows((prev) => [...prev, dayIndex])
    } else {
      setSelectedRows((prev) => prev.filter((index) => index !== dayIndex))
      // 하나라도 선택 해제되면 전체 선택 상태도 해제
      setAllSelected(false)
    }
  }

  // 전체 선택 핸들러 추가
  const handleSelectAll = (selected: boolean) => {
    setAllSelected(selected)
    if (selected && result) {
      // 전송 상태가 아닌 행만 선택 (draft 상태만 선택)
      const selectableIndices = result.deliveryDetails
        .map((detail, index) => ({ detail: detail as DeliveryDetailWithStatus, index }))
        .filter(({ detail }) => detail.status !== "sent")
        .map(({ index }) => index)

      setSelectedRows(selectableIndices)
    } else {
      // 모든 선택 해제
      setSelectedRows([])
    }
  }

  // 확정 버튼 처리 함수
  const handleConfirm = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: "선택된 항목 없음",
        description: "전송할 배차계획을 체크박스로 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    if (result) {
      try {
        // 현재 품명의 기본 업체 찾기
        const defaultCompany = getDefaultCompany(actualProductName)

        if (!defaultCompany) {
          toast({
            title: "기본 업체 없음",
            description: "현재 품명에 대한 기본 업체가 설정되지 않았습니다.",
            variant: "destructive",
          })
          return
        }

        // 선택된 행만 필터링하고 상태를 "sent"로 변경
        const selectedDeliveries = selectedRows.map((idx) => {
          const detail = { ...result.deliveryDetails[idx] } as DeliveryDetailWithStatus

          // 상태 업데이트
          detail.status = "sent"

          // 각 행별로 선택된 업체 ID 가져오기
          const rowDetail = result.deliveryDetails[idx] as DeliveryDetailWithStatus
          const selectedCompanyId = rowDetail.companyId || defaultCompany.id

          // plant 값 설정
          detail.plant = plant

          // 각 행별로 선택된 업체 ID 설정
          detail.companyId = selectedCompanyId

          // 품명 설정 - 실제 제품명 사용 (bio2_ 접두사 없이)
          detail.productName = dbProductName

          // 입고량 설정 - 수정된 입고량이 있으면 사용, 없으면 기본값 사용
          const deliveryQuantity = detail.deliveryQuantity || settings.deliveryAmount
          detail.deliveryAmount = deliveryQuantity
          detail.deliveryQuantity = deliveryQuantity

          console.log(`Row ${idx} delivery quantity: ${deliveryQuantity}`)

          return detail
        })

        console.log(
          "Saving selected deliveries with delivery quantities:",
          selectedDeliveries.map((d) => ({
            date: d.date,
            companyId: d.companyId,
            deliveryCount: d.deliveryCount,
            deliveryQuantity: d.deliveryQuantity,
            deliveryAmount: d.deliveryAmount,
            plant: d.plant,
            productName: d.productName,
          })),
        )

        // Final 페이지로 선택된 데이터 추가 (Supabase에도 저장됨)
        const success = await addToFinal(selectedDeliveries)

        if (success) {
          // 배차계획 전송 히스토리 저장
          const userName = getCurrentUserName()
          const chemicalEnum = PRODUCT_TO_CHEMICAL_ENUM[actualProductName] || "SAND"

          await saveEditHistory(
            userName,
            plant,
            chemicalEnum,
            today,
            "draft_send",
            null,
            {
              sentCount: selectedRows.length,
              deliveryDates: selectedDeliveries.map((d) => d.date),
              totalDeliveryCount: selectedDeliveries.reduce((sum, d) => sum + d.deliveryCount, 0),
            },
            `배차계획 전송 - ${selectedRows.length}개 계획 Final로 전송`,
          )

          // UI 상태 직접 업데이트 (DB ID가 없는 draft 행들이므로 updateDeliveryStatus 대신 직접 업데이트)
          const updatedResult = JSON.parse(JSON.stringify(result)) as SimulationResult
          selectedRows.forEach((idx) => {
            const detail = updatedResult.deliveryDetails[idx] as DeliveryDetailWithStatus
            detail.status = "sent"
          })
          setResult(updatedResult)

          toast({
            title: "배차계획 확정 완료",
            description: `${selectedRows.length}개의 배차계획이 DB에 저장되고 Final로 이동되었습니다.`,
            variant: "default",
          })

          // 알림톡 발송 API 호출
          try {
            // 선택된 배차계획 중 입고 대수가 0보다 큰 것들만 필터링
            const validDeliveryIndices = selectedRows.filter((idx) => {
              const detail = result.deliveryDetails[idx]
              return detail && detail.deliveryCount > 0
            })

            console.log(
              `전체 선택된 항목: ${selectedRows.length}개, 입고대수가 있는 항목: ${validDeliveryIndices.length}개`,
            )

            // 입고 대수가 있는 경우에만 알림톡 발송
            if (validDeliveryIndices.length > 0) {
              const chemical =
                PRODUCT_TO_CHEMICAL_MAP[actualProductName as keyof typeof PRODUCT_TO_CHEMICAL_MAP] ||
                actualProductName.toUpperCase()

              // 배차대수가 1 이상인 배차계획에 포함된 업체들만 가져오기
              const validCompanyIds = new Set<number>()

              validDeliveryIndices.forEach((idx) => {
                const detail = result.deliveryDetails[idx] as DeliveryDetailWithStatus
                const companyId = detail.companyId || defaultCompany.id
                validCompanyIds.add(companyId)
              })

              // 실제 배차가 있는 업체들만 필터링
              const relatedCompanies = companies.filter(
                (company) => company.productName === actualProductName && validCompanyIds.has(company.id),
              )

              console.log(
                "배차대수가 있는 업체들:",
                relatedCompanies.map((c) => c.name),
              )

              // 업체별 연락처 정보 구성
              const companiesData = relatedCompanies.map((company) => {
                // phone 배열이 있는지 확인하고, 없으면 빈 배열 사용
                const phoneNumbers = Array.isArray(company.phone) ? company.phone : []

                console.log(`업체 ${company.name}의 연락처:`, phoneNumbers)

                return {
                  company: company.name,
                  phone_no: phoneNumbers,
                }
              })

              // 실제 알림톡을 받을 업체가 있는 경우에만 발송
              if (companiesData.length > 0) {
                const payload: NotificationPayload = {
                  plant: plant === "bio1" ? "1" : "2",
                  chemical: chemical,
                  companies: companiesData,
                }

                const notificationResult = await sendNotificationRequest(payload)

                if (notificationResult.success) {
                  toast({
                    title: "알림톡 발송 요청 성공",
                    description: notificationResult.message,
                    variant: "default",
                  })
                } else {
                  throw new Error(notificationResult.message)
                }
              } else {
                console.log("알림톡을 받을 업체가 없습니다.")
                toast({
                  title: "알림톡 발송 생략",
                  description: "배차대수가 있는 업체가 없어 알림톡을 발송하지 않았습니다.",
                  variant: "default",
                })
              }
            } else {
              console.log("입고 대수가 0인 배차계획만 선택되어 알림톡을 발송하지 않습니다.")
              toast({
                title: "알림톡 발송 생략",
                description: "선택된 배차계획에 입고 대수가 없어 알림톡을 발송하지 않았습니다.",
                variant: "default",
              })
            }
          } catch (error) {
            console.error("알림톡 발송 요청 중 오류:", error)
            toast({
              title: "알림톡 발송 요청 실패",
              description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
              variant: "destructive",
            })
          }

          // 선택 초기화
          setSelectedRows([])
          setAllSelected(false)
        } else {
          toast({
            title: "저장 실패",
            description: "일부 배차계획을 저장하는데 실패했습니다.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("배차계획 확정 중 오류:", error)
        toast({
          title: "오류 발생",
          description: "배차계획을 확정하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    }
  }

  // 삭제 버튼 클릭 핸들러 추가
  const handleDeleteClick = () => {
    if (selectedRows.length === 0) {
      toast({
        title: "선택된 항목 없음",
        description: "삭제할 배차계획을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsDeleteDialogOpen(true)
  }

  // 삭제 확인 핸들러 수정 - draft 행은 로컬에서만 삭제
  const handleConfirmDelete = () => {
    if (selectedRows.length === 0) return

    try {
      if (!result) return

      // Draft 행들은 데이터베이스에 저장되지 않은 시뮬레이션 결과이므로 로컬 상태에서만 제거
      const updatedResult = JSON.parse(JSON.stringify(result)) as SimulationResult

      // 선택된 인덱스를 내림차순으로 정렬하여 뒤에서부터 삭제 (인덱스 변화 방지)
      const sortedIndices = [...selectedRows].sort((a, b) => b - a)

      sortedIndices.forEach((index) => {
        updatedResult.deliveryDetails.splice(index, 1)
      })

      // StockLog도 재생성
      if (settings) {
        regenerateStockLog(updatedResult, settings)
      }

      setResult(updatedResult)

      toast({
        title: "배차계획 삭제 완료",
        description: `${selectedRows.length}개의 배차계획이 삭제되었습니다.`,
        variant: "default",
      })

      // 선택 초기화
      setSelectedRows([])
      setAllSelected(false)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("배차계획 삭제 중 오류:", error)
      toast({
        title: "오류 발생",
        description: "배차계획을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (!settings) return null

  return (
    <div>
      <div className="flex justify-between items-center mb-6 w-full">
        <div className={`flex-1 ${result ? "mr-4" : ""}`}>
          <SettingsSummary settings={settings} onOpenSettings={() => setIsSettingsOpen(true)} />
        </div>

        <div className="flex gap-4 flex-shrink-0">
          {result && (
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 h-9 px-3 flex items-center gap-1 bg-transparent"
              onClick={toggleView}
              aria-label={activeTab === "plan" ? "재고 차트" : "배차 계획"}
            >
              {activeTab === "plan" ? <BarChart className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              <span>그래프</span>
            </Button>
          )}
          {/* 비교 버튼 - 특정 chemical에서만 표시하고 result가 있을 때만 표시 */}
          {result &&
            CHEMICALS_WITH_COMPARISON.some(
              (chemical) => pathname.includes(`/${chemical}`) || pathname.includes(`/bio2/${chemical}`),
            ) && (
              <Button
                onClick={() => setIsComparisonPanelOpen(!isComparisonPanelOpen)}
                variant="outline"
                size="sm"
                className={`h-9 px-3 text-sm ${
                  isComparisonPanelOpen
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                비교
              </Button>
            )}
          {(pathname.includes("/sand/draft") ||
            pathname.includes("/kaolin/draft") ||
            pathname.includes("/urea/draft") ||
            pathname.includes("/sulfate/draft") ||
            pathname.includes("/hydrated/draft") ||
            pathname.includes("/sodium/draft")) &&
            result && (
              <>
                <Button
                  onClick={handleDeleteClick}
                  className="bg-red-600 hover:bg-red-700 h-9 w-9 p-0"
                  aria-label="삭제"
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="bg-green-600 hover:bg-green-700 h-9 px-3 flex items-center gap-1"
                  aria-label="확정"
                >
                  <Send className="h-4 w-4" />
                  <span>전송</span>
                </Button>
              </>
            )}
        </div>
      </div>

      <Card className="w-full shadow-sm border-gray-200">
        <CardContent className="p-6">
          <SettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            settings={settings}
            setSettings={setSettings}
            onGenerate={generatePlan}
            companies={companies.filter((company) => company.productName === actualProductName)}
            plant={plant} // 새로 추가
          />

          {activeTab === "plan" ? (
            result ? (
              <DispatchPlan
                result={result}
                settings={settings}
                onUpdateDeliveryTime={updateDeliveryTime}
                onUpdateDeliveryCount={onUpdateDeliveryCount}
                onUpdateDeliveryQuantity={updateDeliveryQuantity} // 새로 추가
                onAddNewRow={addNewRow}
                setSettings={setSettings}
                onUpdateMorningStock={updateMorningStock}
                onUpdateEveningStock={updateEveningStock}
                selectedRows={selectedRows}
                onSelectRow={handleRowSelect}
                onSelectAll={handleSelectAll}
                allSelected={allSelected}
                companies={companies}
              />
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-md">
                [작성] 버튼을 클릭하여 배차 계획을 생성하세요.
              </div>
            )
          ) : result ? (
            <StockChart stockLog={result.stockLog} settings={settings} />
          ) : (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-md">
              설정을 완료한 후 '작성'버튼을 클릭하여 배차 계획을 생성하세요.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 추가 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>배차계획 삭제 확인</DialogTitle>
            <DialogDescription className="pt-2 text-red-500">
              <AlertTriangle className="h-5 w-5 inline-block mr-1" />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>정말로 선택한 {selectedRows.length}개의 배차계획을 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-500 mt-2">삭제된 배차계획은 복구할 수 없습니다.</p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleConfirmDelete} variant="destructive">
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비교 패널 */}
      {isComparisonPanelOpen && (
        <ComparisonPanel
          open={isComparisonPanelOpen}
          onOpenChange={setIsComparisonPanelOpen}
          productName={actualProductName}
          plant={plant}
          draftResult={result} // draft 데이터 전달
        />
      )}
    </div>
  )
}
