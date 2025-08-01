"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Truck } from "lucide-react"
import { useCompanyStore } from "@/lib/company-store"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { fetchAllDispatchPlans, type DashboardDispatchPlan } from "@/lib/dashboard-service"

interface BioOverviewPageProps {
  params: {
    bio: string
  }
}

export default function BioOverviewPage({ params }: BioOverviewPageProps) {
  const [allDispatchPlans, setAllDispatchPlans] = useState<DashboardDispatchPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { companies, loadCompanies } = useCompanyStore()
  const { toast } = useToast()
  const [settings, setSettings] = useState<{ minLevel: number; maxLevel: number } | null>(null)

  // Bio 타입에 따른 제품 목록 결정
  const getProductNames = (bioType: string) => {
    // Bio #1과 Bio #2 모두 동일한 제품 목록 사용
    return ["유동사", "고령토", "요소수", "황산암모늄", "소석회", "중탄산나트륨"]
  }

  // Bio #1과 Bio #2 모두 동일한 제품 목록 사용
  const productNames = getProductNames(params.bio)

  const isDateTodayOrAfter = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const planDate = new Date(dateStr)
    planDate.setHours(0, 0, 0, 0)
    return planDate >= today
  }

  const formatPhoneNumber = (phone: string): string => {
    // 숫자만 추출
    const numbers = phone.replace(/\D/g, "")

    if (numbers.length === 11) {
      // 010-1234-5678 형식
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    } else if (numbers.length === 10) {
      // 02-1234-5678 또는 031-123-4567 형식
      if (numbers.startsWith("02")) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
      }
    } else if (numbers.length > 11) {
      // 11자리보다 긴 경우: 010-0000-000000 형식
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    }

    // 그 외의 경우 원본 반환
    return phone
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await loadCompanies()
        const rawPlans = await fetchAllDispatchPlans(params.bio as "bio1" | "bio2")

        setAllDispatchPlans(rawPlans)
        setSettings({ minLevel: 1, maxLevel: 5 })
      } catch (err) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.")
        console.error("데이터 로드 오류:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [loadCompanies, params.bio])

  useEffect(() => {
    if (error) {
      toast({
        title: "오류 발생",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "yyyy년 MM월 dd일 (E)", { locale: ko })
  }

  const getCompanyName = (companyId: number | undefined, productName: string): string => {
    if (!companyId) {
      const defaultCompany = companies.find((c) => c.productName === productName && c.isDefault === true)
      return defaultCompany ? defaultCompany.name : "-"
    }
    const company = companies.find((c) => c.id === companyId)
    return company ? company.name : "-"
  }

  const getRowClassName = (index: number) => {
    return index % 2 === 0 ? "bg-white" : "bg-gray-50"
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="sent">전송</Badge>
      case "confirmed":
        return <Badge variant="confirmed">확정</Badge>
      case "done":
        return <Badge variant="done">완료</Badge>
      case "modify":
        return <Badge variant="modify">수정</Badge>
      case "draft":
        return <Badge variant="draft">Draft</Badge>
      case "cancelrequest":
        return (
          <Badge variant="cancelrequest" className="whitespace-nowrap">
            취소요청
          </Badge>
        )
      case "cancel":
        return <Badge variant="cancel">취소</Badge>
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
            -
          </Badge>
        )
    }
  }

  const getProductPlans = (productName: string) => {
    return allDispatchPlans.filter(
      (plan) =>
        plan.productName === productName &&
        plan.deliveryCount > 0 &&
        ["sent", "confirmed", "done", "modify"].includes(plan.status) &&
        isDateTodayOrAfter(plan.date),
    )
  }

  const renderProductSection = (productName: string) => {
    const productPlans = getProductPlans(productName)

    return (
      <Card key={productName} className="w-full shadow-sm border-gray-200 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">{productName}</h2>
            <div className="text-sm text-gray-500">{productPlans.length}건의 배차계획</div>
          </div>
        </CardHeader>
        <CardContent>
          {productPlans.length > 0 ? (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-center font-semibold text-gray-700 w-24">상태</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">업체명</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">날짜</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">입고대수</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">입고량</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">입고시간</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700">차량정보</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productPlans.map((plan, index) => (
                    <TableRow key={plan.id || index} className={getRowClassName(index)}>
                      <TableCell className="text-center">{renderStatusBadge(plan.status)}</TableCell>
                      <TableCell className="text-center font-medium text-blue-600">
                        {getCompanyName(plan.companyId, productName)}
                      </TableCell>
                      <TableCell className="font-medium text-center text-gray-700">{formatDate(plan.date)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">{plan.deliveryCount}회</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${params.bio === "bio2" ? "text-blue-600" : "text-gray-700"}`}>
                          {Number.isFinite(Number(plan.deliveryQuantity)) && plan.deliveryCount > 0
                            ? `${(Number(plan.deliveryQuantity) * plan.deliveryCount).toFixed(1)}톤`
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          {plan.deliveryTimes.map((time, i) => (
                            <div key={i} className="text-blue-600">
                              {time}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          {plan.drivers && plan.drivers.length > 0 ? (
                            plan.drivers.map((driver, i) => (
                              <div key={i} className="text-gray-700">
                                {typeof driver === "string"
                                  ? driver
                                  : typeof driver === "object" && driver !== null
                                    ? `${driver.name || ""} ${driver.phone ? formatPhoneNumber(driver.phone) : ""}`.trim() ||
                                      "-"
                                    : "-"}
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400">-</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{productName}에 대한 배차계획이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const totalPlans = allDispatchPlans.filter(
    (plan) =>
      plan.deliveryCount > 0 &&
      ["sent", "confirmed", "done", "modify"].includes(plan.status) &&
      isDateTodayOrAfter(plan.date),
  ).length

  const getBioTitle = (bioType: string) => {
    return bioType === "bio1" ? "Bio #1" : "Bio #2"
  }

  return (
    <div className="container py-6">
      <div className={`mb-6 ${params.bio === "bio2" ? "mt-4" : ""}`}>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{getBioTitle(params.bio)} 배차계획 요약</h1>
        <div className="text-lg text-gray-600">총 {totalPlans}건의 배차계획</div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <p>데이터를 불러오는 중입니다...</p>
        </div>
      ) : totalPlans > 0 ? (
        <div className="space-y-6">{productNames.map((productName) => renderProductSection(productName))}</div>
      ) : (
        <Card className="w-full shadow-sm border-gray-200">
          <CardContent className="text-center py-12 text-gray-500">
            <h2 className="text-xl font-semibold mb-4">{getBioTitle(params.bio)} 배차계획 요약</h2>
            <p>이 페이지에서는 모든 {getBioTitle(params.bio)} 품명의 확정된 배차계획을 조회할 수 있습니다.</p>
            <p className="mt-4 text-sm text-gray-400">조회할 배차계획이 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
