"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { fetchFinalDispatchPlans } from "@/lib/dispatch-service"
import type { DeliveryDetailWithStatus } from "@/lib/dispatch-store"
import { useCompanyStore } from "@/lib/company-store"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SimulationResult } from "@/components/draft-system"

interface ComparisonPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productName?: string
  plant?: string
  draftResult?: SimulationResult | null // draft 데이터 추가
}

export default function ComparisonPanel({
  open,
  onOpenChange,
  productName = "유동사",
  plant = "bio1",
  draftResult = null, // draft 데이터 받기
}: ComparisonPanelProps) {
  const [dispatchPlans, setDispatchPlans] = useState<DeliveryDetailWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const { getDefaultCompany } = useCompanyStore()

  useEffect(() => {
    if (open) {
      loadFinalData()
    }
  }, [open, productName, plant])

  // 비교 대상 제품을 결정하는 함수
  const getComparisonProduct = (currentProduct: string): string => {
    switch (currentProduct) {
      case "유동사":
        return "고령토"
      case "고령토":
        return "유동사"
      case "소석회":
        return "중탄산나트륨"
      case "중탄산나트륨":
        return "소석회"
      default:
        return currentProduct
    }
  }

  const comparisonProduct = getComparisonProduct(productName)

  const loadFinalData = async () => {
    setLoading(true)
    try {
      // 비교 대상 제품의 데이터를 가져옴 - bio2 테이블명만 사용, product_name은 실제 제품명

      const data = await fetchFinalDispatchPlans(plant, comparisonProduct)
      setDispatchPlans(data)
    } catch (error) {
      console.error(`${plant === "bio2" ? "Bio #2 " : ""}${comparisonProduct} Final 데이터 로딩 오류:`, error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MM월 dd일 (E)", { locale: ko })
    } catch {
      return dateStr
    }
  }

  // draft 데이터와 날짜/시간이 일치하는지 확인하는 함수 (2시간 범위 내 충돌 체크)
  const isDraftTimeConflict = (planDate: string, planTime: string): boolean => {
    if (!draftResult || !draftResult.deliveryDetails) return false

    return draftResult.deliveryDetails.some((draftDetail) => {
      // 날짜가 일치하는지 확인
      if (draftDetail.date !== planDate) return false

      // 시간을 분으로 변환하는 헬퍼 함수
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(":").map(Number)
        return hours * 60 + minutes
      }

      const planTimeMinutes = timeToMinutes(planTime)

      // draft의 모든 배송 시간과 2시간 이후 범위 내에 있는지 확인
      return draftDetail.deliveryTimes.some((draftTime) => {
        const draftTimeMinutes = timeToMinutes(draftTime)
        // draft 시간부터 2시간 이후까지만 충돌로 판단 (예: 14:00 -> 14:00~16:00)
        return draftTimeMinutes <= planTimeMinutes && planTimeMinutes <= draftTimeMinutes + 120
      })
    })
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            전송
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            확정
          </Badge>
        )
      case "modify":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            수정
          </Badge>
        )
      case "done":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            완료
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {status}
          </Badge>
        )
    }
  }

  if (!open) return null

  return (
    <div className="fixed right-0 top-0 h-full w-80 lg:w-96 bg-white border-l-2 border-blue-200 shadow-xl z-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {plant === "bio2" ? `Bio #2 ${comparisonProduct}` : comparisonProduct} 배차 계획
          </h2>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {plant === "bio2" ? `Bio #2 ${comparisonProduct}` : comparisonProduct} 배차 데이터 불러오는 중...
              </div>
            </div>
          ) : dispatchPlans.filter((plan) => plan.deliveryCount > 0).length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {plant === "bio2" ? `Bio #2 ${comparisonProduct}` : comparisonProduct} 배차 계획이 없습니다.
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-center font-semibold text-gray-700 text-sm">상태</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 text-sm">날짜</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 text-sm">시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchPlans
                    .filter((plan) => plan.deliveryCount > 0) // 입고대수가 1회 이상인 것만 필터링
                    .map((plan, index) => (
                      <TableRow key={plan.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <TableCell className="text-center p-3">{renderStatusBadge(plan.status || "")}</TableCell>
                        <TableCell className="font-medium text-center text-gray-700 text-sm p-3">
                          {formatDate(plan.date)}
                        </TableCell>
                        <TableCell className="text-center p-3">
                          {plan.deliveryTimes ? (
                            <div className="space-y-1">
                              {plan.deliveryTimes.map((time, i) => {
                                const isConflict = isDraftTimeConflict(plan.date, time)
                                return (
                                  <div
                                    key={i}
                                    className={`text-sm ${
                                      isConflict ? "text-red-600 font-bold" : "text-blue-600 font-medium"
                                    }`}
                                  >
                                    {time}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
