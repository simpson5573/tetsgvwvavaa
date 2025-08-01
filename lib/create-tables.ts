"use server"

import { createServerSupabaseClient } from "./supabase"

export async function createTables(): Promise<{ success: boolean; message: string }> {
  console.log("[Server Action] Creating tables")

  try {
    const supabase = createServerSupabaseClient()

    // 먼저 테이블이 이미 존재하는지 확인
    const { data: existingTables, error: checkError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ["bio_company", "bio_chemical_plan"])

    if (checkError) {
      console.error("[Server Action] Error checking existing tables:", checkError)
      return {
        success: false,
        message: `테이블 확인 중 오류 발생: ${checkError.message}`,
      }
    }

    console.log("[Server Action] Existing tables:", existingTables)

    // 회사 테이블 생성
    if (!existingTables?.some((t) => t.table_name === "bio_company")) {
      console.log("[Server Action] Creating bio_company table")

      const { error: createCompaniesError } = await supabase.rpc("create_bio1_companies_table")

      if (createCompaniesError) {
        console.error("[Server Action] Error creating companies table:", createCompaniesError)
        return {
          success: false,
          message: `회사 테이블 생성 실패: ${createCompaniesError.message}`,
        }
      }
    } else {
      console.log("[Server Action] bio_company table already exists")
    }

    // 배차 계획 테이블 생성
    if (!existingTables?.some((t) => t.table_name === "bio_chemical_plan")) {
      console.log("[Server Action] Creating bio_chemical_plan table")

      const { error: createPlanError } = await supabase.rpc("create_bio_chemical_plan_table")

      if (createPlanError) {
        console.error("[Server Action] Error creating plan table:", createPlanError)
        return {
          success: false,
          message: `배차계획 테이블 생성 실패: ${createPlanError.message}`,
        }
      }
    } else {
      console.log("[Server Action] bio_chemical_plan table already exists")
    }

    return {
      success: true,
      message: "테이블이 성공적으로 생성되었습니다.",
    }
  } catch (error) {
    console.error("[Server Action] Error creating tables:", error)
    return {
      success: false,
      message: `테이블 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    }
  }
}
