import { supabase } from "./supabase"

// Chemical enum 값을 품명으로 변환하는 매핑
const CHEMICAL_ENUM_TO_PRODUCT: Record<string, string> = {
  SAND: "유동사",
  KAOLIN: "고령토",
  UREA: "요소수",
  SULFATE: "황산암모늄",
  HYDRATED: "소석회",
  SODIUM: "중탄산나트륨",
}

export interface DashboardDispatchPlan {
  id: string
  date: string
  productName: string
  deliveryCount: number
  deliveryTimes: string[]
  status: string
  companyId?: number
  deliveryQuantity?: number
  drivers?: string[]
  plant: string
  chemical: string
  chemicalName: string
}

// 모든 품명의 배차 계획 가져오기 (모든 날짜)
export async function fetchAllDispatchPlans(
  bioType: "bio1" | "bio2" | "combined" = "combined",
): Promise<DashboardDispatchPlan[]> {
  try {
    console.log(`Fetching all dispatch plans for bioType: ${bioType}`)

    let query = supabase.from("bio_chemical_plan").select("*").order("date", { ascending: true })

    // bioType에 따른 필터링
    if (bioType !== "combined") {
      query = query.eq("plant", bioType)
    }

    const { data, error } = await query

    if (error) {
      console.error("배차 계획 조회 오류:", error)
      throw error
    }

    if (!data) return []

    return data.map((item) => ({
      id: item.id,
      date: item.date,
      productName: CHEMICAL_ENUM_TO_PRODUCT[item.chemical] || item.chemical_name || item.chemical,
      plant: item.plant,
      chemical: item.chemical,
      chemicalName: CHEMICAL_ENUM_TO_PRODUCT[item.chemical] || item.chemical_name || item.chemical,
      companyId: item.company_id,
      status: item.status,
      deliveryCount: item.delivery_count || 0,
      deliveryQuantity: item.delivery_quantity || 0,
      deliveryTimes: item.delivery_times || [],
      drivers: item.drivers || [],
    }))
  } catch (error) {
    console.error("fetchAllDispatchPlans 오류:", error)
    return []
  }
}

// 특정 날짜의 배차 계획 가져오기
export async function fetchDispatchPlansForDate(bioType: string, date: string): Promise<DashboardDispatchPlan[]> {
  try {
    console.log(`Fetching dispatch plans for bioType: ${bioType}, date: ${date}`)

    let query = supabase.from("bio_chemical_plan").select("*").eq("date", date).order("chemical", { ascending: true })

    // bioType에 따른 필터링
    if (bioType !== "combined") {
      query = query.eq("plant", bioType)
    }

    const { data, error } = await query

    if (error) {
      console.error("특정 날짜 배차 계획 조회 오류:", error)
      throw error
    }

    if (!data) return []

    return data.map((item) => ({
      id: item.id,
      date: item.date,
      productName: CHEMICAL_ENUM_TO_PRODUCT[item.chemical] || item.chemical_name || item.chemical,
      plant: item.plant,
      chemical: item.chemical,
      chemicalName: CHEMICAL_ENUM_TO_PRODUCT[item.chemical] || item.chemical_name || item.chemical,
      companyId: item.company_id,
      status: item.status,
      deliveryCount: item.delivery_count || 0,
      deliveryQuantity: item.delivery_quantity || 0,
      deliveryTimes: item.delivery_times || [],
      drivers: item.drivers || [],
    }))
  } catch (error) {
    console.error("fetchDispatchPlansForDate 오류:", error)
    return []
  }
}

// 월별 통계 가져오기
export async function fetchMonthlyStats(
  year: number,
  month: number,
  bioType: "bio1" | "bio2" | "combined" = "combined",
) {
  try {
    console.log(`Fetching monthly stats for bioType: ${bioType}, year: ${year}, month: ${month}`)

    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`
    const lastDayOfMonth = new Date(year, month, 0).getDate()
    const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDayOfMonth.toString().padStart(2, "0")}`

    let query = supabase
      .from("bio_chemical_plan")
      .select("status, delivery_count, delivery_quantity, chemical")
      .gte("date", startDate)
      .lte("date", endDate)

    // bioType에 따른 필터링
    if (bioType !== "combined") {
      query = query.eq("plant", bioType)
    }

    const { data, error } = await query

    if (error) {
      console.error("월별 통계 조회 오류:", error)
      throw error
    }

    if (!data) {
      return {
        totalPlans: 0,
        totalDeliveries: 0,
        productStats: {},
      }
    }

    const totalPlans = data.length
    const totalDeliveries = data.reduce((sum, item) => sum + (item.delivery_count || 0), 0)

    // 품명별 통계
    const productStats: Record<string, number> = {}
    data.forEach((item) => {
      const productName = CHEMICAL_ENUM_TO_PRODUCT[item.chemical] || item.chemical
      productStats[productName] = (productStats[productName] || 0) + 1
    })

    return {
      totalPlans,
      totalDeliveries,
      productStats,
    }
  } catch (error) {
    console.error("fetchMonthlyStats 오류:", error)
    return {
      totalPlans: 0,
      totalDeliveries: 0,
      productStats: {},
    }
  }
}

// 하위 호환성을 위한 기존 함수들
export interface MonthlyStats {
  totalPlans: number
  completedPlans: number
  pendingPlans: number
  cancelledPlans: number
  totalDeliveryQuantity: number
}

export interface DashboardData {
  dispatchPlans: DashboardDispatchPlan[]
  monthlyStats: MonthlyStats
}

export async function getDashboardData(plant: string): Promise<DashboardData> {
  const dispatchPlans = await fetchAllDispatchPlans(plant as "bio1" | "bio2")
  const currentDate = new Date()
  const stats = await fetchMonthlyStats(currentDate.getFullYear(), currentDate.getMonth() + 1, plant as "bio1" | "bio2")

  const monthlyStats: MonthlyStats = {
    totalPlans: stats.totalPlans,
    completedPlans: 0,
    pendingPlans: 0,
    cancelledPlans: 0,
    totalDeliveryQuantity: stats.totalDeliveries,
  }

  return {
    dispatchPlans,
    monthlyStats,
  }
}

export async function getDashboardDataByDate(plant: string, date: string): Promise<DashboardDispatchPlan[]> {
  return await fetchDispatchPlansForDate(plant, date)
}

export async function getDashboardStats(plant: string, year: number, month: number): Promise<MonthlyStats> {
  const stats = await fetchMonthlyStats(year, month, plant as "bio1" | "bio2")

  return {
    totalPlans: stats.totalPlans,
    completedPlans: 0,
    pendingPlans: 0,
    cancelledPlans: 0,
    totalDeliveryQuantity: stats.totalDeliveries,
  }
}
