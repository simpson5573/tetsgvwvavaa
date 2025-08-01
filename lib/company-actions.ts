"use server"

import { createServerSupabaseClient } from "./supabase"

// setDefaultCompany 함수 수정
export async function setDefaultCompany(id: number, productName: string) {
  console.log(`[Server Action] Setting default company: id=${id}, productName=${productName}`)
  try {
    const supabase = createServerSupabaseClient()

    // 1. 먼저 같은 chemical_name을 가진 모든 회사의 is_default를 false로 설정
    const { error: resetError } = await supabase
      .from("bio_company")
      .update({ is_default: false })
      .eq("chemical_name", productName)
      .eq("is_deleted", false)

    if (resetError) {
      console.error("[Server Action] Error resetting default companies:", resetError)
      throw new Error(`Error resetting default companies: ${resetError.message}`)
    }

    // 2. 선택한 회사를 기본값으로 설정
    const { error: updateError } = await supabase
      .from("bio_company")
      .update({ is_default: true })
      .eq("id", id)
      .eq("is_deleted", false)

    if (updateError) {
      console.error("[Server Action] Error updating default company:", updateError)
      throw new Error(`Error updating default company: ${updateError.message}`)
    }

    console.log("[Server Action] Default company set successfully")
    return true
  } catch (error) {
    console.error("[Server Action] Error setting default company:", error)
    return false
  }
}

// getCompanies 함수 수정 - 삭제되지 않은 업체만 조회
export async function getCompanies() {
  console.log("[Server Action] Getting companies")
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("bio_company").select("*").eq("is_deleted", false).order("name")

    if (error) {
      console.error("[Server Action] Error fetching companies:", error)
      throw error
    }

    console.log(`[Server Action] Retrieved ${data.length} companies`)
    return data
  } catch (error) {
    console.error("[Server Action] Error in getCompanies:", error)
    throw error
  }
}

// addCompany 함수 수정
export async function addCompany(company: Omit<any, "id">) {
  console.log("[Server Action] Adding company:", company)
  try {
    const supabase = createServerSupabaseClient()
    const companyData = {
      ...company,
      is_deleted: false,
    }
    const { data, error } = await supabase.from("bio_company").insert([companyData]).select()

    if (error) {
      console.error("[Server Action] Error adding company:", error)
      throw error
    }

    console.log("[Server Action] Company added successfully:", data)
    return data[0]
  } catch (error) {
    console.error("[Server Action] Error in addCompany:", error)
    throw error
  }
}

export async function updateCompany(id: number, company: Partial<any>) {
  console.log(`[Server Action] Updating company: id=${id}`, company)
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("bio_company")
      .update(company)
      .eq("id", id)
      .eq("is_deleted", false)
      .select()

    if (error) {
      console.error("[Server Action] Error updating company:", error)
      throw error
    }

    console.log("[Server Action] Company updated successfully:", data)
    return data[0]
  } catch (error) {
    console.error("[Server Action] Error in updateCompany:", error)
    throw error
  }
}

// deleteCompany 함수 수정 - 논리적 삭제로 변경
export async function deleteCompany(id: number) {
  console.log(`[Server Action] Deleting company: id=${id}`)
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("bio_company").update({ is_deleted: true }).eq("id", id)

    if (error) {
      console.error("[Server Action] Error deleting company:", error)
      throw error
    }

    console.log("[Server Action] Company deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("[Server Action] Error in deleteCompany:", error)
    throw error
  }
}

export async function getDefaultCompany(productName: string) {
  console.log(`[Server Action] Getting default company for product: ${productName}`)
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("bio_company")
      .select("*")
      .eq("chemical_name", productName)
      .eq("is_default", true)
      .eq("is_deleted", false)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[Server Action] Error fetching default company:", error)
      throw error
    }

    console.log("[Server Action] Default company retrieved:", data)
    return data
  } catch (error) {
    console.error("[Server Action] Error in getDefaultCompany:", error)
    throw error
  }
}

// createTables 함수 수정 - 새로운 테이블 구조 반영
export async function createTables() {
  console.log("[Server Action] Creating tables")
  try {
    const supabase = createServerSupabaseClient()

    // bio_company 테이블 생성
    const { error: companiesError } = await supabase.rpc("create_bio_company_table")

    if (companiesError) {
      console.error("[Server Action] Error creating bio_company table:", companiesError)
      throw companiesError
    }

    // bio_chemical_plan 테이블 생성
    const { error: planError } = await supabase.rpc("create_bio_chemical_plan_table")

    if (planError) {
      console.error("[Server Action] Error creating bio_chemical_plan table:", planError)
      throw planError
    }

    console.log("[Server Action] Tables created successfully")
    return { success: true }
  } catch (error) {
    console.error("[Server Action] Error in createTables:", error)
    return { success: false, error: `Error creating tables: ${error instanceof Error ? error.message : String(error)}` }
  }
}
