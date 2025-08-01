"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDispatchStore } from "@/lib/dispatch-store"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Truck, ChevronLeft, ChevronRight, Download, FileText, Package, TrendingUp } from "lucide-react"
import { useCompanyStore } from "@/lib/company-store"
import { Badge } from "@/components/ui/badge"
import HistoryFilters, { type HistoryFilters as Filters } from "@/components/history-filters"
import { useToast } from "@/hooks/use-toast"
import { fetchHistoryDispatchPlans } from "@/lib/dispatch-service"
import {
  fetchWeightHistory,
  fetchCumulativeUsage,
  getProductNameFromChemical,
  formatTime,
  type WeightHistoryRecord,
  type CumulativeUsageRecord,
} from "@/lib/weight-history-service"
import { useSearchParams } from "next/navigation"

const ITEMS_PER_PAGE = 15

export default function HistoryPage() {
  const { settings, loading, error } = useDispatchStore()
  const { companies, loadCompanies } = useCompanyStore()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // URL 파라미터에서 plant 값을 가져와서 초기값으로 설정
  const plantFromUrl = searchParams.get("plant") as "bio1" | "bio2" | null
  const [plant, setBioType] = useState<"bio1" | "bio2">(plantFromUrl || "bio1")

  // 배차이력 상태
  const [dispatchHistoryData, setDispatchHistoryData] = useState<any[]>([])
  const [dispatchIsLoading, setDispatchIsLoading] = useState(false)
  const [dispatchCurrentPage, setDispatchCurrentPage] = useState(1)
  const [dispatchHasSearched, setDispatchHasSearched] = useState(false)

  // 입고이력 상태
  const [receivingHistoryData, setReceivingHistoryData] = useState<WeightHistoryRecord[]>([])
  const [receivingIsLoading, setReceivingIsLoading] = useState(false)
  const [receivingCurrentPage, setReceivingCurrentPage] = useState(1)
  const [receivingHasSearched, setReceivingHasSearched] = useState(false)

  // 누적 사용량 상태
  const [cumulativeUsageData, setCumulativeUsageData] = useState<CumulativeUsageRecord[]>([])
  const [cumulativeIsLoading, setCumulativeIsLoading] = useState(false)
  const [cumulativeCurrentPage, setCumulativeCurrentPage] = useState(1)
  const [cumulativeHasSearched, setCumulativeHasSearched] = useState(false)

  // URL 파라미터 변경 감지하여 plant 상태 업데이트
  useEffect(() => {
    const plantParam = searchParams.get("plant") as "bio1" | "bio2" | null
    if (plantParam && plantParam !== plant) {
      setBioType(plantParam)
      setDispatchHasSearched(false)
      setDispatchHistoryData([])
      setDispatchCurrentPage(1)
      setReceivingHasSearched(false)
      setReceivingHistoryData([])
      setReceivingCurrentPage(1)
      setCumulativeHasSearched(false)
      setCumulativeUsageData([])
      setCumulativeCurrentPage(1)
    }
  }, [searchParams, plant])

  // 컴포넌트 마운트 시 회사 데이터만 로드
  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // 에러 처리
  useEffect(() => {
    if (error) {
      toast({
        title: "오류 발생",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // 배차이력 데이터 로드 함수
  const loadDispatchHistoryData = async (filters: Filters) => {
    setDispatchIsLoading(true)
    setDispatchHasSearched(true)
    setDispatchCurrentPage(1)

    try {
      const filtersToUse = {
        year: filters.year === "all" ? "" : filters.year,
        month: filters.month === "all" ? "" : filters.month,
        companyId: filters.companyId === "all" ? "" : filters.companyId,
        productName: filters.productName === "all" ? "" : filters.productName,
      }

      console.log(`Loading dispatch data for ${plant}`)
      const data = await fetchHistoryDispatchPlans("", plant, filtersToUse)

      // 입고대수가 0인 로우는 필터링
      const filteredData = data.filter((item) => item.deliveryCount > 0)
      setDispatchHistoryData(filteredData)

      console.log(`${plant.toUpperCase()} 배차이력 데이터 로드 완료: ${filteredData.length}개 항목`)
    } catch (error) {
      console.error("배차이력 데이터 로드 중 오류:", error)
      toast({
        title: "데이터 로드 오류",
        description: "배차이력 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setDispatchIsLoading(false)
    }
  }

  // 입고이력 데이터 로드 함수
  const loadReceivingHistoryData = async (filters: Filters) => {
    setReceivingIsLoading(true)
    setReceivingHasSearched(true)
    setReceivingCurrentPage(1)

    try {
      const filtersToUse = {
        year: filters.year === "all" ? "" : filters.year,
        month: filters.month === "all" ? "" : filters.month,
        companyId: filters.companyId === "all" ? "" : filters.companyId,
        productName: filters.productName === "all" ? "" : filters.productName,
      }

      console.log(`Loading receiving data for ${plant}`)
      const data = await fetchWeightHistory(plant, filtersToUse)
      setReceivingHistoryData(data)

      console.log(`${plant.toUpperCase()} 입고이력 데이터 로드 완료: ${data.length}개 항목`)
    } catch (error) {
      console.error("입고이력 데이터 로드 중 오류:", error)
      toast({
        title: "데이터 로드 오류",
        description: "입고이력 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setReceivingIsLoading(false)
    }
  }

  // 누적 사용량 데이터 로드 함수
  const loadCumulativeUsageData = async (filters: Filters) => {
    setCumulativeIsLoading(true)
    setCumulativeHasSearched(true)
    setCumulativeCurrentPage(1)

    try {
      const filtersToUse = {
        year: filters.year === "all" ? "" : filters.year,
        month: filters.month === "all" ? "" : filters.month,
        companyId: filters.companyId === "all" ? "" : filters.companyName,
        productName: filters.productName === "all" ? "" : filters.productName,
      }

      console.log(`Loading cumulative usage data for ${plant}`)
      const data = await fetchCumulativeUsage(plant, filtersToUse)
      setCumulativeUsageData(data)

      console.log(`${plant.toUpperCase()} 누적 사용량 데이터 로드 완료: ${data.length}개 항목`)
    } catch (error) {
      console.error("누적 사용량 데이터 로드 중 오류:", error)
      toast({
        title: "데이터 로드 오류",
        description: "누적 사용량 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setCumulativeIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "yyyy년 MM월 dd일 (E)", { locale: ko })
    } catch (error) {
      console.error("날짜 형식 오류:", error)
      return "날짜 오류"
    }
  }

  // 어제 날짜 계산 함수
  const getYesterdayDate = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    return format(yesterday, "MM월 dd일", { locale: ko })
  }

  // 배차이력 Excel 다운로드 함수
  const downloadDispatchHistoryExcel = () => {
    if (!dispatchHistoryData || dispatchHistoryData.length === 0) {
      toast({
        title: "다운로드 오류",
        description: "다운로드할 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    const headers = ["순번", "날짜", "상태", "약품", "업체명", "입고대수", "입고량", "입고시간", "비고"]

    const csvData = dispatchHistoryData.map((item, index) => [
      index + 1,
      formatDate(item.date),
      item.status === "sent"
        ? "전송"
        : item.status === "confirmed"
          ? "확정"
          : item.status === "done"
            ? "완료"
            : item.status === "modify"
              ? "수정"
              : item.status === "draft"
                ? "Draft"
                : item.status === "cancelrequest"
                  ? "취소요청"
                  : item.status === "cancel"
                    ? "취소"
                    : item.status,
      item.productName || "-",
      getCompanyName(item.companyId, item.productName),
      `${item.deliveryCount}회`,
      item.deliveryQuantity && item.deliveryCount
        ? `${(item.deliveryQuantity * item.deliveryCount).toFixed(1)} ton`
        : "-",
      Array.isArray(item.deliveryTimes) ? item.deliveryTimes.join(", ") : "-",
      item.note || "-",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${plant === "bio1" ? "Bio1" : "Bio2"}_배차이력_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "다운로드 완료",
      description: `${dispatchHistoryData.length}개 항목이 다운로드되었습니다.`,
    })
  }

  // 입고이력 Excel 다운로드 함수
  const downloadReceivingHistoryExcel = () => {
    if (!receivingHistoryData || receivingHistoryData.length === 0) {
      toast({
        title: "다운로드 오류",
        description: "다운로드할 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    const headers = ["순번", "날짜", "입차시간", "출차시간", "품명", "업체명", "차번호", "실중량"]

    const csvData = receivingHistoryData.map((item, index) => [
      index + 1,
      formatDate(item.first_time),
      formatTime(item.first_time),
      item.second_time ? formatTime(item.second_time) : "-",
      getProductNameFromChemical(item.chemical),
      item.company,
      item.car_no,
      formatWeight(item.real_weight),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${plant === "bio1" ? "Bio1" : "Bio2"}_입고이력_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "다운로드 완료",
      description: `${receivingHistoryData.length}개 항목이 다운로드되었습니다.`,
    })
  }

  // 누적 사용량 Excel 다운로드 함수
  const downloadCumulativeUsageExcel = () => {
    if (!cumulativeUsageData || cumulativeUsageData.length === 0) {
      toast({
        title: "다운로드 오류",
        description: "다운로드할 데이터가 없습니다.",
        variant: "destructive",
      })
      return
    }

    const headers = ["순번", "날짜", "약품", "실중량", "사용량"]

    const csvData = cumulativeUsageData.map((item, index) => [
      index + 1,
      formatDate(item.date),
      getProductNameFromChemical(item.chemical),
      formatWeight(item.total_weight),
      "-", // 사용량은 추후 구현 예정
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${plant === "bio1" ? "Bio1" : "Bio2"}_누적사용량_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "다운로드 완료",
      description: `${cumulativeUsageData.length}개 항목이 다운로드되었습니다.`,
    })
  }

  // 배차이력 약품별 합계 계산 함수
  const calculateDispatchSummary = (data: any[]) => {
    const summary = data.reduce(
      (acc, item) => {
        const productName = item.productName || "기타"
        if (!acc[productName]) {
          acc[productName] = {
            productName,
            totalQuantity: 0,
            totalCount: 0,
          }
        }
        if (item.deliveryQuantity && item.deliveryCount) {
          acc[productName].totalQuantity += item.deliveryQuantity * item.deliveryCount
        }
        acc[productName].totalCount += item.deliveryCount || 0
        return acc
      },
      {} as Record<string, { productName: string; totalQuantity: number; totalCount: number }>,
    )

    return Object.values(summary)
  }

  // 약품별 합계 계산 함수
  const calculateChemicalSummary = (data: WeightHistoryRecord[]) => {
    const summary = data.reduce(
      (acc, item) => {
        const productName = getProductNameFromChemical(item.chemical)
        if (!acc[productName]) {
          acc[productName] = {
            productName,
            totalWeight: 0,
            count: 0,
          }
        }
        acc[productName].totalWeight += item.real_weight || 0
        acc[productName].count += 1
        return acc
      },
      {} as Record<string, { productName: string; totalWeight: number; count: number }>,
    )

    return Object.values(summary)
  }

  // 누적 사용량 약품별 합계 계산 함수 (ton/day 단위)
  const calculateCumulativeSummary = (data: CumulativeUsageRecord[]) => {
    const summary = data.reduce(
      (acc, item) => {
        const productName = getProductNameFromChemical(item.chemical)
        if (!acc[productName]) {
          acc[productName] = {
            productName,
            totalWeight: 0,
            count: 0,
          }
        }
        acc[productName].totalWeight += item.total_weight || 0
        acc[productName].count += 1
        return acc
      },
      {} as Record<string, { productName: string; totalWeight: number; count: number }>,
    )

    return Object.values(summary).map((item) => ({
      ...item,
      dailyUsage: item.count > 0 ? item.totalWeight / item.count : 0, // 일평균 사용량 계산
    }))
  }

  // 실중량 포맷팅 함수
  const formatWeight = (weight: number | null | undefined): string => {
    if (!weight) return "-"
    // kg 단위를 ton 단위로 변환 (1000으로 나누기)
    const tonWeight = weight / 1000
    return `${tonWeight.toFixed(2)} ton`
  }

  // 일일 사용량 포맷팅 함수 (ton/day)
  const formatDailyUsage = (weight: number | null | undefined): string => {
    if (!weight) return "-"
    // kg 단위를 ton 단위로 변환 (1000으로 나누기)
    const tonWeight = weight / 1000
    return `${tonWeight.toFixed(2)} ton/day`
  }

  // 회사 이름 가져오기
  const getCompanyName = (companyId: number | undefined, productName?: string): string => {
    if (!companyId && productName) {
      // companyId가 없는 경우 해당 품명의 기본 업체 이름 반환
      const defaultCompany = companies.find((c) => c.productName === productName && c.isDefault === true)
      return defaultCompany ? defaultCompany.name : "-"
    }
    const company = companies.find((c) => c.id === companyId)
    return company ? company.name : "-"
  }

  // 상태 배지 렌더링
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="sent">전송</Badge>
      case "confirmed":
        return <Badge variant="confirmed">확정</Badge>
      case "done":
      case "완료":
        return <Badge variant="done">완료</Badge>
      case "modify":
        return <Badge variant="modify">수정</Badge>
      case "draft":
        return <Badge variant="draft">Draft</Badge>
      case "cancelrequest":
        return <Badge variant="cancelrequest">취소요청</Badge>
      case "cancel":
        return <Badge variant="cancel">취소</Badge>
      default:
        return <Badge variant="outline">-</Badge>
    }
  }

  // 첨부 파일 렌더링 - 다중 URL 지원 (배열 처리)
  const renderAttachments = (item: any) => {
    const attachments = []

    console.log("Rendering attachments for item:", item.id, {
      attachment1: item.attachment1,
      attachment2: item.attachment2,
      attachments_1: item.attachments_1,
      attachments_2: item.attachments_2,
    })

    // attachment1 처리 (성적서)
    if (Array.isArray(item.attachment1) && item.attachment1.length > 0) {
      item.attachment1.forEach((url: string, index: number) => {
        if (url && url.trim()) {
          attachments.push(
            <a
              key={`attachment1-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm block"
            >
              성적서{item.attachment1.length > 1 ? ` ${index + 1}` : ""}
            </a>,
          )
        }
      })
    }

    // attachment2 처리 (계근표)
    if (Array.isArray(item.attachment2) && item.attachment2.length > 0) {
      item.attachment2.forEach((url: string, index: number) => {
        if (url && url.trim()) {
          attachments.push(
            <a
              key={`attachment2-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline text-sm block"
            >
              계근표{item.attachment2.length > 1 ? ` ${index + 1}` : ""}
            </a>,
          )
        }
      })
    }

    if (attachments.length === 0) {
      return <span className="text-gray-400">-</span>
    }

    return <div className="space-y-1">{attachments}</div>
  }

  // 배차이력 페이지네이션 계산
  const dispatchTotalPages = Math.ceil(dispatchHistoryData.length / ITEMS_PER_PAGE)
  const dispatchStartIndex = (dispatchCurrentPage - 1) * ITEMS_PER_PAGE
  const dispatchEndIndex = dispatchStartIndex + ITEMS_PER_PAGE
  const dispatchCurrentData = dispatchHistoryData.slice(dispatchStartIndex, dispatchEndIndex)

  // 입고이력 페이지네이션 계산
  const receivingTotalPages = Math.ceil(receivingHistoryData.length / ITEMS_PER_PAGE)
  const receivingStartIndex = (receivingCurrentPage - 1) * ITEMS_PER_PAGE
  const receivingEndIndex = receivingStartIndex + ITEMS_PER_PAGE
  const receivingCurrentData = receivingHistoryData.slice(receivingStartIndex, receivingEndIndex)

  // 누적 사용량 페이지네이션 계산
  const cumulativeTotalPages = Math.ceil(cumulativeUsageData.length / ITEMS_PER_PAGE)
  const cumulativeStartIndex = (cumulativeCurrentPage - 1) * ITEMS_PER_PAGE
  const cumulativeEndIndex = cumulativeStartIndex + ITEMS_PER_PAGE
  const cumulativeCurrentData = cumulativeUsageData.slice(cumulativeStartIndex, cumulativeEndIndex)

  const handleDispatchPageChange = (page: number) => {
    setDispatchCurrentPage(page)
  }

  const handleReceivingPageChange = (page: number) => {
    setReceivingCurrentPage(page)
  }

  const handleCumulativePageChange = (page: number) => {
    setCumulativeCurrentPage(page)
  }

  return (
    <div className="container py-6">
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-800">{plant === "bio1" ? "Bio #1" : "Bio #2"} 이력</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receiving" className="w-full">
            {/* 새로운 깔끔한 탭 디자인 */}
            <div className="mb-8">
              <div className="bg-gray-100 p-1 rounded-xl shadow-inner w-full">
                <TabsList className="bg-transparent border-0 p-0 h-auto w-full grid grid-cols-3 gap-1">
                  <TabsTrigger
                    value="dispatch"
                    className="
          flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm
          data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md
          data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800
          transition-all duration-200 ease-in-out
          data-[state=active]:scale-[1.02]
        "
                  >
                    <FileText className="h-4 w-4" />
                    배차이력
                  </TabsTrigger>
                  <TabsTrigger
                    value="receiving"
                    className="
          flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm
          data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-md
          data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800
          transition-all duration-200 ease-in-out
          data-[state=active]:scale-[1.02]
        "
                  >
                    <Package className="h-4 w-4" />
                    입고이력 (계근대)
                  </TabsTrigger>
                  <TabsTrigger
                    value="cumulative"
                    className="
          flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm
          data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md
          data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800
          transition-all duration-200 ease-in-out
          data-[state=active]:scale-[1.02]
        "
                  >
                    <TrendingUp className="h-4 w-4" />
                    누적 사용량
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* 배차이력 탭 */}
            <TabsContent value="dispatch" className="space-y-4">
              <HistoryFilters
                productName={plant === "bio1" ? "유동사" : "bio2"}
                onFilterChange={loadDispatchHistoryData}
              />

              {dispatchHasSearched && dispatchHistoryData.length > 0 && (
                <>
                  {/* 배차량 요약 */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">배차량 요약</h3>
                      <span className="text-sm text-gray-500">(조회 기간 기준)</span>
                    </div>
                    <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2">
                      {calculateDispatchSummary(dispatchHistoryData).map((summary) => (
                        <div
                          key={summary.productName}
                          className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-sm border border-blue-100 whitespace-nowrap"
                        >
                          <span className="text-sm font-medium text-gray-700 mr-2">{summary.productName}</span>
                          <span className="text-sm font-bold text-blue-600 mr-1">
                            {summary.totalQuantity.toFixed(2)} ton
                          </span>
                          <span className="text-xs text-gray-500">({summary.totalCount}회)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={downloadDispatchHistoryExcel}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV 다운로드 ({dispatchHistoryData.length}건)
                    </Button>
                  </div>
                </>
              )}

              {dispatchIsLoading || loading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>데이터를 불러오는 중입니다...</p>
                </div>
              ) : !dispatchHasSearched ? (
                <div className="text-center py-12 text-gray-500">
                  <p>조회 조건을 선택하고 조회 버튼을 눌러주세요.</p>
                </div>
              ) : Array.isArray(dispatchCurrentData) && dispatchCurrentData.length > 0 ? (
                <>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-center font-semibold text-gray-700">날짜</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">상태</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">약품</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">업체명</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">입고대수</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">입고량</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">입고시간</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">첨부파일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dispatchCurrentData.map((day, index) => (
                          <TableRow key={day.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-medium text-center text-gray-700">
                              {formatDate(day.date)}
                            </TableCell>
                            <TableCell className="text-center">{renderStatusBadge(day.status)}</TableCell>
                            <TableCell className="text-center font-medium text-gray-700">
                              {day.productName || "-"}
                            </TableCell>
                            <TableCell className="text-center font-medium text-blue-600">
                              {getCompanyName(day.companyId, day.productName)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Truck className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-gray-700">{day.deliveryCount}회</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium text-gray-700">
                              {day.deliveryQuantity && day.deliveryCount
                                ? `${(day.deliveryQuantity * day.deliveryCount).toFixed(1)} ton`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                {Array.isArray(day.deliveryTimes) &&
                                  day.deliveryTimes.map((time, i) => (
                                    <div key={i} className="text-blue-600">
                                      {time}
                                    </div>
                                  ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{renderAttachments(day)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 배차이력 페이지네이션 */}
                  {dispatchTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDispatchPageChange(dispatchCurrentPage - 1)}
                        disabled={dispatchCurrentPage === 1}
                        className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>

                      <div className="flex items-center gap-1">
                        {(() => {
                          const maxVisiblePages = 10
                          const startPage = Math.max(
                            1,
                            Math.min(
                              dispatchCurrentPage - Math.floor(maxVisiblePages / 2),
                              dispatchTotalPages - maxVisiblePages + 1,
                            ),
                          )
                          const endPage = Math.min(dispatchTotalPages, startPage + maxVisiblePages - 1)
                          return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
                        })().map((page) => (
                          <Button
                            key={page}
                            variant={dispatchCurrentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDispatchPageChange(page)}
                            className={`min-w-[40px] h-10 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:scale-[1.05] active:scale-[0.95] ${
                              dispatchCurrentPage === page
                                ? "bg-blue-500 hover:bg-blue-600 text-white font-medium"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDispatchPageChange(dispatchCurrentPage + 1)}
                        disabled={dispatchCurrentPage === dispatchTotalPages}
                        className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* 배차이력 페이지 정보 */}
                  <div className="text-center text-sm text-gray-500 mt-4">
                    총 {dispatchHistoryData.length}개 항목 중 {dispatchStartIndex + 1}-
                    {Math.min(dispatchEndIndex, dispatchHistoryData.length)}개 표시 (페이지 {dispatchCurrentPage}/
                    {dispatchTotalPages})
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>조회된 배차 이력이 없습니다.</p>
                </div>
              )}
            </TabsContent>

            {/* 입고이력 탭 */}
            <TabsContent value="receiving" className="space-y-4">
              <HistoryFilters
                productName={plant === "bio1" ? "유동사" : "bio2"}
                onFilterChange={loadReceivingHistoryData}
              />

              {receivingHasSearched && receivingHistoryData.length > 0 && (
                <>
                  {/* 입고량 요약 - 한 줄로 표시 */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">입고량 요약</h3>
                      <span className="text-sm text-gray-500">(조회 기간 기준)</span>
                    </div>
                    <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2">
                      {calculateChemicalSummary(receivingHistoryData).map((summary) => (
                        <div
                          key={summary.productName}
                          className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-sm border border-blue-100 whitespace-nowrap"
                        >
                          <span className="text-sm font-medium text-gray-700 mr-2">{summary.productName}</span>
                          <span className="text-sm font-bold text-blue-600 mr-1">
                            {(summary.totalWeight / 1000).toFixed(2)} ton
                          </span>
                          <span className="text-xs text-gray-500">({summary.count}건)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={downloadReceivingHistoryExcel}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV 다운로드 ({receivingHistoryData.length}건)
                    </Button>
                  </div>
                </>
              )}

              {receivingIsLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>데이터를 불러오는 중입니다...</p>
                </div>
              ) : !receivingHasSearched ? (
                <div className="text-center py-12 text-gray-500">
                  <p>조회 조건을 선택하고 조회 버튼을 눌러주세요.</p>
                </div>
              ) : Array.isArray(receivingHistoryData) && receivingHistoryData.length > 0 ? (
                <>
                  {/* 기존 테이블 코드는 그대로 유지 */}
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-center font-semibold text-gray-700">날짜</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">입차시간</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">출차시간</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">품명</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">업체명</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">차번호</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">실중량</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receivingCurrentData.map((item, index) => (
                          <TableRow key={item.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-medium text-center text-gray-700">
                              {formatDate(item.first_time)}
                            </TableCell>
                            <TableCell className="text-center text-gray-700">{formatTime(item.first_time)}</TableCell>
                            <TableCell className="text-center text-gray-700">
                              {item.second_time ? formatTime(item.second_time) : "-"}
                            </TableCell>
                            <TableCell className="text-center font-medium text-gray-700">
                              {getProductNameFromChemical(item.chemical)}
                            </TableCell>
                            <TableCell className="text-center font-medium text-blue-600">{item.company}</TableCell>
                            <TableCell className="text-center text-gray-700">{item.car_no}</TableCell>
                            <TableCell className="text-center font-medium text-gray-700">
                              {formatWeight(item.real_weight)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 입고이력 페이지네이션 */}
                  {receivingTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReceivingPageChange(receivingCurrentPage - 1)}
                        disabled={receivingCurrentPage === 1}
                        className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>

                      <div className="flex items-center gap-1">
                        {(() => {
                          const maxVisiblePages = 10
                          const startPage = Math.max(
                            1,
                            Math.min(
                              receivingCurrentPage - Math.floor(maxVisiblePages / 2),
                              receivingTotalPages - maxVisiblePages + 1,
                            ),
                          )
                          const endPage = Math.min(receivingTotalPages, startPage + maxVisiblePages - 1)
                          return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
                        })().map((page) => (
                          <Button
                            key={page}
                            variant={receivingCurrentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleReceivingPageChange(page)}
                            className={`min-w-[40px] h-10 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:scale-[1.05] active:scale-[0.95] ${
                              receivingCurrentPage === page
                                ? "bg-blue-500 hover:bg-blue-600 text-white font-medium"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReceivingPageChange(receivingCurrentPage + 1)}
                        disabled={receivingCurrentPage === receivingTotalPages}
                        className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* 입고이력 페이지 정보 */}
                  <div className="text-center text-sm text-gray-500 mt-4">
                    총 {receivingHistoryData.length}개 항목 중 {receivingStartIndex + 1}-
                    {Math.min(receivingEndIndex, receivingHistoryData.length)}개 표시 (페이지 {receivingCurrentPage}/
                    {receivingTotalPages})
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>조회된 입고 이력이 없습니다.</p>
                </div>
              )}
            </TabsContent>

            {/* 누적 사용량 탭 */}
            <TabsContent value="cumulative" className="space-y-4">
              <HistoryFilters
                productName={plant === "bio1" ? "유동사" : "bio2"}
                onFilterChange={loadCumulativeUsageData}
              />

              {cumulativeHasSearched && cumulativeUsageData.length > 0 && (
                <>
                  {/* 컴팩트한 사용량 요약 - 한 줄로 표시 */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-800">일일 사용량 요약</h3>
                      <span className="text-sm text-gray-500">({getYesterdayDate()} 기준)</span>
                    </div>
                    <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2">
                      {calculateCumulativeSummary(cumulativeUsageData).map((summary) => (
                        <div
                          key={summary.productName}
                          className="flex-shrink-0 bg-white rounded-full px-4 py-2 shadow-sm border border-purple-100 whitespace-nowrap"
                        >
                          <span className="text-sm font-medium text-gray-700 mr-2">{summary.productName}</span>
                          <span className="text-sm font-bold text-purple-600">
                            {formatDailyUsage(summary.dailyUsage)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={downloadCumulativeUsageExcel}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV 다운로드 ({cumulativeUsageData.length}건)
                    </Button>
                  </div>
                </>
              )}

              {cumulativeIsLoading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>데이터를 불러오는 중입니다...</p>
                </div>
              ) : !cumulativeHasSearched ? (
                <div className="text-center py-12 text-gray-500">
                  <p>조회 조건을 선택하고 조회 버튼을 눌러주세요.</p>
                </div>
              ) : Array.isArray(cumulativeUsageData) && cumulativeUsageData.length > 0 ? (
                <>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-center font-semibold text-gray-700">날짜</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">약품</TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">실중량 (합계) </TableHead>
                          <TableHead className="text-center font-semibold text-gray-700">사용량</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cumulativeCurrentData.map((item, index) => (
                          <TableRow
                            key={`${item.date}-${item.chemical}` || index}
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <TableCell className="font-medium text-center text-gray-700">
                              {formatDate(item.date)}
                            </TableCell>
                            <TableCell className="text-center font-medium text-gray-700">
                              {getProductNameFromChemical(item.chemical)}
                            </TableCell>
                            <TableCell className="text-center font-medium text-gray-700">
                              {formatWeight(item.total_weight)}
                            </TableCell>
                            <TableCell className="text-center text-gray-500">추후 구현 예정</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 누적 사용량 페이지네이션 */}
                  {cumulativeTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCumulativePageChange(cumulativeCurrentPage - 1)}
                        disabled={cumulativeCurrentPage === 1}
                        className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>

                      <div className="flex items-center gap-1">
                        {(() => {
                          const maxVisiblePages = 10
                          const startPage = Math.max(
                            1,
                            Math.min(
                              cumulativeCurrentPage - Math.floor(maxVisiblePages / 2),
                              cumulativeTotalPages - maxVisiblePages + 1,
                            ),
                          )
                          const endPage = Math.min(cumulativeTotalPages, startPage + maxVisiblePages - 1)
                          return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
                        })().map((page) => (
                          <Button
                            key={page}
                            variant={cumulativeCurrentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCumulativePageChange(page)}
                            className={`min-w-[40px] h-10 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out transform hover:scale-[1.05] active:scale-[0.95] ${
                              cumulativeCurrentPage === page
                                ? "bg-purple-500 hover:bg-purple-600 text-white font-medium"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCumulativePageChange(cumulativeCurrentPage + 1)}
                        disabled={cumulativeCurrentPage === cumulativeTotalPages}
                        className="h-10 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* 누적 사용량 페이지 정보 */}
                  <div className="text-center text-sm text-gray-500 mt-4">
                    총 {cumulativeUsageData.length}개 항목 중 {cumulativeStartIndex + 1}-
                    {Math.min(cumulativeEndIndex, cumulativeUsageData.length)}개 표시 (페이지 {cumulativeCurrentPage}/
                    {cumulativeTotalPages})
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>조회된 누적 사용량 이력이 없습니다.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
