"use client"
import { useState } from "react"
import {
  Factory,
  Zap,
  ArrowLeft,
  Building2,
  History,
  Settings,
  HelpCircle,
  Droplets,
  Mountain,
  Truck,
  Beaker,
  FlaskRoundIcon as Flask,
  Atom,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { DashboardCalendar } from "@/components/dashboard-calendar"

export default function Dashboard() {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)

  const serviceCards = [
    {
      id: "bio1",
      title: "Biomass 1호기",
      description: "약품 배차 캘린더 보기",
      icon: <Factory className="h-12 w-12 text-green-600" />,
      onClick: () => setSelectedUnit("bio1"),
    },
    {
      id: "bio2",
      title: "Biomass 2호기",
      description: "약품 배차 캘린더 보기",
      icon: <Zap className="h-12 w-12 text-orange-600" />,
      onClick: () => setSelectedUnit("bio2"),
    },
  ]

  const siteMapSections = [
    {
      title: "Biomass 1호기 약품 배차 하기",
      icon: <Factory className="h-5 w-5 text-green-600" />,
      links: [
        { name: "주간 배차 계획 요약", href: "/bio1", icon: <Calendar className="h-4 w-4" /> },
        { name: "유동사", href: "/bio1/sand/draft", icon: <Truck className="h-4 w-4" /> },
        { name: "고령토", href: "/bio1/kaolin/draft", icon: <Mountain className="h-4 w-4" /> },
        {
          name: "요소수",
          href: "/bio1/urea/draft",
          icon: <Flask className="h-4 w-4" />,
        },
        {
          name: "황산암모늄",
          href: "/bio1/sulfate/draft",
          icon: <Atom className="h-4 w-4" />,
        },
        {
          name: "소석회",
          href: "/bio1/hydrated/draft",
          icon: <Droplets className="h-4 w-4" />,
        },
        {
          name: "중탄산나트륨",
          href: "/bio1/sodium/draft",
          icon: <Beaker className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Biomass 2호기 약품 배차 하기",
      icon: <Zap className="h-5 w-5 text-orange-600" />,
      links: [
        { name: "주간 배차 계획 요약", href: "/bio2", icon: <Calendar className="h-4 w-4" /> },
        { name: "유동사", href: "/bio2/sand/draft", icon: <Truck className="h-4 w-4" /> },
        { name: "고령토", href: "/bio2/kaolin/draft", icon: <Mountain className="h-4 w-4" /> },
        {
          name: "요소수",
          href: "/bio2/urea/draft",
          icon: <Flask className="h-4 w-4" />,
        },
        {
          name: "황산암모늄",
          href: "/bio2/sulfate/draft",
          icon: <Atom className="h-4 w-4" />,
        },
        {
          name: "소석회",
          href: "/bio2/hydrated/draft",
          icon: <Droplets className="h-4 w-4" />,
        },
        {
          name: "중탄산나트륨",
          href: "/bio2/sodium/draft",
          icon: <Beaker className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "추가 기능",
      icon: <Settings className="h-5 w-5 text-blue-600" />,
      links: [
        { name: "납품업체 정보", href: "/companies", icon: <Building2 className="h-4 w-4" /> },
        { name: "이력 조회 (계근표, 시험성적서)", href: "/history", icon: <History className="h-4 w-4" /> },
        { name: "설정", href: "/settings", icon: <Settings className="h-4 w-4" /> },
        { name: "도움말", href: "/manual", icon: <HelpCircle className="h-4 w-4" /> },
      ],
    },
  ]

  if (selectedUnit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="container py-4 md:py-6">
          <div className="mb-4 md:mb-6 flex items-center gap-4">
            <button
              onClick={() => setSelectedUnit(null)}
              className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-full shadow-sm hover:bg-white/90 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">돌아가기</span>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {selectedUnit === "bio1" ? "Bio #1" : "Bio #2"} 배차 계획 달력
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-2">
                {selectedUnit === "bio1" ? "1호기" : "2호기"} 발전소의 배차 계획을 달력으로 확인하세요
              </p>
            </div>
          </div>
          <DashboardCalendar bioType={selectedUnit as "bio1" | "bio2"} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">약품 배차 캘린더</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {serviceCards.map((card) => (
              <div
                key={card.id}
                onClick={card.onClick}
                className="group relative bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-sm hover:shadow-md hover:bg-white/90 transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-gray-50/50 rounded-2xl group-hover:bg-gray-100/50 transition-colors duration-200">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-base text-gray-600 leading-relaxed">{card.description}</p>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">전체 메뉴</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteMapSections.map((section, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-md border border-gray-200/50 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-50/50 rounded-lg">{section.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                </div>
                <div className="space-y-0.5">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={linkIndex}
                      href={link.href}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50/50 transition-colors duration-200 group"
                    >
                      <div className="text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                        {link.icon}
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        {link.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
