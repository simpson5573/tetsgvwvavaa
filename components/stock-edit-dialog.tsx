"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface StockEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  currentValue: number
  onSave: (newValue: number) => void
}

export default function StockEditDialog({ open, onOpenChange, title, currentValue, onSave }: StockEditDialogProps) {
  const [value, setValue] = useState(currentValue)

  // 다이얼로그가 열릴 때마다 현재 값으로 초기화
  useEffect(() => {
    if (open) {
      setValue(currentValue)
    }
  }, [open, currentValue])

  const handleSave = () => {
    onSave(value)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock-value" className="text-right">
              재고량 (ton)
            </Label>
            <Input
              id="stock-value"
              type="number"
              value={value}
              onChange={(e) => setValue(Number.parseFloat(e.target.value) || 0)}
              step="0.1"
              className="col-span-3"
              autoFocus
            />
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
