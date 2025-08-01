"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SubNavigationProps {
  links: {
    href: string
    label: string
    active?: boolean
  }[]
}

interface SubNavigationItem {
  title: string
  href: string
  children?: SubNavigationItem[]
}

export function SubNavigation() {
  const pathname = usePathname()

  // 네비게이션 항목 업데이트 - Bio #1과 Bio #2 모두 포함 (새로운 동적 라우팅 구조)
  const navigationItems: SubNavigationItem[] = [
    {
      title: "Bio #1",
      href: "/bio1",
      children: [
        {
          title: "유동사",
          href: "/bio1/sand",
          children: [
            { title: "Draft", href: "/bio1/sand/draft" },
            { title: "Final", href: "/bio1/sand/final" },
          ],
        },
        {
          title: "고령토",
          href: "/bio1/kaolin",
          children: [
            { title: "Draft", href: "/bio1/kaolin/draft" },
            { title: "Final", href: "/bio1/kaolin/final" },
          ],
        },
        {
          title: "요소수",
          href: "/bio1/urea",
          children: [
            { title: "Draft", href: "/bio1/urea/draft" },
            { title: "Final", href: "/bio1/urea/final" },
          ],
        },
        {
          title: "황산암모늄",
          href: "/bio1/sulfate",
          children: [
            { title: "Draft", href: "/bio1/sulfate/draft" },
            { title: "Final", href: "/bio1/sulfate/final" },
          ],
        },
        {
          title: "소석회",
          href: "/bio1/hydrated",
          children: [
            { title: "Draft", href: "/bio1/hydrated/draft" },
            { title: "Final", href: "/bio1/hydrated/final" },
          ],
        },
        {
          title: "중탄산나트륨",
          href: "/bio1/sodium",
          children: [
            { title: "Draft", href: "/bio1/sodium/draft" },
            { title: "Final", href: "/bio1/sodium/final" },
          ],
        },
      ],
    },
    {
      title: "Bio #2",
      href: "/bio2",
      children: [
        {
          title: "유동사",
          href: "/bio2/sand",
          children: [
            { title: "Draft", href: "/bio2/sand/draft" },
            { title: "Final", href: "/bio2/sand/final" },
          ],
        },
        {
          title: "고령토",
          href: "/bio2/kaolin",
          children: [
            { title: "Draft", href: "/bio2/kaolin/draft" },
            { title: "Final", href: "/bio2/kaolin/final" },
          ],
        },
        {
          title: "요소수",
          href: "/bio2/urea",
          children: [
            { title: "Draft", href: "/bio2/urea/draft" },
            { title: "Final", href: "/bio2/urea/final" },
          ],
        },
        {
          title: "황산암모늄",
          href: "/bio2/sulfate",
          children: [
            { title: "Draft", href: "/bio2/sulfate/draft" },
            { title: "Final", href: "/bio2/sulfate/final" },
          ],
        },
        {
          title: "소석회",
          href: "/bio2/hydrated",
          children: [
            { title: "Draft", href: "/bio2/hydrated/draft" },
            { title: "Final", href: "/bio2/hydrated/final" },
          ],
        },
        {
          title: "중탄산나트륨",
          href: "/bio2/sodium",
          children: [
            { title: "Draft", href: "/bio2/sodium/draft" },
            { title: "Final", href: "/bio2/sodium/final" },
          ],
        },
      ],
    },
  ]

  // Bio #1과 Bio #2 페이지에서 서브 네비게이션 표시 (새로운 동적 라우팅 포함)
  const bio1PathPrefixes = ["/bio1", "/sand", "/kaolin", "/urea", "/sulfate", "/hydrated", "/sodium"]
  const bio2PathPrefixes = ["/bio2"]

  const shouldShowNavigation =
    bio1PathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    bio2PathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  // 현재 활성화된 Bio 시스템 찾기
  const getActiveBio = () => {
    if (pathname.startsWith("/bio2")) return "Bio #2"
    return "Bio #1"
  }

  // 현재 활성화된 품명 찾기 (새로운 동적 라우팅 구조 반영)
  const getActiveProduct = () => {
    if (pathname === "/bio1" || pathname === "/bio2") return null // Bio 요약 페이지에서는 품명 활성화 안함

    // 기존 라우팅 (하위 호환성)
    if (pathname === "/sand" || pathname.startsWith("/sand/")) return "유동사"
    if (pathname.startsWith("/kaolin")) return "고령토"
    if (pathname.startsWith("/urea")) return "요소수"
    if (pathname.startsWith("/sulfate")) return "황산암모늄"
    if (pathname.startsWith("/hydrated")) return "소석회"
    if (pathname.startsWith("/sodium")) return "중탄산나트륨"

    // 새로운 동적 라우팅
    if (pathname.startsWith("/bio1/sand") || pathname.startsWith("/bio2/sand")) return "유동사"
    if (pathname.startsWith("/bio1/kaolin") || pathname.startsWith("/bio2/kaolin")) return "고령토"
    if (pathname.startsWith("/bio1/urea") || pathname.startsWith("/bio2/urea")) return "요소수"
    if (pathname.startsWith("/bio1/sulfate") || pathname.startsWith("/bio2/sulfate")) return "황산암모늄"
    if (pathname.startsWith("/bio1/hydrated") || pathname.startsWith("/bio2/hydrated")) return "소석회"
    if (pathname.startsWith("/bio1/sodium") || pathname.startsWith("/bio2/sodium")) return "중탄산나트륨"

    return null
  }

  const getActivePageType = () => {
    if (pathname.endsWith("/final")) return "Final"
    if (pathname.endsWith("/draft")) return "Draft"
    // 기존 라우팅에서는 final이 아니면 Draft로 간주
    if (pathname.includes("/final")) return "Final"
    return "Draft"
  }

  const activeBio = getActiveBio()
  const activeProduct = getActiveProduct()
  const activePageType = getActivePageType()

  // 활성화된 Bio 시스템 찾기
  const activeBioItem = navigationItems.find((item) => item.title === activeBio)
  const activeProductItem = activeBioItem?.children?.find((item) => item.title === activeProduct)

  if (!shouldShowNavigation) {
    return null
  }

  return (
    <div>
      {/* 품명 네비게이션 */}
      {activeBioItem?.children && (
        <nav className="flex items-center justify-center space-x-1 mt-2 pt-0 overflow-x-auto">
          {/* Bio #1과 Bio #2 모두에서 요약 버튼 추가 */}
          {(activeBio === "Bio #1" || activeBio === "Bio #2") && (
            <>
              <Link
                href={activeBio === "Bio #1" ? "/bio1" : "/bio2"}
                className={cn(
                  "px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md inline-flex items-center whitespace-nowrap flex-shrink-0",
                  (activeBio === "Bio #1" && pathname === "/bio1") || (activeBio === "Bio #2" && pathname === "/bio2")
                    ? "bg-gray-200 text-gray-800 font-bold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
                )}
              >
                요약
              </Link>
              {/* 구분선 */}
              <div className="h-4 w-px bg-gray-300 mx-1 flex-shrink-0"></div>
            </>
          )}
          {/* 품명 버튼들 */}
          {activeBioItem.children.map((item) => (
            <Link
              key={item.title}
              href={`${item.href}/final`} // 기본적으로 final 페이지로 이동
              className={cn(
                "px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md inline-flex items-center whitespace-nowrap flex-shrink-0",
                activeProduct === item.title &&
                  ((activeBio === "Bio #1" && pathname !== "/bio1") || (activeBio === "Bio #2" && pathname !== "/bio2"))
                  ? "bg-gray-200 text-gray-800 font-bold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
              )}
            >
              <span className="hidden sm:inline">{item.title}</span>
              <span className="sm:hidden">
                {item.title === "유동사"
                  ? "유동사"
                  : item.title === "고령토"
                    ? "고령토"
                    : item.title === "요소수"
                      ? "요소수"
                      : item.title === "황산암모늄"
                        ? "황산암모늄"
                        : item.title === "소석회"
                          ? "소석회"
                          : item.title === "중탄산나트륨"
                            ? "중탄산"
                            : item.title}
              </span>
            </Link>
          ))}
        </nav>
      )}

      {/* 페이지 종류 네비게이션 (Draft, Final) */}
      {activeProductItem?.children && (
        <nav className="flex items-center justify-center space-x-1 mt-2 pt-0 overflow-x-auto">
          {activeProductItem.children.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-md inline-flex items-center whitespace-nowrap",
                activePageType === item.title
                  ? "bg-gray-200 text-gray-800 font-bold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800",
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}

export default SubNavigation
