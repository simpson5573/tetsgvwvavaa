import type {
  DispatchSettings,
  SimulationResult,
  DeliveryDetail,
  StockLogEntry,
  TimeBlock,
} from "@/components/draft-system"
import { differenceInDays, parseISO, addDays } from "date-fns"

export function simulateDispatch(settings: DispatchSettings): SimulationResult {
  const { minLevel, maxLevel, currentStock, deliveryAmount, dailyUsage, startDate, endDate, unit, conversionRate } =
    settings

  // Calculate plan days from start and end dates
  const planDays = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1

  console.log(`시뮬레이션 시작 - 기간: ${planDays}일, 환산계수: ${conversionRate}`)

  // 1. 일별 사용량 스케줄 준비
  const hourlyUsageByDay: number[][] = []

  // Process each day's usage configuration
  for (let i = 0; i < planDays; i++) {
    // 해당 날짜의 사용량 설정 직접 가져오기 (날짜 인덱스 기반)
    const dayConfig = Array.isArray(dailyUsage)
      ? i < dailyUsage.length
        ? dailyUsage[i]
        : dailyUsage[0] || { type: "single", value: 15 }
      : { type: "single", value: dailyUsage }

    const hourlyUsage: number[] = Array(24).fill(0)

    if (dayConfig.type === "single") {
      // Single value - ton을 mm로 환산하여 분배
      const valueInTon = dayConfig.value as number
      const valueInMm = unit === "mm" ? valueInTon * (conversionRate || 1) : valueInTon
      for (let hour = 0; hour < 24; hour++) {
        hourlyUsage[hour] = valueInMm / 24
      }
    } else {
      // Hourly configuration - 각 시간대별로 ton을 mm로 환산
      const timeBlocks = dayConfig.value as TimeBlock[]

      for (const block of timeBlocks) {
        const { startHour, endHour, usage } = block
        const hoursInBlock = endHour - startHour
        const usageInMm = unit === "mm" ? usage * (conversionRate || 1) : usage
        const hourlyRate = hoursInBlock > 0 ? usageInMm / hoursInBlock : 0

        for (let hour = startHour; hour < endHour; hour++) {
          hourlyUsage[hour] = hourlyRate
        }
      }
    }

    hourlyUsageByDay.push(hourlyUsage)
  }

  // 2. 초기 상태 설정
  const startDt = new Date(`${startDate}T00:00:00+09:00`)
  let stock = currentStock

  // 입고량을 적절한 단위로 환산
  const convertedDeliveryAmount = unit === "mm" ? deliveryAmount * (conversionRate || 1) : deliveryAmount

  const deliveryDetails: Record<
    string,
    {
      date: string
      morningStock: number | null
      eveningStock: number | null
      deliveryCount: number
      deliveryTimes: string[]
      preDeliveryStock: number[]
      postDeliveryStock: number[]
      lastDeliveryHour: number | null
    }
  > = {}

  // Pre-generate all dates in the simulation period
  const allDates: string[] = []
  for (let i = 0; i < planDays; i++) {
    const currentDate = addDays(new Date(startDate), i)
    const dateStr = formatDateToYYYYMMDD(currentDate)
    allDates.push(dateStr)

    deliveryDetails[dateStr] = {
      date: dateStr,
      morningStock: i === 0 ? currentStock : null,
      eveningStock: null,
      deliveryCount: 0,
      deliveryTimes: [],
      preDeliveryStock: [],
      postDeliveryStock: [],
      lastDeliveryHour: null,
    }
  }

  const stockLog: StockLogEntry[] = []

  // 3. 시간 단위 시뮬레이션 루프
  for (let hour = 0; hour < planDays * 24; hour++) {
    const dayIndex = Math.floor(hour / 24)
    const currentDate = addDays(new Date(startDate), dayIndex)
    const currentHour = hour % 24
    const day = formatDateToYYYYMMDD(currentDate)

    if (!deliveryDetails[day]) {
      console.error(`Day ${day} not found in deliveryDetails.`)
      continue
    }

    const hourlyUsage = hourlyUsageByDay[dayIndex][currentHour]
    const info = deliveryDetails[day]

    // 3-1. 06:00 재고량 기록 및 기준점 설정
    if (currentHour === 6) {
      if (dayIndex === 0) {
        stock = currentStock
        info.morningStock = currentStock
      } else {
        const previousDayKey = allDates[dayIndex - 1]
        const previousDayInfo = deliveryDetails[previousDayKey]

        if (previousDayInfo && previousDayInfo.eveningStock !== null) {
          let nightStock = previousDayInfo.eveningStock

          // 전날 20:00 이후 입고량 추가
          const nightDeliveries = previousDayInfo.deliveryTimes.filter((time) => {
            const [hour] = time.split(":").map(Number)
            return hour > 20
          })

          const nightDeliveryAmount = nightDeliveries.length * convertedDeliveryAmount
          nightStock += nightDeliveryAmount

          // 야간 사용량 계산
          const nightUsage = (10 * hourlyUsageByDay[dayIndex - 1].reduce((sum, rate) => sum + rate, 0)) / 24

          stock = Math.max(0, nightStock - nightUsage)
          info.morningStock = Number.parseFloat(stock.toFixed(2))

          console.log(
            `${day} 아침 재고 계산: 전날저녁(${previousDayInfo.eveningStock}) + 야간입고(${nightDeliveryAmount}) - 야간사용(${nightUsage.toFixed(2)}) = ${stock.toFixed(2)}`,
          )
        } else if (info.morningStock === null) {
          info.morningStock = Number.parseFloat(stock.toFixed(2))
        }
      }
    }

    // 3-2. 배차 결정 (7시~19시)
    if (currentHour >= 7 && currentHour <= 19) {
      const predict = stock - hourlyUsage
      const lastH = info.lastDeliveryHour

      if (predict < minLevel && (lastH === null || currentHour - lastH >= 3)) {
        const deliveryTime = `${currentHour.toString().padStart(2, "0")}:00`
        const preStock = Number.parseFloat(stock.toFixed(1))

        info.deliveryTimes.push(deliveryTime)
        info.preDeliveryStock.push(preStock)

        stock += convertedDeliveryAmount

        info.postDeliveryStock.push(Number.parseFloat(stock.toFixed(1)))
        info.deliveryCount += 1
        info.lastDeliveryHour = currentHour
      }
    }

    // 3-3. 20:00 "안전 보정"
    if (currentHour === 20) {
      info.eveningStock = Number.parseFloat(stock.toFixed(2))

      let expectedUsage = 0
      const nextDayIndex = dayIndex + 1

      if (nextDayIndex < hourlyUsageByDay.length) {
        const tonightUsage = hourlyUsageByDay[dayIndex].slice(20).reduce((sum, rate) => sum + rate, 0)
        const tomorrowMorningUsage = hourlyUsageByDay[nextDayIndex].slice(0, 6).reduce((sum, rate) => sum + rate, 0)
        expectedUsage = tonightUsage + tomorrowMorningUsage
      } else {
        const todayTotal = hourlyUsageByDay[dayIndex].reduce((sum, rate) => sum + rate, 0)
        const avgHourly = todayTotal / 24
        expectedUsage = avgHourly * 10
      }

      const predictedMorningStock = Math.max(0, stock - expectedUsage)

      if (predictedMorningStock < minLevel) {
        for (let h = 19; h > 6; h--) {
          const lastH = info.lastDeliveryHour
          if (lastH === null || h - lastH >= 3) {
            const ts = `${h.toString().padStart(2, "0")}:00`

            let tempStock = stock
            for (let tempH = 20; tempH > h; tempH--) {
              tempStock += hourlyUsageByDay[dayIndex][tempH - 1]
            }

            const pre = Number.parseFloat(tempStock.toFixed(1))

            info.preDeliveryStock.unshift(pre)
            tempStock = pre + convertedDeliveryAmount
            info.postDeliveryStock.unshift(Number.parseFloat(tempStock.toFixed(1)))
            info.deliveryTimes.unshift(ts)
            info.deliveryCount += 1
            info.lastDeliveryHour = h

            stock = stock + convertedDeliveryAmount
            break
          }
        }

        info.eveningStock = Number.parseFloat(stock.toFixed(2))
      }

      console.log(`${day} 저녁 재고: ${info.eveningStock}, 예상 다음날 아침: ${predictedMorningStock.toFixed(2)}`)
    }

    // 3-4. 시간 로그 기록 및 소비 차감
    const timestamp = `${day} ${currentHour.toString().padStart(2, "0")}:00`
    stockLog.push({
      timestamp,
      stock: Number.parseFloat(stock.toFixed(4)),
    })

    stock -= hourlyUsage
  }

  // 5. 최종 결과 변환
  const finalDeliveryDetails: DeliveryDetail[] = allDates.map((dateStr) => {
    const d = deliveryDetails[dateStr]

    // 입고시간 시각 오름차순 정렬
    const sortedIndices = d.deliveryTimes
      .map((time, index) => ({ time, index }))
      .sort((a, b) => {
        const hourA = Number.parseInt(a.time.split(":")[0])
        const hourB = Number.parseInt(b.time.split(":")[0])
        return hourA - hourB
      })
      .map((item) => item.index)

    const sortedTimes = sortedIndices.map((i) => d.deliveryTimes[i])
    const sortedPreStock = sortedIndices.map((i) => d.preDeliveryStock[i])
    const sortedPostStock = sortedIndices.map((i) => d.postDeliveryStock[i])

    return {
      date: d.date,
      morningStock: d.morningStock || 0,
      eveningStock: d.eveningStock || 0,
      deliveryCount: d.deliveryCount,
      deliveryTimes: sortedTimes,
      preDeliveryStock: sortedPreStock,
      postDeliveryStock: sortedPostStock,
    }
  })

  return {
    deliveryDetails: finalDeliveryDetails,
    stockLog,
  }
}

// 간단한 배차 계획 생성 함수 (통합 함수 사용)
export function generateDispatchPlan(settings: DispatchSettings): DeliveryDetail[] {
  try {
    const result = simulateDispatch(settings)
    return result.deliveryDetails.map((detail, index) => ({
      ...detail,
      id: `dispatch-${Date.now()}-${index}`,
      status: "draft",
      companyId: settings.companyId,
      productName: settings.productName,
      deliveryQuantity: settings.deliveryAmount,
    }))
  } catch (error) {
    console.error("배차 계획 생성 중 오류:", error)
    return []
  }
}

// Helper function
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
