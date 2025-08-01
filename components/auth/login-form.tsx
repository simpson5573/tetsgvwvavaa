"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, ArrowLeft } from "lucide-react"
import Image from "next/image"
import apiClient from "@/lib/axios"
import type { LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ChangePasswordForm } from "@/components/auth/change-password-form"

export function LoginForm() {
  const [formData, setFormData] = useState<LoginRequest>({
    userid: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // 비밀번호 찾기 모달 상태
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  // 초기 비밀번호 변경 모달 상태 추가
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("🔐 [LOGIN] 로그인 시도 시작", { userid: formData.userid })

    try {
      // 실제 API 호출: POST /users/authentication
      const response = await apiClient.post<LoginResponse>("/users/authentication", formData)

      console.log("✅ [LOGIN] 로그인 성공", response.data)

      const { access_token, refresh_token, is_temporary_password, name, company_name } = response.data

      // 토큰을 localStorage와 쿠키에 저장
      localStorage.setItem("access_token", access_token)
      localStorage.setItem("refresh_token", refresh_token)
      localStorage.setItem("user_name", name)
      localStorage.setItem("company_name", company_name)

      // 쿠키에도 저장 (SSR 호환성)
      document.cookie = `access_token=${access_token}; path=/; max-age=86400`
      document.cookie = `refresh_token=${refresh_token}; path=/; max-age=604800`

      toast({
        title: "로그인 성공",
        description: `${name}님, 환영합니다!`,
      })

      // 임시 비밀번호인 경우 비밀번호 변경 페이지로 이동
      if (is_temporary_password) {
        console.log("🔄 [LOGIN] 임시 비밀번호 → 비밀번호 변경 모달 표시")
        setChangePasswordOpen(true)
      } else {
        console.log("🏠 [LOGIN] 메인 페이지로 이동")
        router.push("/")
      }
    } catch (error: any) {
      console.error("❌ [LOGIN] 로그인 실패", error.message, "at handleSubmit (/components/auth/login-form)")

      let errorMessage = "로그인에 실패했습니다."

      if (error.response?.status === 401) {
        errorMessage = "아이디 또는 비밀번호가 올바르지 않습니다."
      } else if (error.response?.status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다."
      } else if (error.response?.status >= 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      } else if (error.code === "NETWORK_ERROR") {
        errorMessage = "네트워크 연결을 확인해주세요."
      }

      setError(errorMessage)
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const handleChangePasswordSuccess = () => {
    setChangePasswordOpen(false)
    toast({
      title: "비밀번호 변경 완료",
      description: "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.",
    })

    // 토큰 제거
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_name")
    localStorage.removeItem("company_name")
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // 폼 초기화
    setFormData({ userid: "", password: "" })
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 일러스트레이션 영역 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 items-center justify-center opacity-100">
        <div className="flex items-center justify-center h-3/5 w-3/5">
          <Image
            src="/auth/left-illustration.png"
            alt="GS EPS 발전소 일러스트레이션"
            width={600}
            height={700}
            className="w-full h-full object-contain max-w-none"
            priority
          />
        </div>
      </div>

      {/* 오른쪽 로그인 폼 영역 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* 로고와 제목 */}
          <div className="space-y-6">
            {/* GS EPS 로고 - 왼쪽 정렬, 크기 증가 */}
            <div className="flex justify-start">
              <Image src="/auth/gseps-logo.svg" alt="GS EPS" width={180} height={60} className="h-14 w-auto" />
            </div>

            {/* 제목 - 왼쪽 정렬 */}
            <h1 className="text-2xl font-bold text-gray-900 text-left">Biomass 약품 배차 시스템</h1>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Input
                  id="userid"
                  name="userid"
                  type="text"
                  placeholder="사번"
                  value={formData.userid}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>

            {/* 자동로그인과 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  자동로그인
                </Label>
              </div>

              <button
                type="button"
                onClick={() => setResetPasswordOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
              >
                비밀번호 찾기
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 비밀번호 찾기 모달 */}
      <ResetPasswordModal open={resetPasswordOpen} onOpenChange={setResetPasswordOpen} />

      {/* 초기 비밀번호 변경 모달 */}
      <ChangePasswordForm
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onSuccess={handleChangePasswordSuccess}
        initialUserid={formData.userid}
        initialPassword={formData.password}
      />
    </div>
  )
}

// 비밀번호 찾기 모달 컴포넌트 - 머티리얼 디자인
function ResetPasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = useState<"request" | "reset">("request")
  const [formData, setFormData] = useState({
    userid: "",
    member_type: "eps_member" as "eps_member" | "external_member",
    confirmation_code: "",
    new_password: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("📧 [RESET PASSWORD] 인증 코드 요청 시작")

    try {
      const requestData: ForgotPasswordRequest = {
        userid: formData.userid,
        member_type: formData.member_type,
      }

      // API 호출: POST /users/confirmation-code
      const response = await apiClient.post("/users/confirmation-code", requestData)

      console.log("✅ [RESET PASSWORD] 인증 코드 발송 성공")

      // 응답 본문 확인
      const responseText = typeof response.data === "string" ? response.data : JSON.stringify(response.data)

      // 에러 메시지가 포함되어 있는지 확인
      if (
        responseText.toLowerCase().includes("error") ||
        responseText.toLowerCase().includes("invalid") ||
        responseText.toLowerCase().includes("failed")
      ) {
        throw new Error(responseText)
      }

      toast({
        title: "인증 코드 발송",
        description: "인증 코드가 발송되었습니다. 이메일 또는 SMS를 확인해주세요.",
      })

      setStep("reset")
    } catch (error: any) {
      console.error("❌ [RESET PASSWORD] 인증 코드 요청 실패", error)

      let errorMessage = "인증 코드 요청에 실패했습니다."

      if (error.response?.status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다."
      } else if (error.response?.status === 400) {
        errorMessage = "입력 정보가 올바르지 않습니다."
      } else if (error.message && error.message !== "Request failed with status code 200") {
        errorMessage = error.message
      }

      setError(errorMessage)
      toast({
        title: "인증 코드 요청 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // 비밀번호 확인
    if (formData.new_password !== confirmPassword) {
      setError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    // 비밀번호 강도 검증
    if (formData.new_password.length < 8) {
      setError("새 비밀번호는 8자 이상, 영어 소문자, 특수문자, 숫자를 포함해야 합니다.")
      setIsLoading(false)
      return
    }

    console.log("🔄 [RESET PASSWORD] 비밀번호 초기화 시도 시작")

    try {
      const resetData: ResetPasswordRequest = {
        userid: formData.userid,
        confirmation_code: formData.confirmation_code,
        new_password: formData.new_password,
        member_type: formData.member_type,
      }

      // API 호출: POST /users/password
      const response = await apiClient.post("/users/password", resetData)

      console.log("🔍 [RESET PASSWORD] API 응답 확인:", response.data)

      // 응답 본문 확인 - 문자열 또는 객체 모두 처리
      const responseText = typeof response.data === "string" ? response.data : JSON.stringify(response.data)

      // 에러 메시지가 포함되어 있는지 확인
      if (
        responseText.toLowerCase().includes("invalid verification code") ||
        responseText.toLowerCase().includes("invalid code") ||
        responseText.toLowerCase().includes("verification code") ||
        responseText.toLowerCase().includes("error") ||
        responseText.toLowerCase().includes("failed")
      ) {
        console.log("❌ [RESET PASSWORD] 서버에서 에러 응답:", responseText)

        let errorMessage = "비밀번호 초기화에 실패했습니다."

        if (
          responseText.toLowerCase().includes("invalid verification code") ||
          responseText.toLowerCase().includes("invalid code")
        ) {
          errorMessage = "인증 코드가 올바르지 않거나 만료되었습니다."
        }

        throw new Error(errorMessage)
      }

      // 성공 응답 확인 - 성공을 나타내는 키워드가 있는지 확인
      if (
        responseText.toLowerCase().includes("success") ||
        responseText.toLowerCase().includes("updated") ||
        responseText.toLowerCase().includes("changed") ||
        responseText.toLowerCase().includes("reset")
      ) {
        console.log("✅ [RESET PASSWORD] 비밀번호 초기화 성공")

        toast({
          title: "비밀번호 초기화 완료",
          description: "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.",
        })

        // 모달 닫기 및 상태 초기화
        onOpenChange(false)
        setStep("request")
        setFormData({
          userid: "",
          member_type: "eps_member",
          confirmation_code: "",
          new_password: "",
        })
        setConfirmPassword("")
      } else {
        // 성공도 실패도 아닌 애매한 응답인 경우
        console.log("⚠️ [RESET PASSWORD] 애매한 응답:", responseText)
        throw new Error("서버 응답을 확인할 수 없습니다. 관리자에게 문의하세요.")
      }
    } catch (error: any) {
      console.error("❌ [RESET PASSWORD] 비밀번호 초기화 실패", error)

      let errorMessage = "비밀번호 초기화에 실패했습니다."

      if (error.response?.status === 400) {
        errorMessage = "인증 코드가 올바르지 않거나 만료되었습니다."
      } else if (error.response?.status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다."
      } else if (error.message && error.message !== "Request failed with status code 200") {
        errorMessage = error.message
      }

      setError(errorMessage)
      toast({
        title: "비밀번호 초기화 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "confirmPassword") {
      setConfirmPassword(value)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    if (error) setError("")
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep("request")
      setError("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        {/* 머티리얼 디자인 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {step === "request" ? <Mail className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {step === "request" ? "비밀번호 초기화" : "비밀번호 초기화"}
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-sm mt-1">
                {step === "request"
                  ? "사번을 입력하면 이메일로 인증 코드를 발송해드립니다"
                  : "인증 코드와 새 비밀번호를 입력해주세요"}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* 폼 컨텐츠 */}
        <div className="px-8 py-6">
          {step === "request" ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="userid-modal" className="text-sm font-medium text-gray-700 mb-2 block">
                    사번
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="userid-modal"
                      name="userid"
                      type="text"
                      placeholder="사번을 입력하세요"
                      value={formData.userid}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="pl-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      발송 중...
                    </>
                  ) : (
                    <>
                      인증 코드 요청
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <Label htmlFor="confirmation_code_modal" className="text-sm font-medium text-gray-700 mb-2 block">
                    인증 코드
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmation_code_modal"
                      name="confirmation_code"
                      type="text"
                      placeholder="받으신 인증 코드를 입력하세요"
                      value={formData.confirmation_code}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="pl-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Label htmlFor="new_password_modal" className="text-sm font-medium text-gray-700 mb-2 block">
                    새 비밀번호
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="new_password_modal"
                      name="new_password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="새 비밀번호 (8자 이상, 영어 소문자, 특수문자, 숫자 포함)"
                      value={formData.new_password}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      minLength={8}
                      className="pl-10 pr-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Label htmlFor="confirmPassword_modal" className="text-sm font-medium text-gray-700 mb-2 block">
                    새 비밀번호 확인
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword_modal"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      value={confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className="pl-10 pr-10 h-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("request")}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-lg font-medium border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  이전
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      변경 중...
                    </>
                  ) : (
                    "비밀번호 변경"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
