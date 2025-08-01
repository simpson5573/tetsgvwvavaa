"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Trash } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { DispatchSettings } from "@/components/draft-system"

interface SettingsFormProps {
  settings: DispatchSettings
  setSettings: (settings: DispatchSettings) => void
}

export default function SettingsForm({ settings, setSettings }: SettingsFormProps) {
  const [usageMode, setUsageMode] = useState<"single" | "multiple">("single")
  const [usageValues, setUsageValues] = useState<number[]>(
    Array.isArray(settings.dailyUsage) ? settings.dailyUsage : [settings.dailyUsage],
  )

  const handleChange = (field: keyof DispatchSettings, value: any) => {
    setSettings({
      ...settings,
      [field]: value,
    })
  }

  const handleDateSelect = (date: Date | undefined, field: "startDate" | "endDate") => {
    if (date) {
      const newDateString = date.toISOString().split("T")[0]

      if (field === "startDate") {
        // 시작일이 종료일보다 늦으면 종료일도 함께 업데이트
        if (settings.endDate && newDateString > settings.endDate) {
          handleChange("endDate", newDateString)
        }
        handleChange("startDate", newDateString)
      } else {
        // 종료일이 시작일보다 빠르면 시작일도 함께 업데이트
        if (settings.startDate && newDateString < settings.startDate) {
          handleChange("startDate", newDateString)
        }
        handleChange("endDate", newDateString)
      }

      // 날짜가 변경되면 일별 설정 값도 업데이트
      updateUsageValuesForDateRange(settings.startDate, newDateString, field)
    }
  }

  const updateUsageValuesForDateRange = (startDate: string, endDate: string, changedField: "startDate" | "endDate") => {
    if (!startDate || !endDate) return

    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (usageMode === "multiple") {
      let newValues: number[]

      if (changedField === "startDate") {
        // 시작일이 변경된 경우: 새로운 날짜 범위에 맞게 배열 조정
        const defaultValue = usageValues.length > 0 ? usageValues[0] : 15
        newValues = Array(daysDiff).fill(defaultValue)

        // 기존 값 중 유지할 수 있는 것은 유지
        const preserveCount = Math.min(usageValues.length, daysDiff)
        for (let i = 0; i < preserveCount; i++) {
          newValues[i] = usageValues[i]
        }
      } else {
        // 종료일이 변경된 경우
        if (daysDiff > usageValues.length) {
          // 날짜가 늘어난 경우: 마지막 값으로 채움
          const lastValue = usageValues.length > 0 ? usageValues[usageValues.length - 1] : 15
          newValues = [...usageValues]
          while (newValues.length < daysDiff) {
            newValues.push(lastValue)
          }
        } else {
          // 날짜가 줄어든 경우: 잘라냄
          newValues = usageValues.slice(0, daysDiff)
        }
      }

      setUsageValues(newValues)
      handleChange("dailyUsage", newValues)
      handleChange("planDays", daysDiff)
    } else {
      // 단일값 모드에서는 planDays만 업데이트
      handleChange("planDays", daysDiff)
    }
  }

  const toggleUsageMode = () => {
    if (usageMode === "single") {
      setUsageMode("multiple")

      // 시작일과 종료일 사이의 일수 계산
      const start = new Date(settings.startDate)
      const end = new Date(settings.endDate)
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const singleValue = Array.isArray(settings.dailyUsage) ? settings.dailyUsage[0] : settings.dailyUsage
      const newValues = Array(daysDiff).fill(singleValue)

      setUsageValues(newValues)
      handleChange("dailyUsage", newValues)
      handleChange("planDays", daysDiff)
    } else {
      setUsageMode("single")
      handleChange("dailyUsage", usageValues[0])
    }
  }

  const updateUsageValue = (index: number, value: number) => {
    const newValues = [...usageValues]
    newValues[index] = value
    setUsageValues(newValues)
    handleChange("dailyUsage", newValues)
  }

  const addUsageDay = () => {
    const newValues = [...usageValues, usageValues[usageValues.length - 1]]
    setUsageValues(newValues)
    handleChange("dailyUsage", newValues)
    handleChange("planDays", newValues.length)
  }

  const removeUsageDay = (index: number) => {
    if (usageValues.length <= 1) return

    const newValues = usageValues.filter((_, i) => i !== index)
    setUsageValues(newValues)
    handleChange("dailyUsage", newValues)
    handleChange("planDays", newValues.length)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="minLevel" className="text-sm md:text-base">
              {settings.unit === "mm" ? "최소 재고 기준 (mm)" : "최소 재고 기준 (ton)"}
            </Label>
            <div className="flex items-center gap-2 md:gap-4">
              <Slider
                id="minLevel"
                value={[settings.minLevel]}
                min={0}
                max={10000}
                step={1}
                onValueChange={(value) => handleChange("minLevel", value[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={settings.minLevel}
                onChange={(e) => handleChange("minLevel", Number.parseInt(e.target.value) || 0)}
                className="w-16 md:w-20 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maxLevel" className="text-sm md:text-base">
              {settings.unit === "mm" ? "최대 재고 기준 (mm)" : "최대 재고 기준 (ton)"}
            </Label>
            <div className="flex items-center gap-2 md:gap-4">
              <Slider
                id="maxLevel"
                value={[settings.maxLevel]}
                min={0}
                max={10000}
                step={1}
                onValueChange={(value) => handleChange("maxLevel", value[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={settings.maxLevel}
                onChange={(e) => handleChange("maxLevel", Number.parseInt(e.target.value) || 0)}
                className="w-16 md:w-20 text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="currentStock" className="text-sm md:text-base">
              {settings.unit === "mm" ? "06:00 재고량 (mm)" : "06:00 재고량 (ton)"}
            </Label>
            <div className="flex items-center gap-2 md:gap-4">
              <Slider
                id="currentStock"
                value={[settings.currentStock]}
                min={0}
                max={10000}
                step={1}
                onValueChange={(value) => handleChange("currentStock", value[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={settings.currentStock}
                onChange={(e) => handleChange("currentStock", Number.parseInt(e.target.value) || 0)}
                className="w-16 md:w-20 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="deliveryAmount" className="text-sm md:text-base">
              1회 입고량 (ton)
            </Label>
            <div className="flex items-center gap-2 md:gap-4">
              <Slider
                id="deliveryAmount"
                value={[settings.deliveryAmount]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => handleChange("deliveryAmount", value[0])}
                className="flex-1"
              />
              <Input
                type="number"
                value={settings.deliveryAmount}
                onChange={(e) => handleChange("deliveryAmount", Number.parseInt(e.target.value) || 0)}
                className="w-16 md:w-20 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="startDate" className="text-sm md:text-base">
                시작 날짜 (GMT+9 기준)
              </Label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !settings.startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {settings.startDate ? (
                    format(new Date(settings.startDate), "PPP", { locale: ko })
                  ) : (
                    <span>날짜 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={settings.startDate ? new Date(settings.startDate) : undefined}
                  onSelect={(date) => handleDateSelect(date, "startDate")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="endDate" className="text-sm md:text-base">
                종료 날짜 (GMT+9 기준)
              </Label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !settings.endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {settings.endDate ? (
                    format(new Date(settings.endDate), "PPP", { locale: ko })
                  ) : (
                    <span>날짜 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={settings.endDate ? new Date(settings.endDate) : undefined}
                  onSelect={(date) => handleDateSelect(date, "endDate")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
              <Label className="text-sm md:text-base">
                {settings.unit === "mm" ? "하루 사용량 (mm/day)" : "하루 사용량 (ton)"}
              </Label>
              <Button variant="outline" size="sm" onClick={toggleUsageMode} className="text-xs">
                {usageMode === "single" ? "일별 설정" : "단일값 설정"}
              </Button>
            </div>

            {usageMode === "single" ? (
              <div className="flex items-center gap-2 md:gap-4">
                <Slider
                  value={[Array.isArray(settings.dailyUsage) ? settings.dailyUsage[0] : settings.dailyUsage]}
                  min={0}
                  max={3000}
                  step={0.5}
                  onValueChange={(value) => {
                    handleChange("dailyUsage", value[0])
                    setUsageValues([value[0]])
                  }}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={Array.isArray(settings.dailyUsage) ? settings.dailyUsage[0] : settings.dailyUsage}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value) || 0
                    handleChange("dailyUsage", value)
                    setUsageValues([value])
                  }}
                  className="w-16 md:w-20 text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {usageValues.map((value, index) => {
                  // 시작일로부터 index일 후의 날짜 계산
                  const currentDate = new Date(
                    new Date(settings.startDate).setDate(new Date(settings.startDate).getDate() + index),
                  )
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-24 md:w-28 text-xs md:text-sm">
                        {format(currentDate, "MM/dd", { locale: ko })}
                        <span className="ml-1 text-blue-600">(D+{index})</span>
                      </div>
                      <Slider
                        value={[value]}
                        min={0}
                        max={3000}
                        step={0.5}
                        onValueChange={(val) => updateUsageValue(index, val[0])}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateUsageValue(index, Number.parseFloat(e.target.value) || 0)}
                        className="w-12 md:w-16 text-xs"
                      />
                    </div>
                  )
                })}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // 종료일을 하루 늘림
                      const newEndDate = new Date(
                        new Date(settings.endDate).setDate(new Date(settings.endDate).getDate() + 1),
                      )
                      handleDateSelect(newEndDate, "endDate")
                    }}
                    className="w-full text-xs"
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4 mr-2" /> 종료일 하루 늘리기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // 종료일을 하루 줄임
                      const newEndDate = new Date(
                        new Date(settings.endDate).setDate(new Date(settings.endDate).getDate() - 1),
                      )
                      handleDateSelect(newEndDate, "endDate")
                    }}
                    disabled={new Date(settings.endDate) <= new Date(settings.startDate)}
                    className="w-full text-xs"
                  >
                    <Trash className="h-3 w-3 md:h-4 md:w-4 mr-2" /> 종료일 하루 줄이기
                  </Button>
                </div>
              </div>
            )}
          </div>

          {usageMode === "single" && (
            <div>
              <Label className="text-sm md:text-base">
                계획 기간: {settings.startDate}부터 {settings.endDate}까지 ({settings.planDays}일)
              </Label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
