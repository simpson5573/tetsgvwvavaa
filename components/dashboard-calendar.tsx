"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns"
import { ko } from "date-fns/locale"
import { fetchAllDispatchPlans, fetchMonthlyStats } from "@/lib/dashboard-service"
import type { DashboardDispatchPlan } from "@/lib/dashboard-service"
import { Badge } from "@/components/ui/badge"

// 품명별 색상 매핑
const productColors = {
  유동사: "bg-blue-100 text-blue-800 border-blue-200",
  고령토: "bg-green-100 text-green-800 border-green-200",
  요소수: "bg-purple-100 text-purple-800 border-purple-200",
  황산암모늄: "bg-orange-100 text-orange-800 border-orange-200",
  소석회: "bg-pink-100 text-pink-800 border-pink-200",
  중탄산나트륨: "bg-indigo-100 text-indigo-800 border-indigo-200",
}

interface DashboardCalendarProps {
  bioType: "bio1" | "bio2"
}

export function DashboardCalendar({ bioType }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dispatchPlans, setDispatchPlans] = useState<DashboardDispatchPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyStats, setMonthlyStats] = useState<{
    totalPlans: number
    totalDeliveries: number
    productStats: Record<string, number>
  }>({
    totalPlans: 0,
    totalDeliveries: 0,
    productStats: {},
  })

  // 데이터 로드
  useEffect(() => {
    const loadDispatchPlans = async () => {
      setLoading(true)
      try {
        const plans = await fetchAllDispatchPlans(bioType)
        setDispatchPlans(plans)

        // 월별 통계 로드
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const stats = await fetchMonthlyStats(year, month, bioType)
        setMonthlyStats(stats)
      } catch (error) {
        console.error("배차 계획 로드 중 오류:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDispatchPlans()
  }, [bioType, currentDate])

  // 현재 월의 날짜들 생성 - 실제 달력처럼 이전달/다음달 날짜도 포함
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 일요일 시작
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // 이전/다음 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  // 특정 날짜의 배차 계획 가져오기 (입고대수가 0인 것과 취소/취소요청 상태는 제외)
  const getPlansForDate = (date: Date): DashboardDispatchPlan[] => {
    const dateStr = format(date, "yyyy-MM-dd")
    return dispatchPlans.filter((plan) => {
      // 입고대수가 0인 것 제외
      if (plan.deliveryCount <= 0) return false

      // 취소 또는 취소요청 상태인 것 제외
      const cancelledStates = ["cancel", "cancelrequest"]
      if (cancelledStates.includes(plan.status)) return false

      // 날짜가 일치하는 것만 포함
      return plan.date === dateStr
    })
  }

  // 현재 선택된 bioType에 따라 표시할 범례 결정
  const getDisplayColors = () => {
    return Object.entries(productColors)
  }

  // 배차 계획의 색상을 결정하는 함수
  const getPlanColorClass = (plan: DashboardDispatchPlan): string => {
    // 상태가 'done'인 경우 회색 배경으로 표시
    if (plan.status === "done") {
      return "bg-gray-100 text-gray-600 border-gray-300"
    }

    // 품명별 색상 적용
    return productColors[plan.productName] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // 요일 헤더
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"]

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">배차 계획을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-semibold">{format(currentDate, "yyyy년 MM월", { locale: ko })}</CardTitle>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* 범례 */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">품명별 색상</h3>
          <div className="flex flex-wrap gap-2">
            {getDisplayColors().map(([product, colorClass]) => (
              <Badge key={product} variant="outline" className={colorClass}>
                {product}
              </Badge>
            ))}
            {/* 완료 상태 범례 추가 */}
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
              완료 상태
            </Badge>
          </div>
        </div>

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 요일 헤더 */}
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`p-3 text-center text-sm font-medium ${
                index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}

          {/* 날짜 셀들 */}
          {monthDays.map((date) => {
            const plansForDate = getPlansForDate(date)
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isTodayDate = isToday(date)

            return (
              <div
                key={date.toISOString()}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isTodayDate ? "ring-2 ring-blue-500" : ""}`}
              >
                {/* 날짜 숫자 */}
                <div
                  className={`text-sm font-medium mb-2 ${
                    isTodayDate ? "text-blue-600" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {format(date, "d")}
                </div>

                {/* 배차 계획들 - 현재 월의 날짜에만 표시 */}
                {isCurrentMonth && (
                  <div className="space-y-1">
                    {plansForDate.map((plan, index) => (
                      <div
                        key={`${plan.id}-${index}`}
                        className={`text-xs p-1 rounded border ${getPlanColorClass(plan)}`}
                      >
                        <div className="font-medium truncate flex items-center justify-between">
                          <span>{plan.productName}</span>
                          <span>{plan.deliveryQuantity}톤</span>
                        </div>
                        {plan.deliveryTimes.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            <span className="truncate">
                              {plan.deliveryTimes.slice(0, 2).join(", ")}
                              {plan.deliveryTimes.length > 2 && "..."}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 통계 정보 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalPlans}</div>
            <div className="text-sm text-blue-800">총 계획 수</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{monthlyStats.totalDeliveries}</div>
            <div className="text-sm text-green-800">총 배송 대수</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(monthlyStats.productStats).length}</div>
            <div className="text-sm text-purple-800">활성 품목 수</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
