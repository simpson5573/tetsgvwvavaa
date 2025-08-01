import { supabase } from "./supabase"

export interface NotifyRecipient {
  id?: number
  name: string
  plant: string
  phone: string
  note?: string
  created_at?: string
  updated_at?: string
}

// 알림톡 수신자 목록 조회
export async function getNotifyRecipients(): Promise<NotifyRecipient[]> {
  const { data, error } = await supabase.from("notify_list").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notify recipients:", error)
    throw new Error("알림톡 수신자 목록을 불러오는데 실패했습니다.")
  }

  return data || []
}

// 알림톡 수신자 목록 조회 (별칭)
export const fetchNotifyRecipients = getNotifyRecipients

// 알림톡 수신자 추가
export async function addNotifyRecipient(
  recipient: Omit<NotifyRecipient, "id" | "created_at" | "updated_at">,
): Promise<NotifyRecipient> {
  const { data, error } = await supabase.from("notify_list").insert([recipient]).select().single()

  if (error) {
    console.error("Error adding notify recipient:", error)
    throw new Error("알림톡 수신자 추가에 실패했습니다.")
  }

  return data
}

// 알림톡 수신자 추가 (별칭)
export const createNotifyRecipient = addNotifyRecipient

// 알림톡 수신자 수정
export async function updateNotifyRecipient(
  id: number,
  recipient: Omit<NotifyRecipient, "id" | "created_at" | "updated_at">,
): Promise<NotifyRecipient> {
  const { data, error } = await supabase.from("notify_list").update(recipient).eq("id", id).select().single()

  if (error) {
    console.error("Error updating notify recipient:", error)
    throw new Error("알림톡 수신자 수정에 실패했습니다.")
  }

  return data
}

// 알림톡 수신자 수정 (별칭)
export const editNotifyRecipient = updateNotifyRecipient

// 알림톡 수신자 삭제
export async function deleteNotifyRecipient(id: number): Promise<void> {
  const { error } = await supabase.from("notify_list").delete().eq("id", id)

  if (error) {
    console.error("Error deleting notify recipient:", error)
    throw new Error("알림톡 수신자 삭제에 실패했습니다.")
  }
}

// 알림톡 수신자 삭제 (별칭)
export const removeNotifyRecipient = deleteNotifyRecipient
