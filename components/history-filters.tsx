"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useCompanyStore } from "@/lib/company-store"

export interface HistoryFilters {
  year: string
  month: string
  companyId: string
  productName: string
}

interface HistoryFiltersProps {
  productName?: string
  onFilterChange: (filters: HistoryFilters) => void
}

export default function HistoryFilters({ productName, onFilterChange }: HistoryFiltersProps) {
  const { companies, loadCompanies } = useCompanyStore()
  const [filters, setFilters] = useState<HistoryFilters>({
    year: "",
    month: "",
    companyId: "",
    productName: "",
  })

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleFilterChange = (key: keyof HistoryFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    onFilterChange(filters)
  }

  // 연도 옵션 생성 (현재 연도부터 과거 5년)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i)

  // 월 옵션
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

  // Bio2 전용 품명 옵션
  const getBio2ProductOptions = () => {
    return [
      { value: "유동사", label: "유동사" },
      { value: "고령토", label: "고령토" },
      { value: "소석회", label: "소석회" },
      { value: "중탄산나트륨", label: "중탄산나트륨" },
      { value: "황산암모늄", label: "황산암모늄" },
      { value: "요소수", label: "요소수" },
    ]
  }

  // Bio1 전용 품명 옵션
  const getBio1ProductOptions = () => {
    return [
      { value: "유동사", label: "유동사" },
      { value: "고령토", label: "고령토" },
      { value: "요소수", label: "요소수" },
      { value: "황산암모늄", label: "황산암모늄" },
      { value: "소석회", label: "소석회" },
      { value: "중탄산나트륨", label: "중탄산나트륨" },
    ]
  }

  // 품명 옵션 결정
  const getProductOptions = () => {
    if (productName === "bio2") {
      return getBio2ProductOptions()
    }
    return getBio1ProductOptions()
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        {/* 연도 필터 */}
        <div>
          <Select value={filters.year} onValueChange={(value) => handleFilterChange("year", value)}>
            <SelectTrigger>
              <SelectValue placeholder="연도 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 연도</SelectItem>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 월 필터 */}
        <div>
          <Select value={filters.month} onValueChange={(value) => handleFilterChange("month", value)}>
            <SelectTrigger>
              <SelectValue placeholder="월 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 월</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {month}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 약품 필터 */}
        <div>
          <Select value={filters.productName} onValueChange={(value) => handleFilterChange("productName", value)}>
            <SelectTrigger>
              <SelectValue placeholder="약품 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 약품</SelectItem>
              {getProductOptions().map((product) => (
                <SelectItem key={product.value} value={product.value}>
                  {product.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 조회 버튼 - Material Design 스타일 */}
        <div>
          <Button
            onClick={handleSearch}
            className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
          >
            조회
          </Button>
        </div>
      </div>
    </div>
  )
}
