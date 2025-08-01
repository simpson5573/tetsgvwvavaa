"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import DraftSystem from "@/components/draft-system"
import { useToast } from "@/hooks/use-toast"

// 유효한 bio와 chemical 조합 정의
const VALID_COMBINATIONS = {
  bio1: ["hydrated", "kaolin", "sand", "sodium", "sulfate", "urea"],
  bio2: ["hydrated", "kaolin", "sand", "sodium", "sulfate", "urea"],
}

// chemical 코���를 실�� 제품명으로 매핑
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

export default function DynamicDraftPage() {
  const params = useParams()
  const { toast } = useToast()
  const [isValidRoute, setIsValidRoute] = useState(false)

  const bio = params.bio as string
  const chemical = params.chemical as string

  useEffect(() => {
    // 유효한 라우트인지 확인
    if (bio && chemical && VALID_COMBINATIONS[bio as keyof typeof VALID_COMBINATIONS]?.includes(chemical)) {
      setIsValidRoute(true)
    } else {
      setIsValidRoute(false)
      toast({
        title: "잘못된 경로",
        description: "존재하지 않는 페이지입니다.",
        variant: "destructive",
      })
    }
  }, [bio, chemical, toast])

  if (!isValidRoute) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-600">요청하신 페이지가 존재하지 않습니다.</p>
        </div>
      </div>
    )
  }

  const productName = CHEMICAL_TO_PRODUCT[chemical as keyof typeof CHEMICAL_TO_PRODUCT]
  const plant = bio

  return (
    <div className="container py-6">
      <DraftSystem productName={productName} plant={plant} />
    </div>
  )
}
