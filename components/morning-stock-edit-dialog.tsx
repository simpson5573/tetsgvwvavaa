"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronUp, ChevronDown, X } from "lucide-react"

interface MorningStockEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: DeliveryPlan | null
  onSave: (updatedPlan: DeliveryPlan) => void
}

interface DeliveryPlan {
  id: string
  date: string
  time: string
  quantity: number
  company: string
  status: "confirmed" | "sent" | "cancel_requested"
  morningStock?: number
}

export function MorningStockEditDialog({ open, onOpenChange, plan, onSave }: MorningStockEditDialogProps) {
  const [stockValue, setStockValue] = useState("")

  useEffect(() => {
    if (open && plan?.morningStock !== undefined) {
      setStockValue(plan.morningStock.toFixed(1))
    }
  }, [open, plan])

  if (!plan) return null

  const handleSave = () => {
    const newValue = Number.parseFloat(stockValue)
    if (!isNaN(newValue) && newValue >= 0) {
      const updatedPlan = { ...plan, morningStock: newValue }
      onSave(updatedPlan)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (plan?.morningStock !== undefined) {
      setStockValue(plan.morningStock.toFixed(1))
    }
    onOpenChange(false)
  }

  const incrementStock = () => {
    const current = Number.parseFloat(stockValue) || 0
    setStockValue((current + 0.1).toFixed(1))
  }

  const decrementStock = () => {
    const current = Number.parseFloat(stockValue) || 0
    const newValue = Math.max(0, current - 0.1)
    setStockValue(newValue.toFixed(1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>아침 재고(06:00) 수정</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="h-6 w-6 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="stock-amount">재고량 (ton)</Label>
            <div className="relative">
              <Input
                id="stock-amount"
                type="number"
                step="0.1"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-12 text-center text-lg font-medium"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                <Button variant="ghost" size="icon" onClick={incrementStock} className="h-5 w-5 p-0 hover:bg-gray-100">
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={decrementStock} className="h-5 w-5 p-0 hover:bg-gray-100">
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleSave} className="bg-gray-800 hover:bg-gray-900 text-white">
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MorningStockEditDialog
