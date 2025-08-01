"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, User, Lock, Phone } from "lucide-react"
import apiClient from "@/lib/axios"
import type { ChangePasswordRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ChangePasswordFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialUserid?: string
  initialPassword?: string
}

export function ChangePasswordForm({
  isOpen,
  onClose,
  onSuccess,
  initialUserid,
  initialPassword,
}: ChangePasswordFormProps) {
  const [formData, setFormData] = useState<ChangePasswordRequest>({
    userid: "",
    name: "",
    phone_number: "",
    old_password: "",
    new_password: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // 초기 사번과 비밀번호 설정
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        userid: initialUserid || "",
        old_password: initialPassword || "",
      }))
    }
  }, [initialUserid, initialPassword, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
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

    console.log("🔄 [CHANGE PASSWORD] 비밀번호 변경 시도 시작")

    try {
      // API 호출: POST /users/initial-password
      await apiClient.post("/users/initial-password", formData)

      console.log("✅ [CHANGE PASSWORD] 비밀번호 변경 성공")

      // onSuccess 콜백이 있으면 호출, 없으면 기존 로직 실행
      if (onSuccess) {
        onSuccess()
      } else {
        toast({
          title: "비밀번호 변경 완료",
          description: "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.",
        })

        // 토큰 제거 후 로그인 페이지로 이동
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

        onClose()
        router.push("/auth/login")
      }
    } catch (error: any) {
      console.error("❌ [CHANGE PASSWORD] 비밀번호 변경 실패", error)

      let errorMessage = "비���번호 변경에 실패했습니다."

      if (error.response?.status === 400) {
        errorMessage = "입력 정보가 올바르지 않습니다. 모든 필드를 정확히 입력해주세요."
      } else if (error.response?.status === 401) {
        errorMessage = "현재 비밀번호가 올바르지 않습니다."
      } else if (error.response?.status === 404) {
        errorMessage = "사용자를 찾을 수 없습니다."
      } else if (error.response?.status === 500) {
        errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      }

      setError(errorMessage)
      toast({
        title: "비밀번호 변경 실패",
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

  const resetForm = () => {
    setFormData({
      userid: initialUserid || "",
      name: "",
      phone_number: "",
      old_password: initialPassword || "",
      new_password: "",
    })
    setConfirmPassword("")
    setError("")
    setShowOldPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
        {/* 머티리얼 디자인 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Lock className="h-8 w-8" />
            </div>
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-white">임시 비밀번호 변경</DialogTitle>
            <p className="text-blue-100 mt-2">보안을 위해 임시 비밀번호를 새로운 비밀번호로 변경해주세요</p>
          </DialogHeader>
        </div>

        {/* 폼 컨텐츠 */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-xl">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* 사번과 이름을 한 줄에 배치 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 사번 입력 */}
              <div className="space-y-2">
                <Label htmlFor="userid" className="text-sm font-medium text-gray-700">
                  사번
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="userid"
                    name="userid"
                    type="text"
                    placeholder="사번을 입력하세요"
                    value={formData.userid}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  이름
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* 전화번호와 현재 임시 비밀번호를 한 줄에 배치 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 전화번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
                  전화번호
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="01012341234"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 현재 임시 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="old_password" className="text-sm font-medium text-gray-700">
                  현재 임시 비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="old_password"
                    name="old_password"
                    type={showOldPassword ? "text" : "password"}
                    placeholder="임시 비밀번호"
                    value={formData.old_password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="pl-10 pr-12 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    disabled={isLoading}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* 새 비밀번호와 확인을 한 줄에 배치 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 새 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-sm font-medium text-gray-700">
                  새 비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    className="pl-10 pr-12 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* 새 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  새 비밀번호 확인
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호 다시 입력"
                    value={confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="pl-10 pr-12 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200 bg-transparent"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    비밀번호 변경
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
