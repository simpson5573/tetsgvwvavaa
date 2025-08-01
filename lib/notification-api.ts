// 알림톡 API 관련 함수들
export const PRODUCT_TO_CHEMICAL_MAP: Record<string, string> = {
  소석회: "HYDRATED",
  고령토: "KAOLIN",
  유동사: "SAND",
  중탄산나트륨: "SODIUM",
  황산암모늄: "SULFATE",
  요소수: "UREA",
}

export interface NotificationPayload {
  plant: "1" | "2"
  chemical: string
  companies: Array<{
    company: string
    phone_no: string[]
  }>
}

export interface NotificationResponse {
  success: boolean
  message: string
}

export async function sendNotificationRequest(payload: NotificationPayload): Promise<NotificationResponse> {
  try {
    console.log("알림톡 요청 데이터:", JSON.stringify(payload, null, 2))

    const response = await fetch("/api/notification/send_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("API 응답 상태:", response.status)

    const responseText = await response.text()
    console.log("API 원본 응답:", responseText)

    if (!response.ok) {
      console.error("API 오류 응답:", responseText)
      throw new Error(`HTTP error! status: ${response.status} - ${responseText}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError)
      throw new Error(`응답 파싱 실패: ${responseText}`)
    }

    console.log("API 응답 결과:", result)

    if (result.success) {
      return {
        success: true,
        message: result.message || "알림톡이 성공적으로 발송되었습니다.",
      }
    } else {
      return {
        success: false,
        message: result.message || "알림톡 발송에 실패했습니다.",
      }
    }
  } catch (error) {
    console.error("알림톡 요청 중 오류:", error)
    return {
      success: false,
      message: `알림톡 요청 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    }
  }
}
