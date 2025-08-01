import { createClient } from "./supabase/supabase.service"
import type { Company } from "./company-store"

// Supabase 데이터를 애플리케이션 형식으로 변환하는 함수
function convertToCompany(data: any): Company {
  let contact: string[] = []
  let phone: string[] = []

  // JSONB 데이터 파싱
  try {
    if (typeof data.contact === "string") {
      contact = JSON.parse(data.contact)
    } else if (Array.isArray(data.contact)) {
      contact = data.contact
    } else {
      contact = [data.contact || ""]
    }
  } catch {
    contact = [data.contact || ""]
  }

  try {
    if (typeof data.phone === "string") {
      phone = JSON.parse(data.phone)
    } else if (Array.isArray(data.phone)) {
      phone = data.phone
    } else {
      phone = [data.phone || ""]
    }
  } catch {
    phone = [data.phone || ""]
  }

  return {
    id: Number(data.id),
    name: String(data.name || ""),
    contact: contact,
    phone: phone,
    price: Number(data.price || 0),
    notes: String(data.notes || ""),
    productName: String(data.chemical_name || ""),
    isDefault: Boolean(data.is_default),
    plant: String(data.plant || "bio1"),
    pin: String(data.pin || ""),
  }
}

// 회사 정보 가져오기 - 삭제되지 않은 업체만 조회
export async function fetchCompanies(): Promise<Company[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("bio_company").select("*").eq("is_deleted", false).order("id")

    if (error) {
      console.error("회사 정보를 가져오는 중 오류 발생:", error)
      return []
    }

    return data?.map(convertToCompany) || []
  } catch (error) {
    console.error("fetchCompanies error:", error)
    return []
  }
}

// 회사 정보 저장하기 - JSONB 처리 방식 수정
export async function saveCompany(company: Omit<Company, "id">): Promise<Company | null> {
  try {
    const supabase = createClient()

    console.log("Original company data:", company)

    // JSONB 컬럼을 위해 JSON.stringify 사용
    const companyData = {
      name: String(company.name || ""),
      contact: JSON.stringify(Array.isArray(company.contact) ? company.contact : [String(company.contact || "")]),
      phone: JSON.stringify(Array.isArray(company.phone) ? company.phone : [String(company.phone || "")]),
      price: Number(company.price) || 0,
      notes: String(company.notes || ""),
      chemical_name: String(company.productName || ""),
      plant: String(company.plant || "bio1"),
      pin: String(company.pin || ""),
      is_deleted: false,
    }

    console.log("Final company data for insert:", companyData)
    console.log("Data types:", {
      name: typeof companyData.name,
      contact: typeof companyData.contact,
      phone: typeof companyData.phone,
      price: typeof companyData.price,
      notes: typeof companyData.notes,
      chemical_name: typeof companyData.chemical_name,
      plant: typeof companyData.plant,
      pin: typeof companyData.pin,
      is_deleted: typeof companyData.is_deleted,
    })

    const { data, error } = await supabase.from("bio_company").insert(companyData).select().single()

    if (error) {
      console.error("Supabase insert error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw error
    }

    console.log("Insert successful, returned data:", data)
    return convertToCompany(data)
  } catch (error) {
    console.error("saveCompany error:", error)
    throw error
  }
}

// 회사 정보 업데이트하기
export async function updateCompanyInfo(id: number, company: Partial<Company>): Promise<boolean> {
  try {
    const supabase = createClient()
    const updateData: any = {}

    if (company.name !== undefined) updateData.name = String(company.name)
    if (company.contact !== undefined) {
      updateData.contact = JSON.stringify(Array.isArray(company.contact) ? company.contact : [String(company.contact)])
    }
    if (company.phone !== undefined) {
      updateData.phone = JSON.stringify(Array.isArray(company.phone) ? company.phone : [String(company.phone)])
    }
    if (company.price !== undefined) updateData.price = Number(company.price)
    if (company.notes !== undefined) updateData.notes = String(company.notes)
    if (company.productName !== undefined) updateData.chemical_name = String(company.productName)
    if (company.isDefault !== undefined) updateData.is_default = Boolean(company.isDefault)
    if (company.plant !== undefined) updateData.plant = String(company.plant)
    if (company.pin !== undefined) updateData.pin = String(company.pin)

    console.log("Final company data for update:", updateData)
    console.log("Data types:", {
      name: typeof updateData.name,
      contact: typeof updateData.contact,
      phone: typeof updateData.phone,
      price: typeof updateData.price,
      notes: typeof updateData.notes,
      chemical_name: typeof updateData.chemical_name,
      is_default: typeof updateData.is_default,
      plant: typeof updateData.plant,
      pin: typeof updateData.pin,
    })

    const { error } = await supabase.from("bio_company").update(updateData).eq("id", Number(id))

    if (error) {
      console.error("회사 정보를 업데이트하는 중 오류 발생:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("updateCompanyInfo error:", error)
    return false
  }
}

// 회사 정보 논리적 삭제하기 (물리적 삭제 대신 is_deleted 플래그 업데이트)
export async function deleteCompanyInfo(id: number): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("bio_company").update({ is_deleted: true }).eq("id", Number(id))

    if (error) {
      console.error("회사 정보를 삭제하는 중 오류 발생:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("deleteCompanyInfo error:", error)
    return false
  }
}

// 회사 ID로 제품명 가져오기
export function getProductNameByCompanyId(companyId?: number, companies?: Company[]): string {
  if (!companyId || !companies) return "유동사"
  const company = companies.find((c) => c.id === companyId)
  return company?.productName || "유동사"
}

// 마이그레이션 함수
export async function migrateCompaniesToSupabase(companies: Company[]): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()

    // 기존 데이터 확인
    const { count, error: countError } = await supabase.from("bio_company").select("*", { count: "exact", head: true })

    if (countError) {
      throw new Error(`기존 데이터 확인 중 오류: ${countError.message}`)
    }

    if (count && count > 0) {
      return {
        success: false,
        message: `이미 ${count}개의 회사 데이터가 존재합니다.`,
      }
    }

    // 데이터 변환 - JSONB를 위해 JSON.stringify 사용
    const companyData = companies.map((company) => ({
      name: String(company.name || ""),
      contact: JSON.stringify(Array.isArray(company.contact) ? company.contact : [String(company.contact || "")]),
      phone: JSON.stringify(Array.isArray(company.phone) ? company.phone : [String(company.phone || "")]),
      price: Number(company.price) || 0,
      notes: String(company.notes || ""),
      chemical_name: String(company.productName || ""),
      is_default: Boolean(company.isDefault || false),
      plant: String(company.plant || "bio1"),
      pin: String(company.pin || ""),
      is_deleted: false,
    }))

    const { error } = await supabase.from("bio_company").insert(companyData)

    if (error) {
      throw new Error(`데이터 삽입 중 오류: ${error.message}`)
    }

    return {
      success: true,
      message: `${companies.length}개의 회사 데이터가 성공적으로 마이그레이션되었습니다.`,
    }
  } catch (error) {
    console.error("마이그레이션 중 오류 발생:", error)
    return {
      success: false,
      message: `마이그레이션 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    }
  }
}

// 추가 함수들
export async function getCompanies() {
  return fetchCompanies()
}

export async function getCompanyById(id: number) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bio_company")
      .select("*")
      .eq("id", Number(id))
      .eq("is_deleted", false)
      .single()

    if (error) throw error
    return convertToCompany(data)
  } catch (error) {
    console.error("getCompanyById error:", error)
    throw error
  }
}

export async function addCompany(company: Omit<Company, "id">) {
  return saveCompany(company)
}

export { updateCompanyInfo as updateCompany }
export { deleteCompanyInfo as deleteCompany }

export async function getDefaultCompany(productName: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("bio_company")
      .select("*")
      .eq("chemical_name", String(productName))
      .eq("is_default", true)
      .eq("is_deleted", false)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data ? convertToCompany(data) : null
  } catch (error) {
    console.error("getDefaultCompany error:", error)
    return null
  }
}

export async function setDefaultCompany(id: number, productName: string) {
  try {
    const supabase = createClient()

    // 1. 같은 chemical_name을 가진 모든 회사의 is_default를 false로 설정
    const { error: resetError } = await supabase
      .from("bio_company")
      .update({ is_deleted: false })
      .eq("chemical_name", String(productName))
      .eq("is_deleted", false)

    if (resetError) throw resetError

    // 2. 선택한 회사를 기본값으로 설정
    const { error: updateError } = await supabase
      .from("bio_company")
      .update({ is_default: true })
      .eq("id", Number(id))
      .eq("is_deleted", false)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error("setDefaultCompany error:", error)
    throw error
  }
}
