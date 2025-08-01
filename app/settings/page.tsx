"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Bell, Settings, BookOpen } from "lucide-react"
import NotifySettings from "@/components/notify-settings"
import Link from "next/link"

type SettingsView = "main" | "notify"

export default function SettingsPage() {
  const [currentView, setCurrentView] = useState<SettingsView>("main")
  const { toast } = useToast()

  const renderMainView = () => (
    <div className="space-y-4">
      {/* 사용자 메뉴얼 바로가기 - 첫 번째로 이동 */}
      <Link href="/manual">
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">사용자 메뉴얼</h4>
              <p className="text-sm text-gray-500">시스템 사용법과 도움말을 확인합니다</p>
            </div>
          </div>
          <div className="text-gray-400">›</div>
        </div>
      </Link>

      {/* 알림톡 설정 바로가기 */}
      <div
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setCurrentView("notify")}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">알림톡 설정</h4>
            <p className="text-sm text-gray-500">배차 계획 관련 알림톡 수신자를 관리합니다</p>
          </div>
        </div>
        <div className="text-gray-400">›</div>
      </div>

      {/* 기타 설정 바로가기 */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 cursor-not-allowed">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h4 className="font-medium text-gray-500">기타 설정</h4>
            <p className="text-sm text-gray-400">추가 시스템 설정은 현재 개발 중입니다</p>
          </div>
        </div>
        <div className="text-gray-300">›</div>
      </div>
    </div>
  )

  const renderNotifyView = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
      </div>
      <NotifySettings />
    </div>
  )

  const getViewTitle = () => {
    switch (currentView) {
      case "notify":
        return "알림톡 설정"
      default:
        return "시스템 설정"
    }
  }

  return (
    <div className="container py-6 space-y-6">
      <Card className="w-full shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">{getViewTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentView === "main" && renderMainView()}
          {currentView === "notify" && renderNotifyView()}
        </CardContent>
      </Card>
    </div>
  )
}
