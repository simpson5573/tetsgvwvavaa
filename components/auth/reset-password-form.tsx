"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Link from "next/link"
import apiClient from "@/lib/axios"
import type { ForgotPasswordRequest, ResetPasswordRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function ResetPasswordForm() {
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
      await apiClient.post("/users/confirmation-code", requestData)

      console.log("✅ [RESET PASSWORD] 인증 코드 발송 성공")

      toast({
        title: "인증 코드 발송",
        description: "인증 코드가 발송되었습니다. 확인 후 입력해주세요.",
      })

      setStep("reset")
    } catch (error: any) {
      console.error("❌ [RESET PASSWORD] 인증 코드 요청 실패", error)

      let errorMessage = "인증 코드 요청에 실패했습니다."

      if (error.response?.status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다."
      } else if (error.response?.status === 400) {
        errorMessage = "입력 정보가 올바르지 않습니다."
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
      await apiClient.post("/users/password", resetData)

      console.log("✅ [RESET PASSWORD] 비밀번호 초기화 성공")

      toast({
        title: "비밀번호 초기화 완료",
        description: "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.",
      })

      router.push("/auth/login")
    } catch (error: any) {
      console.error("❌ [RESET PASSWORD] 비밀번호 초기화 실패", error)

      let errorMessage = "비밀번호 초기화에 실패했습니다."

      if (error.response?.status === 400) {
        errorMessage = "인증 코드가 올바르지 않거나 만료되었습니다."
      } else if (error.response?.status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다."
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

  const handleMemberTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, member_type: value as "eps_member" | "external_member" }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          {step === "request" ? "인증 코드 요청" : "비밀번호 초기화"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === "request" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="userid">사용자 ID</Label>
              <Input
                id="userid"
                name="userid"
                type="text"
                placeholder="사용자 ID를 입력하세요"
                value={formData.userid}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <Label>회원 유형</Label>
              <RadioGroup value={formData.member_type} onValueChange={handleMemberTypeChange} disabled={isLoading}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="eps_member" id="eps_member" />
                  <Label htmlFor="eps_member">EPS 직원</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="external_member" id="external_member" />
                  <Label htmlFor="external_member">외부 사용자</Label>
                </div>
              </RadioGroup>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                "인증 코드 요청"
              )}
            </Button>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-500 hover:underline">
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmation_code">인증 코드</Label>
              <Input
                id="confirmation_code"
                name="confirmation_code"
                type="text"
                placeholder="받으신 인증 코드를 입력하세요"
                value={formData.confirmation_code}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">새 비밀번호</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  name="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="새 비밀번호 (8자 이상, 영어 소문자, 특수문자, 숫자 포함)"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setStep("request")}
                disabled={isLoading}
              >
                이전
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
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
      </CardContent>
    </Card>
  )
}
