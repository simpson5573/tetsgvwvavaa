import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import SubNavigation from "@/components/sub-navigation"
import HistorySubNavigation from "@/components/history-sub-navigation"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Biomass 약품 배차 시스템",
  description: "약품 재고 관리 및 배차 계획 시스템",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <Suspense>
            <SubNavigation />
          </Suspense>
          <Suspense>
            <HistorySubNavigation />
          </Suspense>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-656FZWQCXH" strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-656FZWQCXH');
            `}
          </Script>
          <main className="flex-1">{children}</main>
        </div>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
