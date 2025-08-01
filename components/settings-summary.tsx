"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenLine, Calendar, Package, Settings } from "lucide-react"
import type { DispatchSettings } from "@/components/draft-system"
import { format, differenceInDays, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { usePathname } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { getBioSettingOrDefault } from "@/lib/bio-setting-service"

interface SettingsSummaryProps {
  settings: DispatchSettings | null
  onOpenSettings?: () => void
  companies?: any[]
}

export default function SettingsSummary({ settings, onOpenSettings, companies = [] }: SettingsSummaryProps) {
  const pathname = usePathname()

  const productName = useMemo(() => {
    return pathname.split("/")[1]
  }, [pathname])

  const [bioFlowValue, setBioFlowValue] = useState<number>(0)

  useEffect(() => {
    const loadBioFlow = async () => {
      if (settings?.productName) {
        // plant 구분: URL이나 productName에서 bio1/bio2 판단
        const plant = pathname.includes("/bio2/") ? "bio2" : "bio1"
        // 실제 제품명 사용 (bio2_ 접두사 없이)
        const actualProductName = settings.productName

        const bioSetting = await getBioSettingOrDefault(plant, actualProductName)
        // Ensure flow is always a number
        const flowValue =
          typeof bioSetting.flow === "number"
            ? bioSetting.flow
            : bioSetting.flow
              ? Number.parseFloat(bioSetting.flow.toString())
              : 0
        setBioFlowValue(isNaN(flowValue) ? 0 : flowValue)
      }
    }

    loadBioFlow()
  }, [settings?.productName, pathname])

  if (!settings) {
    return (
      <Card className="w-full shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-gray-500 text-sm">설정이 없습니다.</div>
            <Button onClick={onOpenSettings} variant="outline" size="sm" className="w-full sm:w-auto bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MM/dd", { locale: ko })
    } catch {
      return dateStr
    }
  }

  const calculatePlanDays = () => {
    try {
      return differenceInDays(parseISO(settings.endDate), parseISO(settings.startDate)) + 1
    } catch {
      return 0
    }
  }

  const calculateDailyUsage = () => {
    try {
      const planDays = calculatePlanDays()
      if (!Array.isArray(settings.dailyUsage) || settings.dailyUsage.length === 0 || planDays === 0) return 0

      let totalUsage = 0
      for (let i = 0; i < planDays; i++) {
        const dayConfig = i < settings.dailyUsage.length ? settings.dailyUsage[i] : settings.dailyUsage[0]
        if (dayConfig?.type === "single" && typeof dayConfig.value === "number") {
          totalUsage += dayConfig.value
        }
      }
      return totalUsage / planDays
    } catch {
      return 0
    }
  }

  const planDays = calculatePlanDays()
  const dailyUsage = calculateDailyUsage()

  return (
    <Card className="w-full shadow-sm border-gray-200">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full lg:w-auto">
            {/* 기간 정보 */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  {formatDate(settings.startDate)} ~ {formatDate(settings.endDate)}
                </span>
                <span className="text-gray-500 ml-2">({planDays}일)</span>
              </div>
            </div>

            {/* 재고 정보 */}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  06:00 재고: {(settings.currentStock ?? 0).toFixed(1)}
                  {settings.unit === "mm" ? "mm" : "ton"}
                </span>
                <span className="text-gray-500 ml-2">
                  ({(settings.minLevel ?? 0).toFixed(1)}~{(settings.maxLevel ?? 100).toFixed(1)})
                </span>
              </div>
            </div>

            {/* 사용량 정보 (bio_setting의 flow 값 사용) */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-700 border-orange-200 text-xs">
                하루 사용량: {(typeof bioFlowValue === "number" ? bioFlowValue : 0).toFixed(1)}ton
              </Badge>
            </div>
          </div>

          <Button
            onClick={onOpenSettings}
            variant="default"
            size="sm"
            className="w-full sm:w-auto lg:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PenLine className="h-4 w-4 mr-2" />
            작성
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
