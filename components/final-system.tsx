"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDispatchStore } from "@/lib/dispatch-store"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Truck, RotateCcw, Edit, Trash2, Settings, Check, Eye, EyeOff, History } from "lucide-react"
import { useCompanyStore } from "@/lib/company-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import TimeEditDialog from "@/components/time-edit-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  deleteDispatchPlan,
  requestCancelDispatchPlan,
  emergencyCancelAllDispatchPlans,
  recalculateStocksWithNewSettings,
  updateDispatchPlan,
  updateTimeAndNote,
} from "@/lib/dispatch-service"
import FinalSettingsDialog from "@/components/final-settings-dialog"
import DeliveryQuantityEditDialog from "@/components/delivery-quantity-edit-dialog"
import EditHistoryModal from "@/components/edit-history-modal"
import { sendNotificationRequest, PRODUCT_TO_CHEMICAL_MAP } from "@/lib/notification-api"
import { getBioSettingOrDefault } from "@/lib/bio-setting-service"
import { saveEditHistory } from "@/lib/edit-history-service"
import { getCurrentUserName } from "@/lib/auth-service"

// chemical 코드를 실제 제품명으로 매핑
const CHEMICAL_TO_PRODUCT = {
  hydrated: "소석회",
  kaolin: "고령토",
  sand: "유동사",
  sodium: "중탄산나트륨",
  sulfate: "황산암모늄",
  urea: "요소수",
}

// 페이지 제목 매핑
const PAGE_TITLES = {
  bio1: "Bio #1",
  bio2: "Bio #2",
}

// 기본 설정값 매핑
const DEFAULT_SETTINGS = {
  hydrated: { deliveryAmount: 30, dailyUsage: 14, morningStock: 50 },
  kaolin: { deliveryAmount: 30, dailyUsage: 35, morningStock: 50 },
  sand: { deliveryAmount: 30, dailyUsage: 35, morningStock: 50 },
  sodium: { deliveryAmount: 30, dailyUsage: 20, morningStock: 17 },
  sulfate: { deliveryAmount: 30, dailyUsage: 12, morningStock: 3000 },
  urea: { deliveryAmount: 20, dailyUsage: 10, morningStock: 2500 },
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

interface FinalSystemProps {
  bio: string
  chemical: string
}

export default function FinalSystem({ bio, chemical }: FinalSystemProps) {
  const { toast } = useToast()

  const {
    finalDeliveryDetails = [],
    settings,
    returnToFinal,
    removeFromFinal,
    loadFinalDeliveryDetails,
    requestCancel,
    loading,
    error,
  } = useDispatchStore()
  const { companies, loadCompanies } = useCompanyStore()

  const [timeEditOpen, setTimeEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [quantityEditOpen, setQuantityEditOpen] = useState(false)
  const [editingQuantityItem, setEditingQuantityItem] = useState<any>(null)
  const [hideCancelledRows, setHideCancelledRows] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [finalSettings, setFinalSettings] = useState({
    deliveryAmount: 30,
    dailyUsage: 14,
    morningStock: 50,
    productName: "소석회",
  })

  const productName = CHEMICAL_TO_PRODUCT[chemical as keyof typeof CHEMICAL_TO_PRODUCT]
  const pageTitle = PAGE_TITLES[bio as keyof typeof PAGE_TITLES]
  const chemicalEnum = PRODUCT_TO_CHEMICAL_ENUM[productName] || "SAND"

  useEffect(() => {
    // 기본 설정값 설정
    const defaultSetting = DEFAULT_SETTINGS[chemical as keyof typeof DEFAULT_SETTINGS]
    setFinalSettings({
      ...defaultSetting,
      productName,
    })
  }, [bio, chemical, productName])

  useEffect(() => {
    const loadData = async () => {
      await loadCompanies()
      await loadFinalDeliveryDetails(bio, productName)
    }
    loadData()
  }, [loadCompanies, loadFinalDeliveryDetails, bio, productName])

  useEffect(() => {
    if (error) {
      toast({ title: "오류 발생", description: error, variant: "destructive" })
    }
  }, [error, toast])

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "yyyy년 MM월 dd일 (E)", { locale: ko })
  }

  const getLevelColor = (level: number, status: string) => {
    if (status === "done" || status === "cancel") return "text-gray-400"
    return "text-green-600"
  }

  const getCompanyName = (companyId: number | undefined): string => {
    if (!companyId) {
      const defaultCompany = companies.find((c) => c.productName === productName && c.isDefault === true)
      return defaultCompany ? defaultCompany.name : "-"
    }
    const company = companies.find((c) => c.id === companyId)
    return company ? company.name : "-"
  }

  const isManageButtonEnabled = (status: string) => status !== "done"
  const isTimeEditButtonEnabled = (status: string, deliveryCount: number) =>
    deliveryCount > 0 && (status === "modify" || status === "sent" || status === "confirmed")

  const getRowClassName = (index: number, status: string) => {
    const baseClass = index % 2 === 0 ? "bg-white" : "bg-gray-50"
    return status === "cancel" ? `${baseClass}` : baseClass
  }

  const getCellTextColor = (status: string) => {
    switch (status) {
      case "cancel":
        return "text-gray-400"
      case "cancelrequest":
        return "text-orange-700"
      default:
        return "text-gray-700"
    }
  }

  // 필터링된 데이터 가져오기
  const getFilteredDeliveryDetails = () => {
    if (!hideCancelledRows) {
      return finalDeliveryDetails
    }
    return finalDeliveryDetails.filter((item) => item.status !== "cancel" && item.status !== "cancelrequest")
  }

  const handleCancelRequest = async (item: any) => {
    if (!item.id) {
      toast({ title: "오류", description: "항목 ID를 찾을 수 없습니다.", variant: "destructive" })
      return
    }

    const userName = getCurrentUserName()
    const success = await requestCancelDispatchPlan(item.id, bio, productName)

    if (success) {
      // 편집 히스토리 저장
      await saveEditHistory(
        userName,
        bio,
        chemicalEnum,
        item.date,
        "cancel_request",
        { status: item.status },
        { status: "cancelrequest" },
        `${formatDate(item.date)} 배차계획 취소 요청`,
      )

      toast({
        title: "취소 요청 완료",
        description: `${formatDate(item.date)} 항목의 취소가 요청되었습니다.`,
        variant: "default",
      })
      await loadFinalDeliveryDetails(bio, productName)

      // 알림톡 API 호출
      try {
        const productCompanies = companies.filter((c) => c.productName === productName)
        if (productCompanies.length > 0) {
          const companyData = productCompanies.map((company) => ({
            company: company.name,
            phone_no: company.phone || [],
          }))

          const plantValue = bio === "bio1" ? "1" : "2"

          const notificationPayload = {
            plant: plantValue as "1" | "2",
            chemical: PRODUCT_TO_CHEMICAL_MAP[productName] || "HYDRATED",
            companies: companyData,
          }

          const notificationResult = await sendNotificationRequest(notificationPayload)
          if (notificationResult.success) {
            toast({
              title: "알림톡 발송 완료",
              description: "취소 요청 알림톡이 발송되었습니다.",
              variant: "default",
            })
          }
        }
      } catch (error) {
        console.error("알림톡 발송 중 오류:", error)
      }
    } else {
      toast({ title: "취소 요청 실패", description: "취소 요청에 실패했습니다.", variant: "destructive" })
    }
  }

  const handleEmergencyCancel = async () => {
    console.log("긴급취소 버튼 클릭됨")

    const userName = getCurrentUserName()
    const result = await emergencyCancelAllDispatchPlans(bio, productName)

    if (result.success) {
      if (result.count > 0) {
        // 편집 히스토리 저장
        await saveEditHistory(
          userName,
          bio,
          chemicalEnum,
          new Date().toISOString().split("T")[0],
          "emergency_cancel",
          null,
          { cancelled_count: result.count },
          `긴급취소 실행 - ${result.count}개 항목 취소`,
        )

        toast({ title: "긴급취소 완료", description: `${result.count}개 항목이 취소되었습니다.`, variant: "default" })
        await loadFinalDeliveryDetails(bio, productName)

        // 긴급취소 알림톡 발송
        try {
          const usedCompanyIds = new Set(
            finalDeliveryDetails.filter((item) => item.companyId).map((item) => item.companyId),
          )

          const usedCompanies = companies.filter(
            (company) => usedCompanyIds.has(company.id) && company.productName === productName,
          )

          if (usedCompanies.length > 0) {
            const companyData = usedCompanies.map((company) => ({
              company: company.name,
              phone_no: company.phone || [],
            }))

            const plantValue = bio === "bio1" ? "1" : "2"

            const notificationPayload = {
              plant: plantValue as "1" | "2",
              chemical: PRODUCT_TO_CHEMICAL_MAP[productName] || "HYDRATED",
              companies: companyData,
            }

            const notificationResult = await sendNotificationRequest(notificationPayload)
            if (notificationResult.success) {
              toast({
                title: "긴급취소 알림톡 발송 완료",
                description: "긴급취소 알림톡이 발송되었습니다.",
                variant: "default",
              })
            }
          }
        } catch (error) {
          console.error("긴급취소 알림톡 발송 중 오류:", error)
        }
      } else {
        toast({ title: "취소할 항목 없음", description: "취소 가능한 항목이 없습니다.", variant: "default" })
      }
    } else {
      toast({ title: "긴급취소 실패", description: "긴급취소에 실패했습니다.", variant: "destructive" })
    }
  }

  const handleTimeEdit = (item: any) => {
    setEditingItem(item)
    setTimeEditOpen(true)
  }

  const handleTimeAndNoteSave = async (newTimes: string[], note: string, newDeliveryCount: number) => {
    if (!editingItem?.id) return

    const userName = getCurrentUserName()
    const oldTimes = Array.isArray(editingItem.deliveryTimes) ? editingItem.deliveryTimes : ["08:00"]
    const success = await updateTimeAndNote(editingItem.id, bio, productName, newTimes, note, newDeliveryCount)

    if (success) {
      // 편집 히스토리 저장
      await saveEditHistory(
        userName,
        bio,
        chemicalEnum,
        editingItem.date,
        "time_change",
        {
          times: oldTimes,
          note: editingItem.note || "",
          deliveryCount: editingItem.deliveryCount,
        },
        {
          times: newTimes,
          note: note,
          deliveryCount: newDeliveryCount,
        },
        `${formatDate(editingItem.date)} 입고시간 변경: ${oldTimes.join(", ")} → ${newTimes.join(", ")}`,
      )

      toast({
        title: "수정 완료",
        description: "입고시간과 변경 사유가 성공적으로 수정되었습니다.",
        variant: "default",
      })
      await loadFinalDeliveryDetails(bio, productName)

      // 시간변경 알림톡 발송
      try {
        const targetCompany = companies.find((c) => c.id === editingItem.companyId && c.productName === productName)

        if (targetCompany) {
          const companyData = [
            {
              company: targetCompany.name,
              phone_no: targetCompany.phone || [],
            },
          ]

          const plantValue = bio === "bio1" ? "1" : "2"

          const notificationPayload = {
            plant: plantValue as "1" | "2",
            chemical: PRODUCT_TO_CHEMICAL_MAP[productName] || "HYDRATED",
            companies: companyData,
          }

          const notificationResult = await sendNotificationRequest(notificationPayload)
          if (notificationResult.success) {
            toast({
              title: "알림톡 발송 완료",
              description: "시간 변경 알림톡이 발송되었습니다.",
              variant: "default",
            })
          }
        }
      } catch (error) {
        console.error("알림톡 발송 중 오류:", error)
      }
    } else {
      toast({ title: "수정 실패", description: "입고시간과 변경 사유 수정에 실패했습니다.", variant: "destructive" })
    }
  }

  const handleSettingsApply = async (newSettings: any) => {
    try {
      const userName = getCurrentUserName()
      const oldSettings = { ...finalSettings }

      setFinalSettings(newSettings)

      const actualProductName = productName.replace("bio2_", "")
      const detectedPlant = productName.startsWith("bio2_") ? "bio2" : bio
      const bioSetting = await getBioSettingOrDefault(detectedPlant, actualProductName)

      const success = await recalculateStocksWithNewSettings(bio, productName, {
        morningStock: newSettings.morningStock,
        dailyUsage: newSettings.dailyUsage,
        dailyUsageValues: newSettings.dailyUsageValues || Array(10).fill(newSettings.dailyUsage),
        deliveryAmount: newSettings.deliveryAmount || finalSettings.deliveryAmount,
        conversionRate: bioSetting.factor || 1, // factor 적용
      })

      if (success) {
        // 편집 히스토리 저장
        await saveEditHistory(
          userName,
          bio,
          chemicalEnum,
          new Date().toISOString().split("T")[0],
          "calibration",
          oldSettings,
          newSettings,
          `재고량 캘리브레이션 실행 - 아침재고: ${newSettings.morningStock}, 일일사용량: ${newSettings.dailyUsage} (factor: ${bioSetting.factor || 1})`,
        )

        toast({
          title: "설정 적용 완료",
          description: "재고가 새로운 설정에 따라 재계산되었습니다.",
          variant: "default",
        })
        await loadFinalDeliveryDetails(bio, productName)
      } else {
        toast({ title: "설정 적용 실패", description: "설정 적용 중 오류가 발생했습니다.", variant: "destructive" })
      }
    } catch (error) {
      console.error("설정 적용 중 오류:", error)
      toast({ title: "설정 적용 실패", description: "설정 적용 중 오류가 발생했습니다.", variant: "destructive" })
    }
  }

  const handleQuantityEdit = (item: any) => {
    setEditingQuantityItem(item)
    setQuantityEditOpen(true)
  }

  const handleQuantitySave = async (newQuantity: number) => {
    if (!editingQuantityItem?.id) return

    const userName = getCurrentUserName()
    const oldQuantity = editingQuantityItem.deliveryQuantity || 0

    // factor 값 가져오기
    const actualProductName = productName.replace("bio2_", "")
    const detectedPlant = productName.startsWith("bio2_") ? "bio2" : bio
    const bioSetting = await getBioSettingOrDefault(detectedPlant, actualProductName)
    const factor = bioSetting.factor || 1

    console.log(`입고량 수정 - 품명: ${actualProductName}, factor: ${factor}, 새 입고량: ${newQuantity}ton`)

    const success = await updateDispatchPlan(
      editingQuantityItem.id,
      {
        deliveryQuantity: newQuantity,
        deliveryAmount: newQuantity,
        status: "modify",
      },
      bio,
      productName,
    )

    if (success) {
      // 편집 히스토리 저장
      await saveEditHistory(
        userName,
        bio,
        chemicalEnum,
        editingQuantityItem.date,
        "quantity_change",
        { quantity: oldQuantity },
        { quantity: newQuantity },
        `${formatDate(editingQuantityItem.date)} 입고량 변경: ${oldQuantity} → ${newQuantity} (factor: ${factor} 적용)`,
      )

      toast({
        title: "입고량 수정 완료",
        description: `입고량이 성공적으로 수정되었습니다. (factor ${factor} 적용)`,
        variant: "default",
      })
      await loadFinalDeliveryDetails(bio, productName)
    } else {
      toast({
        title: "입고량 수정 실패",
        description: "입고량 수정에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const renderStatusBadge = (status: string, deliveryCount: number | undefined) => {
    if (!deliveryCount || deliveryCount <= 0) return <span></span>
    switch (status) {
      case "draft":
        return <Badge variant="draft">Draft</Badge>
      case "sent":
        return <Badge variant="sent">전송</Badge>
      case "confirmed":
        return <Badge variant="confirmed">확정</Badge>
      case "modify":
        return <Badge variant="modify">수정</Badge>
      case "done":
        return <Badge variant="done">완료</Badge>
      case "cancelrequest":
        return (
          <Badge variant="cancelrequest" className="whitespace-nowrap">
            취소요청
          </Badge>
        )
      case "cancel":
        return <Badge variant="cancel">취소</Badge>
      default:
        return <Badge variant="draft">Draft</Badge>
    }
  }

  const handleReturnToDraft = async (item: any) => {
    if (!item.id) {
      toast({ title: "오류", description: "항목 ID를 찾을 수 없습니다.", variant: "destructive" })
      return
    }

    const userName = getCurrentUserName()

    if (item.status === "modify") {
      const success = await updateDispatchPlan(item.id, { status: "sent" }, bio, productName)
      if (success) {
        // 편집 히스토리 저장
        await saveEditHistory(
          userName,
          bio,
          chemicalEnum,
          item.date,
          "status_change",
          { status: "modify" },
          { status: "sent" },
          `${formatDate(item.date)} 상태 변경: 수정 → 전송`,
        )

        toast({
          title: "상태 변경 완료",
          description: `${formatDate(item.date)} 항목이 전송 상태로 변경되었습니다.`,
          variant: "default",
        })
        await loadFinalDeliveryDetails(bio, productName)

        // 전송 상태 변경 알림톡 발송
        try {
          const targetCompany = companies.find((c) => c.id === item.companyId && c.productName === productName)

          if (targetCompany) {
            const companyData = [
              {
                company: targetCompany.name,
                phone_no: targetCompany.phone || [],
              },
            ]

            const plantValue = bio === "bio1" ? "1" : "2"

            const notificationPayload = {
              plant: plantValue as "1" | "2",
              chemical: PRODUCT_TO_CHEMICAL_MAP[productName] || "HYDRATED",
              companies: companyData,
            }

            const notificationResult = await sendNotificationRequest(notificationPayload)
            if (notificationResult.success) {
              toast({
                title: "알림톡 발송 완료",
                description: "전송 상태 변경 알림톡이 발송되었습니다.",
                variant: "default",
              })
            }
          }
        } catch (error) {
          console.error("알림톡 발송 중 오류:", error)
        }
      } else {
        toast({ title: "상태 변경 실패", description: "상태 변경에 실패했습니다.", variant: "destructive" })
      }
      return
    }

    const success = await deleteDispatchPlan(item.id, bio, productName)
    if (success) {
      // 편집 히스토리 저장
      await saveEditHistory(
        userName,
        bio,
        chemicalEnum,
        item.date,
        "status_change",
        { status: item.status },
        { status: "deleted" },
        `${formatDate(item.date)} 항목 삭제 (Draft로 되돌림)`,
      )

      toast({
        title: "항목 되돌림 완료",
        description: `${formatDate(item.date)} 항목이 Draft로 되돌아갔습니다.`,
        variant: "default",
      })
      await loadFinalDeliveryDetails(bio, productName)
    } else {
      toast({ title: "되돌리기 실패", description: "항목 되돌리기에 실패했습니다.", variant: "destructive" })
    }
  }

  const handleRevertToCancelRequest = async (item: any) => {
    if (!item.id) {
      toast({ title: "오류", description: "항목 ID를 찾을 수 없습니다.", variant: "destructive" })
      return
    }

    const userName = getCurrentUserName()
    const success = await updateDispatchPlan(item.id, { status: "sent" }, bio, productName)

    if (success) {
      // 편집 히스토리 저장
      await saveEditHistory(
        userName,
        bio,
        chemicalEnum,
        item.date,
        "status_change",
        { status: "cancelrequest" },
        { status: "sent" },
        `${formatDate(item.date)} 취소요청 해제`,
      )

      toast({
        title: "상태 변경 완료",
        description: `${formatDate(item.date)} 항목이 전송 상태로 변경되었습니다.`,
        variant: "default",
      })
      await loadFinalDeliveryDetails(bio, productName)

      // 취소요청 해제 알림톡 발송
      try {
        const targetCompany = companies.find((c) => c.id === item.companyId && c.productName === productName)

        if (targetCompany) {
          const companyData = [
            {
              company: targetCompany.name,
              phone_no: targetCompany.phone || [],
            },
          ]

          const plantValue = bio === "bio1" ? "1" : "2"

          const notificationPayload = {
            plant: plantValue as "1" | "2",
            chemical: PRODUCT_TO_CHEMICAL_MAP[productName] || "HYDRATED",
            companies: companyData,
          }

          const notificationResult = await sendNotificationRequest(notificationPayload)
          if (notificationResult.success) {
            toast({
              title: "알림톡 발송 완료",
              description: "취소요청 해제 알림톡이 발송되었습니다.",
              variant: "default",
            })
          }
        }
      } catch (error) {
        console.error("알림톡 발송 중 오류:", error)
      }
    } else {
      toast({ title: "상태 변경 실패", description: "상태 변경에 실패했습니다.", variant: "destructive" })
    }
  }

  const handleDeleteCancelledItem = async (item: any) => {
    if (!item.id) {
      toast({ title: "오류", description: "항목 ID를 찾을 수 없습니다.", variant: "destructive" })
      return
    }

    const userName = getCurrentUserName()
    const success = await deleteDispatchPlan(item.id, bio, productName)

    if (success) {
      // 편집 히스토리 저장
      await saveEditHistory(
        userName,
        bio,
        chemicalEnum,
        item.date,
        "status_change",
        { status: item.status },
        { status: "deleted" },
        `${formatDate(item.date)} 취소된 항목 삭제`,
      )

      toast({
        title: "항목 삭제 완료",
        description: `${formatDate(item.date)} 항목이 삭제되었습니다.`,
        variant: "default",
      })
      await loadFinalDeliveryDetails(bio, productName)
    } else {
      toast({ title: "삭제 실패", description: "항목 삭제에 실패했습니다.", variant: "destructive" })
    }
  }

  const renderManageButton = (day: any) => {
    if (day.status === "done") return null
    if (day.status === "confirmed") {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs">취소</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>취소 요청</AlertDialogTitle>
              <AlertDialogDescription>
                {formatDate(day.date)} 배차 계획의 취소를 요청하시겠습니까?
                <br />
                상태가 '취소요청'으로 변경됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleCancelRequest(day)}>취소 요청</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }
    if (day.status === "cancelrequest") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRevertToCancelRequest(day)}
          className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-xs">되돌리기</span>
        </Button>
      )
    }
    if (day.status === "cancel") {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 bg-transparent flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-xs">삭제</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>항목 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                {formatDate(day.date)} 취소된 항목을 삭제하시겠습니까?
                <br />이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteCancelledItem(day)}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }
    if (day.status === "sent" || day.status === "modify") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleReturnToDraft(day)}
          disabled={!isManageButtonEnabled(day.status)}
          className={`h-8 px-2 flex items-center gap-1 ${isManageButtonEnabled(day.status) ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200" : "text-gray-400 border-gray-200 cursor-not-allowed"}`}
          title={day.status === "modify" ? "전송 상태로 변경" : "Draft로 되돌리기"}
        >
          {day.status === "modify" ? (
            <>
              <Check className="h-4 w-4" />
              <span className="text-xs">전송</span>
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4" />
              <span className="text-xs">삭제</span>
            </>
          )}
        </Button>
      )
    }
    return null
  }

  const renderTimeEditButton = (day: any) => {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleTimeEdit(day)}
          disabled={!isTimeEditButtonEnabled(day.status, day.deliveryCount)}
          className={`h-8 w-8 ${isTimeEditButtonEnabled(day.status, day.deliveryCount) ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200" : "text-gray-400 border-gray-200 cursor-not-allowed"}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        {day.status === "modify" && day.note && (
          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            N
          </span>
        )}
      </div>
    )
  }

  const isQuantityEditable = (status: string) => {
    return status === "sent" || status === "confirmed" || status === "modify"
  }

  // 단위 결정 (황산암모늄과 요소수는 mm, 나머지는 ton)
  const getUnit = () => {
    return chemical === "sulfate" || chemical === "urea" ? "mm" : "ton"
  }

  const filteredDeliveryDetails = getFilteredDeliveryDetails()

  return (
    <div className="container py-6">
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {pageTitle} {productName} 배차계획 Final
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setHistoryModalOpen(true)} className="flex items-center gap-2">
              <History className="h-4 w-4" />
              이력
            </Button>
            <Button
              variant="outline"
              onClick={() => setHideCancelledRows(!hideCancelledRows)}
              className="flex items-center gap-2"
            >
              {hideCancelledRows ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {hideCancelledRows ? "취소항목 표시" : "취소항목 숨김"}
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(true)} className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> 재고량 캘리브레이션
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  긴급취소
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>긴급취소 확인</AlertDialogTitle>
                  <AlertDialogDescription>
                    모든 배차 계획이 취소됩니다.
                    <br />이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      console.log("긴급취소 실행 버튼 클릭됨")
                      handleEmergencyCancel()
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    긴급취소 실행
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <p>데이터를 불러오는 중입니다...</p>
            </div>
          ) : Array.isArray(filteredDeliveryDetails) && filteredDeliveryDetails.length > 0 ? (
            <div>
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-center font-semibold text-gray-700 w-20">상태</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-28">업체명</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-36">날짜</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-24">입고량</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-24">입고대수</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-24">입고시간</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-28">재고 (06:00)</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-36">입고 전/후 재고</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-28">재고 (20:00)</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-20">관리</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 w-24">시간 변경</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(filteredDeliveryDetails) &&
                      filteredDeliveryDetails.map((day, index) => (
                        <TableRow key={day.id || index} className={getRowClassName(index, day.status)}>
                          <TableCell className={`text-center ${getCellTextColor(day.status)}`}>
                            {renderStatusBadge(day.status, day.deliveryCount)}
                          </TableCell>
                          <TableCell
                            className={`text-center font-medium whitespace-nowrap ${day.status === "cancel" ? "text-gray-400" : "text-blue-600"}`}
                          >
                            {getCompanyName(day.companyId)}
                          </TableCell>
                          <TableCell
                            className={`font-medium text-center whitespace-nowrap ${getCellTextColor(day.status)}`}
                          >
                            {formatDate(day.date)}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            {day.deliveryCount > 0 ? (
                              <span
                                className={`font-medium ${
                                  isQuantityEditable(day.status) && day.status !== "cancel"
                                    ? "text-blue-600 cursor-pointer underline decoration-dotted hover:text-blue-800"
                                    : day.status === "cancel"
                                      ? "text-gray-400"
                                      : "text-blue-600"
                                }`}
                                onClick={() =>
                                  isQuantityEditable(day.status) && day.status !== "cancel" && handleQuantityEdit(day)
                                }
                              >
                                {/* factor 적용된 값으로 표시 */}
                                {(() => {
                                  const baseQuantity = day.deliveryQuantity || day.deliveryAmount || 0
                                  const totalQuantity = day.deliveryCount * baseQuantity
                                  // factor는 이미 DB에 저장될 때 적용되므로 여기서는 그대로 표시
                                  return `${totalQuantity.toFixed(1)} ${getUnit()}`
                                })()}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {day.deliveryCount > 0 ? (
                                <>
                                  <Truck
                                    className={`h-4 w-4 ${day.status === "cancel" ? "text-gray-400" : getCellTextColor(day.status)}`}
                                  />
                                  <span
                                    className={`font-medium ${day.status === "cancel" ? "text-gray-400" : getCellTextColor(day.status)}`}
                                  >
                                    {day.deliveryCount}회
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {day.deliveryCount > 0 && Array.isArray(day.deliveryTimes) ? (
                              <div className="space-y-1">
                                {day.deliveryTimes.map((time, i) => (
                                  <div key={i} className={day.status === "cancel" ? "text-gray-400" : "text-blue-600"}>
                                    {day.status === "modify" && day.oldDeliveryTimes && day.oldDeliveryTimes[i]
                                      ? `${day.oldDeliveryTimes[i]} → ${time}`
                                      : time}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell
                            className={`${day.status === "cancel" ? "text-gray-400" : getLevelColor(day.morningStock, day.status)} text-center font-medium`}
                          >
                            {(day.morningStock || 0).toFixed(1)} {getUnit()}
                          </TableCell>
                          <TableCell className="text-center">
                            {day.deliveryCount > 0 &&
                            Array.isArray(day.deliveryTimes) &&
                            Array.isArray(day.preDeliveryStock) &&
                            Array.isArray(day.postDeliveryStock) ? (
                              <div className="space-y-1">
                                {day.deliveryTimes.map((_, i) => (
                                  <div key={i} className={day.status === "cancel" ? "text-gray-400" : "text-gray-700"}>
                                    {day.preDeliveryStock[i]?.toFixed(1) || "0.0"} →{" "}
                                    {day.postDeliveryStock[i]?.toFixed(1) || "0.0"} {getUnit()}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell
                            className={`${day.status === "cancel" ? "text-gray-400" : getLevelColor(day.eveningStock, day.status)} text-center font-medium`}
                          >
                            {(day.eveningStock || 0).toFixed(1)} {getUnit()}
                          </TableCell>
                          <TableCell className="text-center">{renderManageButton(day)}</TableCell>
                          <TableCell className="text-center">{renderTimeEditButton(day)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <h2 className="text-xl font-semibold mb-4">
                {pageTitle} {productName} 배차계획 Final
              </h2>
              <p>
                이 페이지에서는 확정된 {pageTitle} {productName} 배차계획을 확인할 수 있습니다.
              </p>
              <p className="mt-4 text-sm text-gray-400">확정된 배차계획이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 시간 편집 다이얼로그 */}
      {editingItem && (
        <TimeEditDialog
          open={timeEditOpen}
          onOpenChange={setTimeEditOpen}
          currentTimes={Array.isArray(editingItem.deliveryTimes) ? editingItem.deliveryTimes : ["08:00"]}
          deliveryCount={editingItem.deliveryCount || 1}
          currentNote={editingItem.note || ""}
          onSave={handleTimeAndNoteSave}
        />
      )}

      {/* 입고량 수정 다이얼로그 */}
      {editingQuantityItem && (
        <DeliveryQuantityEditDialog
          open={quantityEditOpen}
          onOpenChange={setQuantityEditOpen}
          title="입고량 수정"
          currentValue={editingQuantityItem.deliveryQuantity || 0}
          onSave={handleQuantitySave}
          unit={getUnit()}
        />
      )}

      {/* 편집 히스토리 모달 */}
      <EditHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        plant={bio}
        chemical={chemicalEnum}
        productName={productName}
      />

      <FinalSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={finalSettings}
        onApply={handleSettingsApply}
        productName={productName}
        plant={bio}
      />
    </div>
  )
}
