"use client"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface SubNavigationItem {
  title: string
  href: string
}

// navigationItems 배열의 title 값을 수정합니다.
const navigationItems: SubNavigationItem[] = [
  {
    title: "Bio #1",
    href: "/history?plant=bio1",
  },
  {
    title: "Bio #2",
    href: "/history?plant=bio2",
  },
]

export default function HistorySubNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPlant = searchParams.get("plant") || "bio1"

  // Only show on history pages
  if (!pathname.startsWith("/history")) {
    return null
  }

  // 이력 서브 네비게이션에 여백을 추가합니다.

  return (
    <div className="bg-gray-50 border-b">
      <div className="container py-2 px-4">
        <nav className="flex items-center justify-center space-x-1">
          {navigationItems.map((item) => {
            const isActive = item.href.includes(`plant=${currentPlant}`)
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md inline-flex items-center",
                  isActive
                    ? "bg-blue-100 text-blue-700 font-bold"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
