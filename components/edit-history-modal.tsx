"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Clock, Download } from "lucide-react"
import { getEditHistory, type EditHistory, EDIT_TYPE_LABELS } from "@/lib/edit-history-service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface EditHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plant: string
  chemical: string
  productName: string
}

const ITEMS_PER_PAGE = 12

export default function EditHistoryModal({ open, onOpenChange, plant, chemical, productName }: EditHistoryModalProps) {
  const [history, setHistory] = useState<EditHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 이력 로드
  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getEditHistory(plant, chemical)
      setHistory(data)
      setCurrentPage(1) // 데이터 로드 시 첫 페이지로 리셋
    } catch (error) {
      console.error("이력 로드 오류:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadHistory()
    }
  }, [open, plant, chemical])

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "MM/dd HH:mm", { locale: ko })
  }

  const formatDateTimeForCSV = (dateStr: string) => {
    return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss", { locale: ko })
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = history.slice(startIndex, endIndex)

  // CSV 다운로드 함수
  const downloadCSV = () => {
    if (history.length === 0) return

    // CSV 헤더
    const headers = ["날짜", "설명", "실행자", "편집타입", "이전값", "새값"]

    // CSV 데이터 생성
    const csvData = history.map((item) => [
      formatDateTimeForCSV(item.created_at),
      `"${item.description}"`, // 쉼표가 포함될 수 있으므로 따옴표로 감싸기
      item.user_name,
      EDIT_TYPE_LABELS[item.edit_type] || item.edit_type,
      `"${JSON.stringify(item.old_value) || ""}"`,
      `"${JSON.stringify(item.new_value) || ""}"`,
    ])

    // CSV 문자열 생성
    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n")

    // BOM 추가 (한글 깨짐 방지)
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })

    // 다운로드
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `편집이력_${productName}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 페이지네이션 렌더링
  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    return (
      <Pagination className="mt-3">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => handlePageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl h-[80vh] bg-white flex flex-col">
        <DialogHeader className="pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-50 rounded-md">
                <Clock className="h-3 w-3 text-blue-600" />
              </div>
              {productName} 이력
              <span className="text-xs font-normal text-gray-500">(최근 10일)</span>
            </DialogTitle>

            {history.length > 0 && (
              <Button
                onClick={downloadCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-transparent text-xs px-2 py-1 h-7"
              >
                <Download className="h-3 w-3" />
                CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 mt-2 flex flex-col min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-6 h-6 bg-gray-50 rounded-full mb-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                </div>
                <p className="text-xs text-gray-600">이력을 불러오는 중...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-50 rounded-full mb-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">이력이 없습니다</h3>
                <p className="text-xs text-gray-500">최근 10일간 이력이 없습니다.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center text-xs text-gray-600 px-1 flex-shrink-0">
                <span>총 {history.length}개</span>
                <span>
                  {startIndex + 1}-{Math.min(endIndex, history.length)} / {history.length}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm h-full">
                  <div className="overflow-x-auto h-full">
                    <Table className="text-xs min-w-full">
                      <TableHeader className="bg-gray-50 sticky top-0">
                        <TableRow className="border-b border-gray-200">
                          <TableHead className="w-[100px] font-medium text-gray-700 py-1.5 px-2 text-center text-xs">
                            날짜
                          </TableHead>
                          <TableHead className="min-w-[300px] font-medium text-gray-700 py-1.5 px-2 text-center text-xs">
                            설명
                          </TableHead>
                          <TableHead className="w-[80px] font-medium text-gray-700 py-1.5 px-2 text-center text-xs">
                            실행자
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentItems.map((item, index) => (
                          <TableRow
                            key={item.id}
                            className={`
                            border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150
                            ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}
                          `}
                          >
                            <TableCell className="py-1.5 px-2 text-xs text-gray-600 text-center whitespace-nowrap">
                              {formatDateTime(item.created_at)}
                            </TableCell>
                            <TableCell className="py-1.5 px-2 text-xs text-gray-900 text-left">
                              <div className="whitespace-pre-wrap break-words text-center">{item.description}</div>
                            </TableCell>
                            <TableCell className="py-1.5 px-2 text-xs text-gray-700 text-center whitespace-nowrap">
                              {item.user_name}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 mt-3">{renderPagination()}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
