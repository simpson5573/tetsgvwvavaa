"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DeliveryQuantityEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  currentValue: number
  onSave: (newValue: number) => void
  unit?: string
}

export function DeliveryQuantityEditDialog({
  open,
  onOpenChange,
  title = "입고량 수정",
  currentValue,
  onSave,
  unit = "ton",
}: DeliveryQuantityEditDialogProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setValue(currentValue.toString())
      setError("")
    }
  }, [open, currentValue])

  const handleSave = () => {
    const numValue = Number.parseFloat(value)

    if (isNaN(numValue)) {
      setError("올바른 숫자를 입력해주세요.")
      return
    }

    if (numValue < 1) {
      setError("입고량은 1 이상이어야 합니다.")
      return
    }

    if (numValue > 100) {
      setError("입고량이 너무 큽니다. (최대 100)")
      return
    }

    onSave(numValue)
    onOpenChange(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">입고량 ({unit})</Label>
            <Input
              id="quantity"
              type="number"
              step="0.1"
              min="1"
              max="100"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError("")
              }}
              onKeyPress={handleKeyPress}
              placeholder="입고량을 입력하세요"
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="text-sm text-gray-500">
            <p>• 입고량은 1 이상 입력 가능합니다.</p>
            <p>• 입고량 변경 시 재고가 자동으로 재계산됩니다.</p>
            <p className="text-red-500">• 입고대수가 2대 이상인 경우 1대 입고량을 입력해주세요</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeliveryQuantityEditDialog
