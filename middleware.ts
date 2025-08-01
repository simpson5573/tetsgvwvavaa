import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`🛡️ [MIDDLEWARE] 요청 경로: ${pathname}`)

  // 정적 파일과 API 경로, Vercel 내부 경로 제외
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // 쿠키에서 토큰 확인
  const token = request.cookies.get("access_token")?.value
  console.log(`🔑 [MIDDLEWARE] 토큰 존재 여부: ${!!token}`)

  // 인증 페이지 경로들
  const authPaths = ["/auth/login", "/auth/change-initial-password", "/auth/reset-password"]
  const isAuthPage = authPaths.includes(pathname)
  console.log(`🔐 [MIDDLEWARE] 인증 페이지 여부: ${isAuthPage}`)

  // 토큰이 없고 인증 페이지가 아닌 경우 로그인 페이지로 리디렉션
  if (!token && !isAuthPage) {
    console.log(`➡️ [MIDDLEWARE] 토큰 없음 → 로그인 페이지로 리디렉션`)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // 토큰이 있고 인증 페이지인 경우 메인 페이지로 리디렉션
  if (token && isAuthPage) {
    console.log(`➡️ [MIDDLEWARE] 토큰 있음 → 메인 페이지로 리디렉션`)
    return NextResponse.redirect(new URL("/", request.url))
  }

  console.log(`✅ [MIDDLEWARE] 정상 진행`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _vercel (Vercel internals)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|.*\\..*).*)",
  ],
}
