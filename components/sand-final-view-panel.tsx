"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Calendar, Clock, Truck, Package } from "lucide-react"
import { format, addDays } from "date-fns"
import { ko } from "date-fns/locale"

interface SandFinalViewPanelProps {
  isOpen: boolean
  onClose: () => void
  bio: string
  chemical: string
}

interface DeliveryPlan {
  id: string
  date: string
  time: string
  quantity: number
  company: string
  status: "confirmed" | "sent" | "cancel_requested"
  morningStock?: number
}

export function SandFinalViewPanel({ isOpen, onClose, bio, chemical }: SandFinalViewPanelProps) {
  // 샘플 비교 데이터
  const [comparisonPlans] = useState<DeliveryPlan[]>([
    {
      id: "comp-1",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "10:00",
      quantity: 25,
      company: "비교업체 A",
      status: "confirmed",
      morningStock: 45,
    },
    {
      id: "comp-2",
      date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      time: "15:30",
      quantity: 35,
      company: "비교업체 B",
      status: "sent",
      morningStock: 60,
    },
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">확정</Badge>
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">발송완료</Badge>
      case "cancel_requested":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">취소요청</Badge>
      default:
        return <Badge variant="secondary">알 수 없음</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "M월 d일 (E)", { locale: ko })
    } catch {
      return dateString
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {bio.toUpperCase()} {chemical} 비교 패널
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">비교 데이터</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonPlans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{formatDate(plan.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{plan.time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-500" />
                          <span>{plan.quantity}톤</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-gray-500" />
                          <span>{plan.company}</span>
                        </div>
                        {plan.morningStock && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">오전재고:</span>
                            <span>{plan.morningStock}톤</span>
                          </div>
                        )}
                        {getStatusBadge(plan.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">비교 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-blue-700 font-medium">평균 배송량</div>
                    <div className="text-2xl font-bold text-blue-800">30톤</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-green-700 font-medium">평균 재고</div>
                    <div className="text-2xl font-bold text-green-800">52.5톤</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-purple-700 font-medium">배송 횟수</div>
                    <div className="text-2xl font-bold text-purple-800">2회</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
