// 사용자 정보 타입
export interface User {
  id: string
  username: string
  email?: string
  name?: string
  role?: string
}

// 로그인 응답 타입 (DataTokenPostResponse)
export interface LoginResponse {
  id: string
  is_temporary_password: boolean
  name: string
  access_token: string
  refresh_token: string
  company_id: string
  company_name: string
  plant: string
}

// 로그인 요청 타입 (SigninPostRequest)
export interface LoginRequest {
  userid: string
  password: string
}

// 비밀번호 변경 요청 타입 (ChangePasswordPostRequest)
export interface ChangePasswordRequest {
  userid: string
  name: string
  phone_number: string
  old_password: string
  new_password: string
}

// 비밀번호 초기화 코드 요청 타입 (ForgotPasswordPostRequest)
export interface ForgotPasswordRequest {
  userid: string
  member_type: "eps_member" | "external_member"
}

// 비밀번호 초기화 요청 타입 (InitiatePasswordPostRequest)
export interface ResetPasswordRequest {
  userid: string
  confirmation_code: string
  new_password: string
  member_type: "eps_member" | "external_member"
}

// API 응답 기본 타입
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// 회사 정보 타입
export interface Company {
  id: number
  name: string
  plant: string
}

// 배차 계획 타입
export interface DispatchPlan {
  id: number
  date: string
  company_id: number
  company_name: string
  chemical_type: string
  quantity: number
  status: "draft" | "confirmed" | "sent" | "completed"
  created_at: string
  updated_at: string
}

// 재고 정보 타입
export interface Stock {
  id: number
  chemical_type: string
  current_stock: number
  minimum_stock: number
  maximum_stock: number
  unit: string
  last_updated: string
}

// 알림 설정 타입
export interface NotificationSettings {
  id: number
  user_id: number
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  low_stock_alert: boolean
  dispatch_alert: boolean
}

// 사용자 정보 타입 (UserModelResponse)
export interface UserInfo {
  id: string
  name: string
  team: string
  role: string
  phone: string
  email: string
  member_type: "eps_member" | "external_member"
  chemical: string
  scope: string
  plant_unit: string
}

// 기존 타입들 (호환성 유지)
export interface SignInResponse extends LoginResponse {}
