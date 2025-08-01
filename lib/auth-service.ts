import { supabase } from "./supabase"

// 현재 로그인된 사용자 정보 가져오기
export async function getCurrentUser(): Promise<{ name: string; id: string } | null> {
  try {
    // 세션에서 사용자 정보 가져오기 (실제 구현에 따라 수정 필요)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      // 로컬 스토리지나 다른 방법으로 사용자 정보 가져오기
      const userInfo = localStorage.getItem("user_info")
      if (userInfo) {
        const parsed = JSON.parse(userInfo)
        return {
          name: parsed.name || parsed.username || "알 수 없음",
          id: parsed.id || "unknown",
        }
      }
      return null
    }

    return {
      name: session.user.user_metadata?.name || session.user.email || "알 수 없음",
      id: session.user.id,
    }
  } catch (error) {
    console.error("사용자 정보 가져오기 오류:", error)
    return null
  }
}

// 사용자명만 가져오기 (간단한 버전)
export function getCurrentUserName(): string {
  try {
    // 실제 로그인 시스템에 맞게 수정 필요
    const userInfo = localStorage.getItem("user_info")
    if (userInfo) {
      const parsed = JSON.parse(userInfo)
      return parsed.name || parsed.username || "알 수 없음"
    }

    // 또는 다른 방법으로 사용자명 가져오기
    return "시스템 사용자"
  } catch (error) {
    console.error("사용자명 가져오기 오류:", error)
    return "알 수 없음"
  }
}
