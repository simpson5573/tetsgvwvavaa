"use server"

export async function runUpdateOldPlansJob(): Promise<{ success: boolean; message: string }> {
  console.log("[Server Action] Running update old plans batch job")

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/batch/update-old-plans`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "Batch job failed")
    }

    console.log("[Server Action] Batch job completed successfully:", result)

    return {
      success: true,
      message: result.message,
    }
  } catch (error) {
    console.error("[Server Action] Error running batch job:", error)
    return {
      success: false,
      message: `배치 작업 실행 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    }
  }
}
