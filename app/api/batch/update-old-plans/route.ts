import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    // 보안 검증
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const currentDate = new Date()
    const yesterday = new Date(currentDate)
    yesterday.setDate(currentDate.getDate() - 1)

    // 날짜 형식 변환 (YYYY-MM-DD)
    const formattedYesterday = yesterday.toISOString().split("T")[0]

    // bio_chemical_plan 테이블 업데이트
    const { error } = await supabase
      .from("bio_chemical_plan")
      .update({ is_old: true })
      .lt("date", formattedYesterday)
      .eq("is_old", false)

    if (error) {
      console.error("Error updating old plans:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Old plans updated successfully for date before ${formattedYesterday}`,
    })
  } catch (error) {
    console.error("Error in batch update:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
