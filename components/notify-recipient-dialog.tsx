"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatPhoneNumberInput } from "@/lib/phone-formatter"
import type { NotifyRecipient } from "@/lib/notify-actions"

interface NotifyRecipientDialogProps {
  recipient?: NotifyRecipient
  onSave: (recipient: Omit<NotifyRecipient, "id" | "created_at" | "updated_at">) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PLANT_OPTIONS = [
  { value: "all", label: "일근(Bio1-2호기)" },
  { value: "bio1", label: "Bio #1" },
  { value: "bio2", label: "Bio #2" },
]

export function NotifyRecipientDialog({
  recipient,
  onSave,
  onDelete,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: NotifyRecipientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    plant: "",
    phone: "",
    note: "",
  })
  const { toast } = useToast()

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  useEffect(() => {
    if (recipient && open) {
      setFormData({
        name: recipient.name,
        plant: recipient.plant,
        phone: recipient.phone,
        note: recipient.note || "",
      })
    } else if (!recipient && open) {
      setFormData({
        name: "",
        plant: "",
        phone: "",
        note: "",
      })
    }
  }, [recipient, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.plant.trim() || !formData.phone.trim()) {
      toast({
        title: "입력 오류",
        description: "이름, 소속, 전화번호는 필수 입력 항목입니다.",
        variant: "destructive",
      })
      return
    }

    try {
      await onSave(formData)
      onOpenChange(false)
      toast({
        title: recipient ? "수정 완료" : "추가 완료",
        description: `알림톡 수신자가 ${recipient ? "수정" : "추가"}되었습니다.`,
      })
    } catch (error) {
      toast({
        title: recipient ? "수정 실패" : "추가 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recipient?.id || !onDelete) return

    try {
      await onDelete(recipient.id)
      setShowDeleteConfirm(false)
      onOpenChange(false)
      toast({
        title: "삭제 완료",
        description: "알림톡 수신자가 삭제되었습니다.",
      })
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumberInput(e.target.value)
    setFormData((prev) => ({ ...prev, phone: formatted }))
  }

  return (
    <>
      {trigger && <div onClick={() => onOpenChange(true)}>{trigger}</div>}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{recipient ? "알림톡 수신자 수정" : "알림톡 수신자 추가"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="plant">소속 *</Label>
              <Select
                value={formData.plant}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, plant: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="소속을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {PLANT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="전화번호를 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="note">비고</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="비고사항을 입력하세요 (선택사항)"
                rows={3}
              />
            </div>
            <div className="flex justify-between">
              <div>
                {/* 편집 모드일 때만 삭제 버튼 표시 */}
                {recipient && onDelete && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleDeleteClick}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  취소
                </Button>
                <Button type="submit">{recipient ? "수정" : "추가"}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>수신자 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              <strong>{recipient?.name}</strong> 님을 알림톡 수신자 목록에서 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDeleteCancel}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NotifyRecipientDialog
