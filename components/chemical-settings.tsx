"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Package, Factory } from "lucide-react"
import { getBioSetting, updateBioSetting, type BioSetting } from "@/lib/bio-setting-service"

const CHEMICAL_PRODUCTS = ["유동사", "고령토", "요소수", "황산암모늄", "소석회", "중탄산나트륨"]

const PLANTS = [
  { value: "bio1", label: "Bio1 공장" },
  { value: "bio2", label: "Bio2 공장" },
]

export default function ChemicalSettings() {
  const [selectedPlant, setSelectedPlant] = useState<"bio1" | "bio2">("bio1")
  const [settings, setSettings] = useState<Record<string, BioSetting>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()

  // 설정 로드
  const loadSettings = async (plant: "bio1" | "bio2") => {
    setLoading(true)
    try {
      const loadedSettings: Record<string, BioSetting> = {}

      for (const product of CHEMICAL_PRODUCTS) {
        const setting = await getBioSetting(plant, product)
        if (setting) {
          loadedSettings[product] = setting
        } else {
          // 기본값 설정
          const defaultSettings: Record<string, Partial<BioSetting>> = {
            유동사: { min_level: 30, max_level: 80, delivery_quantity: 29, stock_06: 50, flow: 40 },
            고령토: { min_level: 25, max_level: 70, delivery_quantity: 30, stock_06: 45, flow: 35 },
            요소수: { min_level: 1000, max_level: 4500, delivery_quantity: 20, stock_06: 2500, flow: 10 },
            황산암모늄: { min_level: 1000, max_level: 6000, delivery_quantity: 30, stock_06: 3000, flow: 12 },
            소석회: { min_level: 10, max_level: 60, delivery_quantity: 30, stock_06: 35, flow: 14 },
            중탄산나트륨: { min_level: 10, max_level: 25, delivery_quantity: 30, stock_06: 18, flow: 20 },
          }

          const defaultSetting = defaultSettings[product] || defaultSettings["유동사"]
          loadedSettings[product] = {
            plant,
            product_name: product,
            min_level: defaultSetting.min_level || 30,
            max_level: defaultSetting.max_level || 80,
            delivery_quantity: defaultSetting.delivery_quantity || 29,
            stock_06: defaultSetting.stock_06 || 50,
            flow: defaultSetting.flow || 40,
          }
        }
      }

      setSettings(loadedSettings)
    } catch (error) {
      console.error("설정 로드 중 오류:", error)
      toast({
        title: "설정 로드 실패",
        description: "설정을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 공장 변경 시 설정 로드
  useEffect(() => {
    loadSettings(selectedPlant)
  }, [selectedPlant])

  // 설정값 업데이트
  const updateSetting = (product: string, field: keyof BioSetting, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [product]: {
        ...prev[product],
        [field]: value,
      },
    }))
  }

  // 설정 저장
  const saveSetting = async (product: string) => {
    setSaving(product)
    try {
      const setting = settings[product]
      const success = await updateBioSetting(selectedPlant, product, {
        min_level: setting.min_level,
        max_level: setting.max_level,
        delivery_quantity: setting.delivery_quantity,
        stock_06: setting.stock_06,
        flow: setting.flow,
      })

      if (success) {
        toast({
          title: "저장 완료",
          description: `${product} 설정이 성공적으로 저장되었습니다.`,
        })
      } else {
        toast({
          title: "저장 실패",
          description: `${product} 설정 저장 중 오류가 발생했습니다.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("설정 저장 중 오류:", error)
      toast({
        title: "저장 실패",
        description: `${product} 설정 저장 중 오류가 발생했습니다.`,
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 공장 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            공장 선택
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPlant} onValueChange={(value: "bio1" | "bio2") => setSelectedPlant(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANTS.map((plant) => (
                <SelectItem key={plant.value} value={plant.value}>
                  {plant.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 로딩 상태 */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>설정을 불러오는 중...</span>
          </CardContent>
        </Card>
      )}

      {/* 약품별 설정 */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CHEMICAL_PRODUCTS.map((product) => {
            const setting = settings[product]
            if (!setting) return null

            return (
              <Card key={product}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedPlant.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${product}-min`}>최소 재고</Label>
                      <Input
                        id={`${product}-min`}
                        type="number"
                        value={setting.min_level}
                        onChange={(e) => updateSetting(product, "min_level", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${product}-max`}>최대 재고</Label>
                      <Input
                        id={`${product}-max`}
                        type="number"
                        value={setting.max_level}
                        onChange={(e) => updateSetting(product, "max_level", Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${product}-delivery`}>입고량</Label>
                      <Input
                        id={`${product}-delivery`}
                        type="number"
                        value={setting.delivery_quantity}
                        onChange={(e) => updateSetting(product, "delivery_quantity", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${product}-stock`}>06:00 재고량</Label>
                      <Input
                        id={`${product}-stock`}
                        type="number"
                        value={setting.stock_06}
                        onChange={(e) => updateSetting(product, "stock_06", Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`${product}-flow`}>하루 사용량</Label>
                    <Input
                      id={`${product}-flow`}
                      type="number"
                      value={setting.flow}
                      onChange={(e) => updateSetting(product, "flow", Number(e.target.value) || 0)}
                    />
                  </div>

                  <Button onClick={() => saveSetting(product)} disabled={saving === product} className="w-full">
                    {saving === product ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        저장
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
