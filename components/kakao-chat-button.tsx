"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

interface KakaoChatButtonProps {
  label?: string
  bioType?: "bio1" | "bio2"
}

export default function KakaoChatButton({ label, bioType }: KakaoChatButtonProps) {
  const handleChatClick = () => {
    let chatUrl = "https://center-pf.kakao.com/_MxmPrn/chats" // 기본값은 Bio #2 URL

    // Bio #1 버튼인 경우 다른 URL 사용
    if (label === "Bio #1" || bioType === "bio1") {
      chatUrl = "https://center-pf.kakao.com/_xixjaJn/chats"
    }

    // 새 창에서 카카오 채팅 URL 열기
    window.open(chatUrl, "_blank")
  }

  return (
    <Button
      onClick={handleChatClick}
      variant="outline"
      size="sm"
      className="flex items-center gap-1 bg-[#FFE812] hover:bg-[#FFE812]/90 border-[#FFE812] text-[#191919] font-medium"
    >
      <Image src="/kakao-talk-icon.svg" alt="KakaoTalk" width={16} height={16} className="w-4 h-4" />
      <span>{label || "채팅 문의"}</span>
    </Button>
  )
}
