import { type NextRequest, NextResponse } from "next/server"

const getNotificationApiUrl = () => {
  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === "prod" ? "prod" : "dev"
  console.log("isProd ", isProd)
  if (isProd) {
    // 운영 환경 URL을 환경변수에서 가져옵니다.
    return "https://dp.gsepsdx.com"
  }
  // 개발 환경에서는 개발용 URL을 사용합니다.
  return "http://127.0.0.1:5000" // 개발환경에서도 https 사용
}

// GET 메서드도 추가하여 라우트가 작동하는지 테스트
export async function GET() {
  console.log("GET 요청이 API 라우트에 도달했습니다")
  return NextResponse.json({
    message: "API 라우트가 정상적으로 작동합니다",
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  console.log("=== POST 요청이 API 라우트에 도달했습니다 ===")
  console.log("요청 URL:", request.url)
  console.log("요청 메서드:", request.method)
  console.log("요청 헤더:", Object.fromEntries(request.headers.entries()))

  try {
    const body = await request.json()
    const { plant, chemical, companies } = body

    // 데이터 검증
    if (!plant) {
      console.log("Plant 정보가 없습니다")
      return NextResponse.json({ success: false, message: "Plant 정보가 필요합니다." }, { status: 400 })
    }

    if (!chemical) {
      console.log("Chemical 정보가 없습니다")
      return NextResponse.json({ success: false, message: "Chemical 정보가 필요합니다." }, { status: 400 })
    }

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      console.log("Companies 데이터가 올바르지 않습니다:", companies)
      return NextResponse.json({ success: false, message: "Companies 데이터가 올바르지 않습니다." }, { status: 400 })
    }

    // 알림톡 API URL 설정
    const API_BASE_URL = getNotificationApiUrl()
    console.log("API BASE URL:", API_BASE_URL)

    const notificationApiUrl = `${API_BASE_URL}/notification/send_request`

    console.log("알림톡 API URL:", notificationApiUrl)
    console.log("발송할 데이터:", JSON.stringify({ plant, chemical, companies }, null, 2))

    // 외부 알림톡 API 호출
    const notificationResponse = await fetch(notificationApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        plant,
        chemical,
        companies,
      }),
    })

    console.log("외부 API 응답 상태:", notificationResponse.status)
    console.log("외부 API 응답 헤더:", Object.fromEntries(notificationResponse.headers.entries()))

    const responseText = await notificationResponse.text()
    console.log("외부 API 원본 응답:", responseText)

    if (!notificationResponse.ok) {
      console.error("외부 API 오류 응답:", responseText)
      return NextResponse.json(
        {
          success: false,
          message: `외부 알림톡 API 오류: ${notificationResponse.status} - ${responseText}`,
        },
        { status: 500 },
      )
    }

    let notificationResult
    try {
      notificationResult = JSON.parse(responseText)
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError)
      console.error("응답 내용:", responseText.substring(0, 500))

      // JSON이 아닌 응답도 성공으로 처리 (일부 API는 단순 텍스트 응답을 보낼 수 있음)
      if (notificationResponse.ok) {
        return NextResponse.json({
          success: true,
          message: "알림톡이 성공적으로 발송되었습니다.",
          data: { response: responseText },
        })
      }

      throw new Error("외부 API에서 올바르지 않은 응답을 받았습니다.")
    }

    console.log("파싱된 외부 API 응답:", notificationResult)

    return NextResponse.json({
      success: true,
      message: "알림톡이 성공적으로 발송되었습니다.",
      data: notificationResult,
    })
  } catch (error) {
    console.error("=== API 라우트에서 오류 발생 ===")
    console.error("오류 상세:", error)
    console.error("오류 스택:", error instanceof Error ? error.stack : "스택 정보 없음")

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "알림톡 발송에 실패했습니다.",
        error: error instanceof Error ? error.toString() : "알 수 없는 오류",
      },
      { status: 500 },
    )
  }
}
