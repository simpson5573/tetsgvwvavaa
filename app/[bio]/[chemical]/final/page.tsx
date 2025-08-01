"use client"

import { redirect } from "next/navigation"
import FinalSystem from "@/components/final-system"

// 유효한 bio와 chemical 조합 정의
const VALID_COMBINATIONS = {
  bio1: ["hydrated", "kaolin", "sand", "sodium", "sulfate", "urea"],
  bio2: ["hydrated", "kaolin", "sand", "sodium", "sulfate", "urea"],
}

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

interface PageProps {
  params: {
    bio: string
    chemical: string
  }
}

export default function DynamicFinalPage({ params }: PageProps) {
  const { bio, chemical } = params

  // 유효한 라우트인지 확인
  if (!bio || !chemical || !VALID_COMBINATIONS[bio as keyof typeof VALID_COMBINATIONS]?.includes(chemical)) {
    redirect("/")
  }

  return <FinalSystem bio={bio} chemical={chemical} />
}
