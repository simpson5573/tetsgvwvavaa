"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X, PlusCircle } from "lucide-react"

interface TimeSlot {
  time: string
  cancelled: boolean
}

interface TimeEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTimes: string[] // 단일 시간에서 배열로 변경
  deliveryCount: number // 입고대수 추가
  currentNote: string
  onSave: (newTimes: string[], note: string, newDeliveryCount: number) => void // 새로운 입고대수 추가
}

// 30분 단위 시간 옵션 생성 (00:00 ~ 24:00)
const generateTimeOptions = () => {
  const options: string[] = []
  for (let hour = 0; hour <= 24; hour++) {
    if (hour === 24) {
      // 24:00만 추가
      options.push("24:00")
    } else {
      // 00:00 ~ 23:30까지 30분 단위로 추가
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        options.push(timeStr)
      }
    }
  }
  return options
}

function TimeEditDialog({ open, onOpenChange, currentTimes, deliveryCount, currentNote, onSave }: TimeEditDialogProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [note, setNote] = useState(currentNote || "")

  const timeOptions = generateTimeOptions()

  // 다이얼로그가 열릴 때 기존 값으로 초기화
  useEffect(() => {
    if (open) {
      // 현재 시간들을 TimeSlot 배열로 변환
      const slots: TimeSlot[] = []
      for (let i = 0; i < deliveryCount; i++) {
        slots.push({
          time: currentTimes[i] || "08:00",
          cancelled: false,
        })
      }
      setTimeSlots(slots)
      setNote(currentNote || "")
    }
  }, [open, currentTimes, currentNote, deliveryCount])

  const handleSave = () => {
    const trimmedNote = (note || "").trim()
    if (!trimmedNote) {
      alert("변경 사유를 입력해주세요.")
      return
    }

    // 취소되지 않은 유효한 시간만 필터링
    const validTimes = timeSlots.filter((slot) => !slot.cancelled).map((slot) => slot.time)

    if (validTimes.length === 0) {
      alert("해당 날짜의 배차 취소를 원하는 경우 '관리' 열에 있는 취소 버튼을 통해 취소 요청을 해주세요!")
      return
    }

    // 새로운 입고대수도 함께 전달
    onSave(validTimes, trimmedNote, validTimes.length)
    onOpenChange(false)
  }

  const handleTimeChange = (index: number, newTime: string) => {
    const updatedSlots = [...timeSlots]
    updatedSlots[index].time = newTime
    setTimeSlots(updatedSlots)
  }

  const handleCancelTime = (index: number) => {
    const updatedSlots = [...timeSlots]
    updatedSlots[index].cancelled = !updatedSlots[index].cancelled
    setTimeSlots(updatedSlots)
  }

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { time: "08:00", cancelled: false }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        {/* 헤더 */}
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">입고시간 수정</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">입고시간을 수정하고 변경 사유를 입력해주세요.</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* 컨텐츠 */}
        <div className="px-6 pb-6 space-y-6">
          {/* 입고시간 선택 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">입고시간</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTimeSlot}
                className="text-xs px-2 py-1 h-7 flex items-center gap-1 bg-transparent"
              >
                <PlusCircle className="h-3 w-3" />
                회차 추가
              </Button>
            </div>
            {timeSlots.map((slot, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600">{index + 1}회차</Label>
                  <Button
                    type="button"
                    variant={slot.cancelled ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCancelTime(index)}
                    className={`text-xs px-2 py-1 h-6 ${
                      slot.cancelled ? "bg-red-100 text-red-700 border-red-300" : "text-gray-600 hover:text-red-600"
                    }`}
                  >
                    {slot.cancelled ? "복원" : "취소"}
                  </Button>
                </div>
                <Select
                  value={slot.time}
                  onValueChange={(value) => handleTimeChange(index, value)}
                  disabled={slot.cancelled}
                >
                  <SelectTrigger className={`w-full ${slot.cancelled ? "opacity-50 bg-gray-100" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {slot.cancelled && <p className="text-xs text-red-600">이 시간은 취소됩니다</p>}
              </div>
            ))}

            {/* 유효한 입고대수 표시 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>조정된 입고대수:</strong> {timeSlots.filter((slot) => !slot.cancelled).length}회
                {timeSlots.filter((slot) => slot.cancelled).length > 0 && (
                  <span className="text-red-600 ml-2">
                    (취소: {timeSlots.filter((slot) => slot.cancelled).length}회)
                  </span>
                )}
              </p>
              {/* 조정된 입고대수가 0회인 경우 경고 메시지 표시 */}
              {timeSlots.filter((slot) => !slot.cancelled).length === 0 && (
                <p className="text-sm text-red-600 mt-2 font-medium">
                  ⚠️ 해당 날짜의 배차 취소를 원하는 경우 '관리' 열에 있는 취소 버튼을 통해 취소 요청을 해주세요!
                </p>
              )}
            </div>
          </div>

          {/* 변경 사유 입력 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">변경 사유 (입력필수)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="변경 사유를 입력해주세요..."
              className="min-h-[120px] resize-none"
              rows={5}
            />
          </div>

          {/* 수정 버튼 */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-2"
              disabled={!(note || "").trim() || timeSlots.filter((slot) => !slot.cancelled).length === 0}
            >
              수정
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { TimeEditDialog }
export default TimeEditDialog
