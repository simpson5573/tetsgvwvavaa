"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Package, Building2, SettingsIcon } from "lucide-react"
import type { DispatchSettings } from "@/components/draft-system"
import { getBioSettingOrDefault, updateBioSetting, type BioSetting } from "@/lib/bio-setting-service"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: DispatchSettings | null
  setSettings: (settings: DispatchSettings) => void
  onGenerate: (newSettings?: DispatchSettings) => void
  companies: any[]
  plant?: string // 새로 추가
}

export default function SettingsDialog({
  open,
  onOpenChange,
  settings,
  setSettings,
  onGenerate,
  companies = [],
  plant = "bio1", // 기본값은 bio1
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<DispatchSettings | null>(null)
  const [bulkDailyUsage, setBulkDailyUsage] = useState<number>(15)
  const [bioSetting, setBioSetting] = useState<BioSetting | null>(null)

  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...settings })

      // Bio 설정 로드
      const loadBioSetting = async () => {
        if (settings.productName) {
          const currentPath = window.location.pathname
          let actualProductName = "알 수 없음"

          // 경로 기반으로 제품명 결정 - 절대적 우선순위
          if (currentPath.includes("/sand")) {
            actualProductName = "유동사"
            console.log("✅ Path contains '/sand' -> 유동사")
          } else if (currentPath.includes("/hydrated")) {
            actualProductName = "소석회"
            console.log("✅ Path contains '/hydrated' -> 소석회")
          } else if (currentPath.includes("/kaolin")) {
            actualProductName = "고령토"
            console.log("✅ Path contains '/kaolin' -> 고령토")
          } else if (currentPath.includes("/urea")) {
            actualProductName = "요소수"
            console.log("✅ Path contains '/urea' -> 요소수")
          } else if (currentPath.includes("/sulfate")) {
            actualProductName = "황산암모늄"
            console.log("✅ Path contains '/sulfate' -> 황산암모늄")
          } else if (currentPath.includes("/sodium")) {
            actualProductName = "중탄산나트륨"
            console.log("✅ Path contains '/sodium' -> 중탄산나트륨")
          }

          const bioSettingData = await getBioSettingOrDefault(plant, actualProductName)
          setBioSetting(bioSettingData)

          // Bio 설정값으로 localSettings 업데이트
          setLocalSettings((prev) =>
            prev
              ? {
                  ...prev,
                  minLevel: bioSettingData.min_level,
                  maxLevel: bioSettingData.max_level,
                  currentStock: bioSettingData.stock_06,
                  deliveryAmount: bioSettingData.delivery_quantity,
                  // dailyUsage를 Bio 설정의 flow 값으로 초기화 - 10일로 확장
                  dailyUsage: Array(10)
                    .fill(null)
                    .map(() => ({ type: "single", value: bioSettingData.flow })),
                }
              : null,
          )

          // bulkDailyUsage도 Bio 설정값으로 업데이트
          setBulkDailyUsage(bioSettingData.flow)
        }
      }

      loadBioSetting()
    }
  }, [settings, plant])

  useEffect(() => {
    if (localSettings?.dailyUsage && Array.isArray(localSettings.dailyUsage)) {
      const validUsages = localSettings.dailyUsage
        .filter((usage) => typeof usage.value === "number")
        .map((usage) => usage.value as number)

      if (validUsages.length > 0) {
        const average = validUsages.reduce((sum, val) => sum + val, 0) / validUsages.length
        setBulkDailyUsage(Math.round(average))
      }
    }
  }, [localSettings?.dailyUsage])

  const handleSave = async () => {
    if (localSettings && bioSetting) {
      // Bio 설정 업데이트
      // URL 경로에서 제품명 직접 추출 (loadBioSetting과 동일한 로직)
      const currentPath = window.location.pathname
      let actualProductName = "알 수 없음"

      if (currentPath.includes("/sand")) {
        actualProductName = "유동사"
      } else if (currentPath.includes("/hydrated")) {
        actualProductName = "소석회"
      } else if (currentPath.includes("/kaolin")) {
        actualProductName = "고령토"
      } else if (currentPath.includes("/urea")) {
        actualProductName = "요소수"
      } else if (currentPath.includes("/sulfate")) {
        actualProductName = "황산암모늄"
      } else if (currentPath.includes("/sodium")) {
        actualProductName = "중탄산나트륨"
      }

      const bioSettingUpdate = {
        min_level: localSettings.minLevel ?? 0,
        max_level: localSettings.maxLevel ?? 100,
        delivery_quantity: localSettings.deliveryAmount ?? 25,
        stock_06: localSettings.currentStock ?? 50, // 사용자가 수정한 06:00 재고량을 stock_06에 저장
        flow: bulkDailyUsage,
      }

      const bioUpdateSuccess = await updateBioSetting(plant, actualProductName, bioSettingUpdate)

      if (!bioUpdateSuccess) {
        console.warn("Bio 설정 업데이트에 실패했지만 계속 진행합니다.")
      }

      // 안전한 설정값 확인 (기존 로직 유지)
      const safeSettings: DispatchSettings = {
        ...localSettings,
        minLevel: localSettings.minLevel ?? 0,
        maxLevel: localSettings.maxLevel ?? 100,
        currentStock: localSettings.currentStock ?? 50,
        deliveryAmount: localSettings.deliveryAmount ?? 25,
        dailyUsage:
          Array.isArray(localSettings.dailyUsage) && localSettings.dailyUsage.length > 0
            ? localSettings.dailyUsage
            : [{ type: "single", value: bulkDailyUsage }],
        startDate: localSettings.startDate || new Date().toISOString().split("T")[0],
        endDate: localSettings.endDate || new Date().toISOString().split("T")[0],
        productName: localSettings.productName || "",
        unit: localSettings.unit || "ton",
        conversionRate: localSettings.conversionRate || 1,
      }

      // 먼저 설정을 저장
      setSettings(safeSettings)

      // 그리고 새로운 설정으로 바로 생성
      onGenerate(safeSettings)
      onOpenChange(false)
    }
  }

  const updateLocalSettings = (updates: Partial<DispatchSettings>) => {
    if (localSettings) {
      setLocalSettings({ ...localSettings, ...updates })
    }
  }

  const updateDailyUsage = (dayIndex: number, value: number) => {
    if (!localSettings || !Array.isArray(localSettings.dailyUsage)) return

    const newDailyUsage = [...localSettings.dailyUsage]
    if (dayIndex < newDailyUsage.length) {
      newDailyUsage[dayIndex] = { type: "single", value }
    } else {
      // 배열 길이가 부족한 경우 확장
      while (newDailyUsage.length <= dayIndex) {
        newDailyUsage.push({ type: "single", value: bioSetting?.flow || 15 }) // Bio 설정의 flow 값 사용
      }
      newDailyUsage[dayIndex] = { type: "single", value }
    }

    updateLocalSettings({ dailyUsage: newDailyUsage })
  }

  // 현재 경로 기반으로 표시할 제품명 결정
  const getDisplayProductName = () => {
    const currentPath = window.location.pathname

    if (currentPath.includes("/sand")) {
      return "유동사"
    } else if (currentPath.includes("/hydrated")) {
      return "소석회"
    } else if (currentPath.includes("/kaolin")) {
      return "고령토"
    } else if (currentPath.includes("/urea")) {
      return "요소수"
    } else if (currentPath.includes("/sulfate")) {
      return "황산암모늄"
    } else if (currentPath.includes("/sodium")) {
      return "중탄산나트륨"
    }

    return localSettings?.productName || "알 수 없음"
  }

  if (!localSettings) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            배차 설정 - {getDisplayProductName()}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 기본 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                재고 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minLevel">최소 재고</Label>
                  <Input
                    id="minLevel"
                    type="number"
                    value={localSettings.minLevel ?? 0}
                    onChange={(e) => updateLocalSettings({ minLevel: Number(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxLevel">최대 재고</Label>
                  <Input
                    id="maxLevel"
                    type="number"
                    value={localSettings.maxLevel ?? 100}
                    onChange={(e) => updateLocalSettings({ maxLevel: Number(e.target.value) || 100 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentStock">06:00 재고량</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={localSettings.currentStock ?? 50}
                    onChange={(e) => updateLocalSettings({ currentStock: Number(e.target.value) || 50 })}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryAmount">입고량</Label>
                  <Input
                    id="deliveryAmount"
                    type="number"
                    value={localSettings.deliveryAmount ?? 25}
                    onChange={(e) => updateLocalSettings({ deliveryAmount: Number(e.target.value) || 25 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기간 및 업체 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                기간 및 업체
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">시작일</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={localSettings.startDate || ""}
                    onChange={(e) => updateLocalSettings({ startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">종료일</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={localSettings.endDate || ""}
                    onChange={(e) => updateLocalSettings({ endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company">업체 선택</Label>
                <Select
                  value={localSettings.companyId?.toString() || ""}
                  onValueChange={(value) => updateLocalSettings({ companyId: Number(value) || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="업체를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(companies) &&
                      companies.map((company) => (
                        <SelectItem key={company?.id || 0} value={company?.id?.toString() || "0"}>
                          {company?.name || "알 수 없는 업체"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 일별 사용량 설정 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                일별 사용량 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 전체 하루 사용량 일괄 설정 */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="bulkUsage" className="text-sm font-medium text-blue-900">
                      전체 기간 하루 사용량 일괄 설정
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="bulkUsage"
                        type="number"
                        value={bulkDailyUsage}
                        onChange={(e) => setBulkDailyUsage(Number(e.target.value) || 0)}
                        className="w-32"
                        placeholder="사용량"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // 모든 요일에 동일한 사용량을 한 번에 적용 - 10일로 확장
                          const newDailyUsage = Array(10)
                            .fill(null)
                            .map(() => ({ type: "single", value: bulkDailyUsage }))
                          updateLocalSettings({ dailyUsage: newDailyUsage })
                        }}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        전체 적용
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  위 값을 입력하고 '전체 적용' 버튼을 클릭하면 모든 요일에 동일한 사용량이 설정됩니다.
                  <br />
                  10일차 이후로는 10일차에 입력한 값이 적용됩니다.
                </p>
              </div>

              {/* 개별 요일 설정 - 5개씩 두 줄로 표시 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">개별 요일 설정</Label>
                <div className="space-y-2">
                  {/* 첫 번째 줄: 1일차 ~ 5일차 */}
                  <div className="grid grid-cols-5 gap-2">
                    {["1일차", "2일차", "3일차", "4일차", "5일차"].map((day, index) => (
                      <div key={day} className="text-center">
                        <Label className="text-sm font-medium block mb-1">{day}</Label>
                        <Input
                          type="number"
                          className="h-9 text-sm text-center"
                          value={
                            Array.isArray(localSettings.dailyUsage) &&
                            localSettings.dailyUsage[index] &&
                            typeof localSettings.dailyUsage[index].value === "number"
                              ? localSettings.dailyUsage[index].value
                              : bioSetting?.flow || 15 // Bio 설정의 flow 값을 기본값으로 사용
                          }
                          onChange={(e) => updateDailyUsage(index, Number(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                  {/* 두 번째 줄: 6일차 ~ 10일차 */}
                  <div className="grid grid-cols-5 gap-2">
                    {["6일차", "7일차", "8일차", "9일차", "10일차"].map((day, index) => {
                      const dayIndex = index + 5 // 6일차부터 시작하므로 +5
                      return (
                        <div key={day} className="text-center">
                          <Label className="text-sm font-medium block mb-1">{day}</Label>
                          <Input
                            type="number"
                            className="h-9 text-sm text-center"
                            value={
                              Array.isArray(localSettings.dailyUsage) &&
                              localSettings.dailyUsage[dayIndex] &&
                              typeof localSettings.dailyUsage[dayIndex].value === "number"
                                ? localSettings.dailyUsage[dayIndex].value
                                : bioSetting?.flow || 15 // Bio 설정의 flow 값을 기본값으로 사용
                            }
                            onChange={(e) => updateDailyUsage(dayIndex, Number(e.target.value) || 0)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장 및 생성</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
