"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X, Factory, Building2, History, Settings, Zap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import KakaoChatButton from "@/components/kakao-chat-button"

const navigation = [
  { name: "Bio #1", href: "/bio1", icon: Factory },
  { name: "Bio #2", href: "/bio2", icon: Zap },
  { name: "업체", href: "/companies", icon: Building2 },
  { name: "이력", href: "/history", icon: History },
  { name: "설정", href: "/settings", icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    // localStorage에서 사용자 이름 가져오기
    const storedUserName = localStorage.getItem("user_name")
    if (storedUserName) {
      setUserName(storedUserName)
    }
  }, [])

  const handleLogout = () => {
    // localStorage 토큰과 사용자 정보 제거
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("userInfo")
    localStorage.removeItem("user_name")
    localStorage.removeItem("company_name")

    // 쿠키 제거 (모든 경로에서)
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    console.log("🔓 [LOGOUT] 로그아웃 완료 - 토큰 및 쿠키 삭제")

    // 로그인 페이지로 리다이렉트
    window.location.href = "/auth/login"
  }

  // 인증 페이지에서는 네비게이션바 숨김
  const isAuthPage = pathname.startsWith("/auth/")

  if (isAuthPage) {
    return null
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between h-16 relative">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="relative">
                <Image
                  src="/new-company-logo.svg"
                  alt="GS EPS"
                  width={80}
                  height={27}
                  className="h-10 md:h-12 w-auto transition-all duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg md:text-xl font-semibold text-gray-900 tracking-tight">Biomass 약품 배차</span>
              </div>
              <span className="text-base font-semibold text-gray-900 sm:hidden">배차 시스템</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center h-full">
            <div className="flex items-center space-x-1 bg-gray-50/50 backdrop-blur-sm rounded-full p-1 border border-gray-200/50">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href)) ||
                  (item.href === "/bio1" &&
                    (pathname === "/bio1" ||
                      pathname.startsWith("/bio1/") ||
                      pathname.startsWith("/sand") ||
                      pathname.startsWith("/kaolin") ||
                      pathname.startsWith("/urea") ||
                      pathname.startsWith("/sulfate") ||
                      pathname.startsWith("/hydrated") ||
                      pathname.startsWith("/sodium"))) ||
                  (item.href === "/bio2" && pathname.startsWith("/bio2"))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap relative",
                      isActive
                        ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60",
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-full"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* 오른쪽 영역 */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <KakaoChatButton label="Bio #1" />
              <KakaoChatButton label="Bio #2" />
            </div>

            <div className="w-px h-4 bg-gray-300"></div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>{userName || "로그아웃"}</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 py-4 bg-white/90 backdrop-blur-md">
            <div className="flex flex-col space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href)) ||
                  (item.href === "/bio1" &&
                    (pathname === "/bio1" ||
                      pathname.startsWith("/bio1/") ||
                      pathname.startsWith("/sand") ||
                      pathname.startsWith("/kaolin") ||
                      pathname.startsWith("/urea") ||
                      pathname.startsWith("/sulfate") ||
                      pathname.startsWith("/hydrated") ||
                      pathname.startsWith("/sodium"))) ||
                  (item.href === "/bio2" && pathname.startsWith("/bio2"))

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-base font-medium rounded-xl mx-2 transition-all duration-200",
                      isActive
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}

              <div className="border-t border-gray-200/50 mt-4 pt-4 mx-2">
                <div className="flex flex-col space-y-2">
                  <KakaoChatButton label="Bio #1" />
                  <KakaoChatButton label="Bio #2" />

                  <div className="border-t border-gray-200/50 mt-2 pt-2"></div>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="flex items-center justify-start px-4 py-3 text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl mx-0 transition-all duration-200 w-full"
                    title="로그아웃"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>{userName || "로그아웃"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
