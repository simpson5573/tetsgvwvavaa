"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bell, Edit, Loader2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import NotifyRecipientDialog from "./notify-recipient-dialog"
import {
  fetchNotifyRecipients,
  createNotifyRecipient,
  editNotifyRecipient,
  removeNotifyRecipient,
} from "@/lib/notify-actions"
import type { NotifyRecipient } from "@/lib/notify-actions"

export default function NotifySettings() {
  const [recipients, setRecipients] = useState<NotifyRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<NotifyRecipient | null>(null)
  const { toast } = useToast()

  const loadRecipients = async () => {
    try {
      const data = await fetchNotifyRecipients()
      setRecipients(data)
    } catch (error) {
      toast({
        title: "데이터 로드 실패",
        description: error instanceof Error ? error.message : "알림톡 수신자 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecipients()
  }, [])

  const handleAdd = async (recipient: Omit<NotifyRecipient, "id" | "created_at" | "updated_at">) => {
    // 즉시 UI에 반영 (optimistic update)
    const tempId = Date.now()
    const newRecipient = {
      ...recipient,
      id: tempId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setRecipients((prev) => [...prev, newRecipient])

    try {
      // 백그라운드에서 DB 저장
      await createNotifyRecipient(recipient)
      // 성공 시 실제 데이터로 교체
      await loadRecipients()
    } catch (error) {
      // 실패 시 롤백
      setRecipients((prev) => prev.filter((r) => r.id !== tempId))
      throw error
    }
  }

  const handleEdit = async (recipient: Omit<NotifyRecipient, "id" | "created_at" | "updated_at">, id: number) => {
    // 즉시 UI에 반영
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...recipient } : r)))

    try {
      // 백그라운드에서 DB 업데이트
      await editNotifyRecipient(id, recipient)
    } catch (error) {
      // 실패 시 원래 데이터로 롤백
      await loadRecipients()
      throw error
    }
  }

  const handleDelete = async (id: number) => {
    // 즉시 UI에서 제거
    const originalRecipients = recipients
    setRecipients((prev) => prev.filter((r) => r.id !== id))

    try {
      // 백그라운드에서 DB 삭제
      await removeNotifyRecipient(id)
    } catch (error) {
      // 실패 시 롤백
      setRecipients(originalRecipients)
      throw error
    }
  }

  const openEditDialog = (recipient: NotifyRecipient) => {
    setEditingRecipient(recipient)
    setEditDialogOpen(true)
  }

  const getPlantLabel = (plant: string) => {
    switch (plant) {
      case "all":
        return "일근(Bio1-2호기)"
      case "bio1":
        return "Bio #1"
      case "bio2":
        return "Bio #2"
      default:
        return plant
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8 border rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h4 className="font-medium text-gray-900">알림톡 수신자 관리</h4>
          <p className="text-sm text-gray-500">
            소속에 해당하는 배차 관련 알림톡의 수신자 리스트입니다.
            <br />
            배차 확정, 완료 등 알림을 수신하고자 하시는 분은 직접 등록 바랍니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            추가
          </Button>
        </div>
      </div>

      {/* 수신자 목록 테이블 */}
      {recipients.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border rounded-lg">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>등록된 알림톡 수신자가 없습니다.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">이름</TableHead>
                <TableHead className="text-center">소속</TableHead>
                <TableHead className="text-center">전화번호</TableHead>
                <TableHead className="text-center">비고</TableHead>
                <TableHead className="text-center">편집</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell className="font-medium text-center">{recipient.name}</TableCell>
                  <TableCell className="text-center">{getPlantLabel(recipient.plant)}</TableCell>
                  <TableCell className="font-mono text-center">{recipient.phone}</TableCell>
                  <TableCell className="text-center">{recipient.note || "-"}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(recipient)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 추가 다이얼로그 */}
      <NotifyRecipientDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSave={handleAdd} />

      {/* 수정 다이얼로그 */}
      <NotifyRecipientDialog
        recipient={editingRecipient || undefined}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingRecipient(null)
        }}
        onSave={(data) => handleEdit(data, editingRecipient!.id!)}
        onDelete={handleDelete}
      />
    </div>
  )
}
