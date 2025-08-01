import { supabase } from "./supabase"

export interface EditHistory {
  id: string
  user_name: string
  plant: string
  chemical: string
  date: string
  edit_type:
    | "time_change"
    | "quantity_change"
    | "status_change"
    | "cancel_request"
    | "emergency_cancel"
    | "calibration"
    | "draft_create"
    | "draft_send"
  old_value: any
  new_value: any
  description: string
  created_at: string
}

// 사용자명만 가져오기 (간단한 버전)
export function getCurrentUserName(): string {
  try {
    // 네비게이션바와 동일한 방식으로 localStorage에서 사용자명 가져오기
    const storedUserName = localStorage.getItem("user_name")
    if (storedUserName) {
      return storedUserName
    }

    // 백업으로 다른 방법들도 시도
    const userInfo = localStorage.getItem("user_info")
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      return parsed.name || parsed.username || "알 수 없는 사용자"
    }

    return "알 수 없는 사용자"
  } catch (error) {
    console.error("사용자명 가져오기 오류:", error)
    return "알 수 없는 사용자"
  }
}

// 편집 히스토리 저장
export async function saveEditHistory(
  userName: string, // 이 파라미터는 호환성을 위해 유지하지만 실제로는 getCurrentUserName()을 사용
  plant: string,
  chemical: string,
  date: string,
  editType: EditHistory["edit_type"],
  oldValue: any,
  newValue: any,
  description: string,
): Promise<boolean> {
  try {
    // 전달받은 userName 대신 실제 로그인된 사용자명을 사용
    const actualUserName = getCurrentUserName()

    const historyData = {
      user_name: actualUserName, // 실제 사용자명 사용
      plant: plant,
      chemical: chemical,
      date: date,
      edit_type: editType,
      old_value: oldValue,
      new_value: newValue,
      description: description,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("edit_history").insert([historyData])

    if (error) {
      console.error("편집 히스토리 저장 오류:", error)
      return false
    }

    console.log("편집 히스토리 저장 완료:", description, "사용자:", actualUserName)
    return true
  } catch (error) {
    console.error("편집 히스토리 저장 중 오류:", error)
    return false
  }
}

// 편집 히스토리 조회 (최근 10일간만)
export async function getEditHistory(plant: string, chemical: string): Promise<EditHistory[]> {
  try {
    // 10일 전 날짜 계산
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const { data, error } = await supabase
      .from("edit_history")
      .select("*")
      .eq("plant", plant)
      .eq("chemical", chemical)
      .gte("created_at", tenDaysAgo.toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("편집 히스토리 조회 오류:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("편집 히스토리 조회 중 오류:", error)
    return []
  }
}

// 편집 타입별 한국어 라벨
export const EDIT_TYPE_LABELS: Record<EditHistory["edit_type"], string> = {
  time_change: "입고시간 변경",
  quantity_change: "입고량 변경",
  status_change: "상태 변경",
  cancel_request: "취소 요청",
  emergency_cancel: "긴급 취소",
  calibration: "재고량 캘리브레이션",
  draft_create: "배차계획 작성",
  draft_send: "배차계획 전송",
}
