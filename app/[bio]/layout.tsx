import type React from "react"
import { SubNavigation } from "@/components/sub-navigation"

export default function BioLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { bio: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  )
}
