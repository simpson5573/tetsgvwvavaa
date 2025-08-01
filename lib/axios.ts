import axios from "axios"

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: "https://dp.gsepsdx.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 [API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    console.log(`📤 [API REQUEST] 요청 데이터:`, config.data)

    // 토큰이 있으면 헤더에 추가
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`🔑 [API REQUEST] 토큰 추가됨`)
    }

    return config
  },
  (error) => {
    console.error(`❌ [API REQUEST ERROR]`, error)
    return Promise.reject(error)
  },
)

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API RESPONSE] ${response.status} ${response.statusText}`)
    console.log(`📥 [API RESPONSE] 응답 데이터:`, response.data)
    return response
  },
  (error) => {
    console.error(`❌ [API RESPONSE ERROR]`, error.message, " at (/lib/axios)")

    if (error.response) {
      console.error(`📊 [API ERROR] 상태:`, error.response.status)
      console.error(`📊 [API ERROR] 데이터:`, error.response.data)

      // 401 에러 시 토큰 제거 및 로그인 페이지로 리디렉션
      if (error.response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        window.location.href = "/auth/login"
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
