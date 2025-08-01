"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBioSettingOrDefault } from "@/lib/bio-setting-service"

interface FinalSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: {
    deliveryAmount: number
    dailyUsage: number
    morningStock: number
    productName: string
    dailyUsageValues?: number[]
  }
  onApply: (settings: any) => void
  productName: string
  plant?: "bio1" | "bio2"
}

export default function FinalSettingsDialog({
  open,
  onOpenChange,
  settings,
  onApply,
  productName,
  plant = "bio1",
}: FinalSettingsDialogProps) {
  const [morningStock, setMorningStock] = useState(settings.morningStock || 50)
  const [bulkDailyUsage, setBulkDailyUsage] = useState(settings.dailyUsage || 15)
  const [dailyUsageValues, setDailyUsageValues] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  // 컴포넌트 마운트 시 Bio 설정에서 기본값 로드
  useEffect(() => {
    const loadBioSettings = async () => {
      if (open && productName) {
        try {
          const actualProductName = productName.replace("bio2_", "")
          const bioSetting = await getBioSettingOrDefault(plant, actualProductName)

          // Bio 설정에서 가져온 값으로 초기화
          setMorningStock(bioSetting.stock_06 || settings.morningStock || 50)
          setBulkDailyUsage(bioSetting.flow || settings.dailyUsage || 15)

          // 10일간의 일일 사용량 배열 초기화 - 기존 값이 있으면 사용, 없으면 Bio 설정값 사용
          const defaultUsage = bioSetting.flow || settings.dailyUsage || 15
          const initialDailyUsage =
            settings.dailyUsageValues && settings.dailyUsageValues.length === 10
              ? settings.dailyUsageValues
              : Array(10).fill(defaultUsage)
          setDailyUsageValues(initialDailyUsage)
        } catch (error) {
          console.error("Bio 설정 로드 중 오류:", error)
          // 오류 발생 시 기본값 사용
          setMorningStock(settings.morningStock || 50)
          setBulkDailyUsage(settings.dailyUsage || 15)
          setDailyUsageValues(Array(10).fill(settings.dailyUsage || 15))
        }
      }
    }

    loadBioSettings()
  }, [open, productName, plant, settings])

  // 전체 적용 버튼 핸들러
  const handleBulkApply = () => {
    const newValues = Array(10).fill(bulkDailyUsage)
    setDailyUsageValues(newValues)
  }

  // 개별 일일 사용량 변경 핸들러
  const handleDailyUsageChange = (index: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    const newValues = [...dailyUsageValues]
    newValues[index] = numValue
    setDailyUsageValues(newValues)
  }

  // 적용 버튼 핸들러
  const handleApply = async () => {
    setLoading(true)
    try {
      const newSettings = {
        morningStock: morningStock,
        dailyUsage: bulkDailyUsage, // 대표값으로 벌크 사용량 사용
        dailyUsageValues: dailyUsageValues, // 개별 일일 사용량 배열
        productName: productName,
        deliveryAmount: settings.deliveryAmount, // 기존 입고량 유지
      }

      await onApply(newSettings)
      onOpenChange(false)
    } catch (error) {
      console.error("설정 적용 중 오류:", error)
    } finally {
      setLoading(false)
    }
  }

  // 단위 결정 (mm 단위 제품들)
  const isMillimeterUnit =
    productName === "요소수" ||
    productName === "황산암모늄" ||
    productName === "bio2_요소수" ||
    productName === "bio2_황산암모늄"
  const stockUnit = isMillimeterUnit ? "mm" : "ton"
  const usageUnit = "ton/day"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            재고량 캘리브레이션 - {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 주의사항 */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h3 className="font-medium text-amber-800 mb-2">⚠️ 주의사항</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 설정 변경 시 입고시간과 입고대수는 변경되지 않습니다.</li>
              <li>• 재고량(06:00, 입고 전/후, 20:00)만 새로운 설정에 따라 재계산됩니다.</li>
              <li>• 변경사항은 현재 날짜 이후의 모든 배차계획에 적용됩니다.</li>
              <li>• 입고량은 각 로우의 설정된 값을 기준으로 계산됩니다.</li>
            </ul>
          </div>

          {/* 기본 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">기본 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="morningStock">06:00 재고량</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="morningStock"
                    type="number"
                    value={morningStock}
                    onChange={(e) => setMorningStock(Number.parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500 min-w-[40px]">{stockUnit}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 일일 사용량 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">📊 일일 사용량 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 전체 기간 하루 사용량 일괄 설정 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-3">전체 기간 하루 사용량 일괄 설정</h3>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={bulkDailyUsage}
                    onChange={(e) => setBulkDailyUsage(Number.parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="0"
                    className="w-32"
                  />
                  <Button onClick={handleBulkApply} variant="default">
                    전체 적용
                  </Button>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  위 값을 입력하고 '전체 적용' 버튼을 클릭하면 모든 요일에 동일한 사용량이 설정됩니다.
                  <br />
                  10일차 이후로는 10일차에 입력한 값이 적용됩니다.
                </p>
              </div>

              {/* 개별 요일 설정 */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">개별 요일 설정</h3>
                <div className="grid grid-cols-5 gap-4">
                  {dailyUsageValues.map((value, index) => (
                    <div key={index} className="space-y-2">
                      <Label className="text-sm font-medium">{index + 1}일차</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => handleDailyUsageChange(index, e.target.value)}
                          step="0.1"
                          min="0"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">단위: {usageUnit}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={handleApply} disabled={loading}>
            {loading ? "적용 중..." : "적용"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
