"use client"

import { useMemo, useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Truck, ChevronDown, Plus, Minus, CheckCircle, Send } from "lucide-react"
import type { SimulationResult, DispatchSettings } from "@/components/draft-system"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useCompanyStore } from "@/lib/company-store"
import StockEditDialog from "@/components/stock-edit-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { DeliveryDetailWithStatus } from "@/lib/dispatch-store"
import DeliveryQuantityEditDialog from "@/components/delivery-quantity-edit-dialog"

interface DispatchPlanProps {
  result: SimulationResult
  settings: DispatchSettings
  onUpdateDeliveryTime: (dayIndex: number, deliveryIndex: number, newTime: string) => void
  onUpdateDeliveryCount: (dayIndex: number, newCount: number) => void
  onUpdateDeliveryQuantity?: (dayIndex: number, newQuantity: number) => void // 새로 추가
  onAddNewRow: () => void
  setSettings: (settings: DispatchSettings) => void
  onUpdateMorningStock: (dayIndex: number, newValue: number) => void
  onUpdateEveningStock: (dayIndex: number, newValue: number) => void
  selectedRows?: number[]
  onSelectRow?: (dayIndex: number, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  allSelected?: boolean
  companies: any[] // 회사 정보 추가
}

// 각 행의 회사 정보를 저장하기 위한 인터페이스
interface RowCompany {
  dayIndex: number
  companyId: number | undefined
}

export default function DispatchPlan({
  result,
  settings,
  onUpdateDeliveryTime,
  onUpdateDeliveryCount,
  onUpdateDeliveryQuantity, // 새로 추가
  onAddNewRow,
  setSettings,
  onUpdateMorningStock,
  onUpdateEveningStock,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  allSelected = false,
  companies,
}: DispatchPlanProps) {
  const { getDefaultCompany } = useCompanyStore()
  const [rowCompanies, setRowCompanies] = useState<RowCompany[]>([])

  // 다이얼로그 상태 관리
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<{
    type: "morning" | "evening"
    dayIndex: number
    value: number
  } | null>(null)

  const [deliveryQuantityDialogOpen, setDeliveryQuantityDialogOpen] = useState(false)
  const [editingDeliveryQuantity, setEditingDeliveryQuantity] = useState<{
    dayIndex: number
    value: number
  } | null>(null)

  const [defaultCompanyId, setDefaultCompanyId] = useState<number | undefined>(undefined)

  // useEffect에서 기본 업체 설정 로직 수정
  useEffect(() => {
    // 현재 품명의 기본 업체 가져오기
    const defaultCompany = getDefaultCompany(settings?.productName || "")
    setDefaultCompanyId(defaultCompany?.id)

    // 설정에서 선택된 업체 ID가 있으면 모든 행에 해당 업체 설정
    const selectedCompanyId = settings?.companyId || defaultCompany?.id

    if (selectedCompanyId && result?.deliveryDetails) {
      // 기존에 설정된 행별 업체가 없는 경우에만 기본 업체 설정
      const newRowCompanies = result.deliveryDetails.map((detail, index) => {
        const existingRowCompany = rowCompanies.find((rc) => rc.dayIndex === index)
        return {
          dayIndex: index,
          companyId: existingRowCompany?.companyId || selectedCompanyId, // 기존 설정 유지 또는 기본값
        }
      })

      // 기존 rowCompanies와 다른 경우에만 업데이트
      const hasChanges = newRowCompanies.some((newRow, index) => {
        const existingRow = rowCompanies.find((rc) => rc.dayIndex === index)
        return !existingRow || existingRow.companyId !== newRow.companyId
      })

      if (hasChanges) {
        setRowCompanies(newRowCompanies)
      }
    }
  }, [settings?.productName, settings?.companyId, getDefaultCompany, result?.deliveryDetails])

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "yyyy년 MM월 dd일 (E)", { locale: ko })
    } catch {
      return dateStr
    }
  }

  const getLevelColor = (level: number) => {
    if (!settings) return ""
    if (level < (settings.minLevel || 0)) return "text-red-700 font-bold"
    if (level > (settings.maxLevel || 100)) return "text-red-700 font-bold"
    return "text-green-600"
  }

  // 현재 품명에 해당하는 업체만 필터링
  const filteredCompanies = useMemo(() => {
    if (!Array.isArray(companies) || !settings?.productName) return []
    return companies.filter((company) => company?.productName === settings.productName)
  }, [companies, settings?.productName])

  // 특정 행의 회사 ID 가져오기
  const getRowCompanyId = (dayIndex: number): number | undefined => {
    // 먼저 result 객체에서 확인
    const deliveryDetail = result?.deliveryDetails[dayIndex] as DeliveryDetailWithStatus
    if (deliveryDetail?.companyId) {
      return deliveryDetail.companyId
    }

    // 그 다음 rowCompanies에서 확인
    const rowCompany = rowCompanies.find((rc) => rc.dayIndex === dayIndex)
    return rowCompany?.companyId
  }

  // 특정 행의 회사 이름 가져오기 함수 수정
  const getCompanyName = (dayIndex: number): string => {
    // 먼저 해당 행에 설정된 업체 ID 확인
    const rowCompanyId = getRowCompanyId(dayIndex)

    if (rowCompanyId) {
      // 행에 설정된 업체 ID가 있으면 해당 업체 찾기
      const selectedCompany = filteredCompanies.find((c) => c.id === rowCompanyId)
      if (selectedCompany) {
        return selectedCompany.name
      }
    }

    // 행별 업체가 설정되지 않은 경우에만 설정에서 선택된 업체 또는 기본 업체 사용
    if (settings?.companyId) {
      const settingsCompany = filteredCompanies.find((c) => c.id === settings.companyId)
      if (settingsCompany) {
        return settingsCompany.name
      }
    }

    // 마지막으로 기본 업체 사용
    const defaultCompany = getDefaultCompany(settings?.productName || "")
    return defaultCompany ? defaultCompany.name : "-"
  }

  // 행별 회사 변경 처리
  const handleRowCompanyChange = (dayIndex: number, companyId: number | undefined) => {
    // 현재 행의 회사 업데이트
    const newRowCompanies = [...rowCompanies]
    const existingIndex = newRowCompanies.findIndex((rc) => rc.dayIndex === dayIndex)

    if (existingIndex >= 0) {
      newRowCompanies[existingIndex].companyId = companyId
    } else {
      newRowCompanies.push({ dayIndex, companyId })
    }

    setRowCompanies(newRowCompanies)

    // 결과 객체에도 회사 ID 저장 - 더 명확하게 설정
    if (result?.deliveryDetails[dayIndex]) {
      const deliveryDetail = result.deliveryDetails[dayIndex] as DeliveryDetailWithStatus
      deliveryDetail.companyId = companyId

      // 디버깅을 위한 로그 추가
      console.log(`Row ${dayIndex} company changed to:`, {
        dayIndex,
        companyId,
        companyName: companies.find((c) => c.id === companyId)?.name || "Unknown",
      })
    }
  }

  // Generate available hours for dropdown (00:00 - 24:00, 1시간 단위)
  const availableHours = useMemo(() => {
    const hours = []
    for (let hour = 0; hour <= 24; hour++) {
      const timeStr = `${hour.toString().padStart(2, "0")}:00`
      hours.push(timeStr)
    }
    return hours
  }, [])

  const updateDeliveryCount = (dayIndex: number, newCount: number) => {
    // 입고대수 변경 시 해당 row의 업체 정보는 유지
    // 기존 콜백 함수 호출
    onUpdateDeliveryCount(dayIndex, newCount)
  }

  // 입고량 수정 다이얼로그 열기
  const openDeliveryQuantityEditDialog = (dayIndex: number, value: number) => {
    setEditingDeliveryQuantity({ dayIndex, value })
    setDeliveryQuantityDialogOpen(true)
  }

  // 재고 수정 다이얼로그 열기
  const openStockEditDialog = (type: "morning" | "evening", dayIndex: number, value: number) => {
    setEditingStock({ type, dayIndex, value })
    setEditDialogOpen(true)
  }

  // 입고량 값 저장 핸들러
  const handleSaveDeliveryQuantity = (newValue: number) => {
    if (!editingDeliveryQuantity || !onUpdateDeliveryQuantity) return
    onUpdateDeliveryQuantity(editingDeliveryQuantity.dayIndex, newValue)
  }

  // 재고 값 저장 핸들러
  const handleSaveStock = (newValue: number) => {
    if (!editingStock) return

    if (editingStock.type === "morning") {
      onUpdateMorningStock(editingStock.dayIndex, newValue)
    } else {
      onUpdateEveningStock(editingStock.dayIndex, newValue)
    }
  }

  // 행 선택 처리
  const handleRowSelect = (dayIndex: number, checked: boolean) => {
    if (onSelectRow) {
      onSelectRow(dayIndex, checked)
    }
  }

  // 전체 선택 핸들러 추가
  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked)
    }
  }

  // 상태 배지 렌더링
  const renderStatusBadge = (detail: DeliveryDetailWithStatus) => {
    const status = detail?.status || "draft"
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Draft
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <Send className="h-3 w-3" />
            전송
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            확정
          </Badge>
        )
      case "done":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            완료
          </Badge>
        )
      case "modify":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            수정
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Draft
          </Badge>
        )
    }
  }

  if (!result?.deliveryDetails || result.deliveryDetails.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-md">
        설정을 완료한 후 '작성' 버튼을 클릭하여 배차 계획을 생성하세요.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Select all rows" />
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-700 w-24">상태</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">업체명</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">날짜</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">입고량</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">입고대수</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">입고시간</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">재고 (06:00)</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">입고 전/후 재고</TableHead>
              <TableHead className="text-center font-semibold text-gray-700">재고 (20:00)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.deliveryDetails.map((day, dayIndex) => (
              <TableRow key={dayIndex} className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="text-center">
                  <Checkbox
                    checked={selectedRows.includes(dayIndex)}
                    onCheckedChange={(checked) => handleRowSelect(dayIndex, checked === true)}
                    aria-label={`Select row ${dayIndex + 1}`}
                    disabled={(day as DeliveryDetailWithStatus).status === "sent"}
                  />
                </TableCell>
                <TableCell className="text-center">{renderStatusBadge(day as DeliveryDetailWithStatus)}</TableCell>
                <TableCell className="text-center font-medium text-blue-600">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center justify-center w-full text-blue-600 hover:text-blue-800 cursor-pointer">
                      <span className="underline">{getCompanyName(dayIndex)}</span>
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-64 overflow-y-auto">
                      {filteredCompanies.map((company) => (
                        <DropdownMenuItem
                          key={company.id}
                          onClick={() => handleRowCompanyChange(dayIndex, company.id)}
                          className={getRowCompanyId(dayIndex) === company.id ? "bg-blue-50 text-blue-600" : ""}
                        >
                          {company.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="font-medium text-center text-gray-700">{formatDate(day.date)}</TableCell>
                <TableCell className="text-center font-medium text-blue-600">
                  {day.deliveryCount > 0 ? (
                    <span
                      className="cursor-pointer underline decoration-dotted hover:text-blue-800"
                      onClick={() =>
                        openDeliveryQuantityEditDialog(
                          dayIndex,
                          (day as DeliveryDetailWithStatus).deliveryQuantity || settings?.deliveryAmount || 0,
                        )
                      }
                    >
                      {(
                        day.deliveryCount *
                        ((day as DeliveryDetailWithStatus).deliveryQuantity || settings?.deliveryAmount || 0)
                      ).toFixed(1)}{" "}
                      ton
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 bg-transparent"
                      onClick={() => updateDeliveryCount(dayIndex, Math.max(0, day.deliveryCount - 1))}
                      disabled={day.deliveryCount <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="flex items-center gap-1 min-w-[60px] justify-center">
                      {day.deliveryCount > 0 ? (
                        <>
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">{day.deliveryCount}회</span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 bg-transparent"
                      onClick={() => updateDeliveryCount(dayIndex, day.deliveryCount + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {day.deliveryCount > 0 ? (
                    <div className="space-y-1">
                      {day.deliveryTimes.map((time, i) => (
                        <DropdownMenu key={i}>
                          <DropdownMenuTrigger className="flex items-center justify-center w-full text-blue-600 hover:text-blue-800 cursor-pointer">
                            <span className="underline">{time}</span>
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="max-h-64 overflow-y-auto">
                            {availableHours.map((hour) => (
                              <DropdownMenuItem
                                key={hour}
                                onClick={() => onUpdateDeliveryTime(dayIndex, i, hour)}
                                className={hour === time ? "bg-blue-50 text-blue-600" : ""}
                              >
                                {hour}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className={`${getLevelColor(day.morningStock)} text-center font-medium`}>
                  {dayIndex === 0 ? (
                    <span
                      className="cursor-pointer underline decoration-dotted"
                      onClick={() => openStockEditDialog("morning", dayIndex, day.morningStock)}
                    >
                      {day.morningStock.toFixed(1)}{" "}
                      {settings?.productName === "요소수" || settings?.productName === "황산암모늄" ? "mm" : "ton"}
                    </span>
                  ) : (
                    `${day.morningStock.toFixed(1)} ${settings?.productName === "요소수" || settings?.productName === "황산암모늄" ? "mm" : "ton"}`
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {day.deliveryCount > 0 ? (
                    <div className="space-y-1">
                      {day.deliveryTimes.map((_, i) => (
                        <div key={i} className="text-gray-700">
                          {day.preDeliveryStock[i]?.toFixed(1) || "0.0"} →{" "}
                          {day.postDeliveryStock[i]?.toFixed(1) || "0.0"}{" "}
                          {settings?.productName === "요소수" || settings?.productName === "황산암모늄" ? "mm" : "ton"}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className={`${getLevelColor(day.eveningStock)} text-center font-medium`}>
                  {dayIndex === 0 ? (
                    <span
                      className="cursor-pointer underline decoration-dotted"
                      onClick={() => openStockEditDialog("evening", dayIndex, day.eveningStock)}
                    >
                      {day.eveningStock.toFixed(1)}{" "}
                      {settings?.productName === "요소수" || settings?.productName === "황산암모늄" ? "mm" : "ton"}
                    </span>
                  ) : (
                    `${day.eveningStock.toFixed(1)} ${settings?.productName === "요소수" || settings?.productName === "황산암모늄" ? "mm" : "ton"}`
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 재고 수정 다이얼로그 */}
      {editingStock && (
        <StockEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          title={editingStock.type === "morning" ? "아침 재고(06:00) 수정" : "저녁 재고(20:00) 수정"}
          currentValue={editingStock.value}
          onSave={handleSaveStock}
        />
      )}

      {/* 입고량 수정 다이얼로그 */}
      {editingDeliveryQuantity && (
        <DeliveryQuantityEditDialog
          open={deliveryQuantityDialogOpen}
          onOpenChange={setDeliveryQuantityDialogOpen}
          title="입고량 수정"
          currentValue={editingDeliveryQuantity.value}
          onSave={handleSaveDeliveryQuantity}
          unit="ton"
        />
      )}
    </div>
  )
}
