import { supabase } from "./supabase"
import type { DeliveryDetailWithStatus } from "./dispatch-store"
import { getProductNameByCompanyId } from "./company-service"
import type { Company } from "./company-store"
import { getBioSettingOrDefault } from "@/lib/bio-setting-service"
import { calculateDayStocks, calculateNextMorningStock, type DayStockParams } from "./stock-calculation"

// 품명을 Chemical enum 값으로 변환하는 매핑 (대문자)
const PRODUCT_TO_CHEMICAL_ENUM: Record<string, string> = {
  유동사: "SAND",
  고령토: "KAOLIN",
  요소수: "UREA",
  황산암모늄: "SULFATE",
  소석회: "HYDRATED",
  중탄산나트륨: "SODIUM",
}

// Chemical enum 값을 품명으로 변환하는 매핑
const CHEMICAL_ENUM_TO_PRODUCT: Record<string, string> = {
  SAND: "유동사",
  KAOLIN: "고령토",
  UREA: "요소수",
  SULFATE: "황산암모늄",
  HYDRATED: "소석회",
  SODIUM: "중탄산나트륨",
}

// UUID 유효성 검사 함수
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// 배차 계획 저장하기
export async function saveDispatchPlan(plan: DeliveryDetailWithStatus, companies?: Company[]): Promise<string | null> {
  const plant = plan.plant || "bio1"
  const productName = getProductNameByCompanyId(plan.companyId, companies)
  const chemical = PRODUCT_TO_CHEMICAL_ENUM[plan.productName || productName] || "SAND"

  // 업체 ID 결정 로직 수정 - plan.companyId를 최우선으로 사용
  let finalCompanyId = "0"

  if (plan.companyId !== undefined && plan.companyId !== null) {
    finalCompanyId = plan.companyId.toString()
    console.log(`Using plan.companyId: ${finalCompanyId} for date: ${plan.date}`)
  } else {
    const defaultCompany = companies?.find(
      (c) => c.productName === (plan.productName || productName) && c.isDefault === true,
    )
    finalCompanyId = defaultCompany ? defaultCompany.id.toString() : "0"
    console.log(`Using default company: ${finalCompanyId} for date: ${plan.date}`)
  }

  // 입고량 결정 - 수정된 입고량을 우선적으로 사용
  let deliveryQuantity = 0
  if (plan.deliveryQuantity !== undefined && plan.deliveryQuantity !== null) {
    deliveryQuantity = plan.deliveryQuantity
    console.log(`Using modified delivery quantity: ${deliveryQuantity} for date: ${plan.date}`)
  } else if (plan.deliveryAmount !== undefined && plan.deliveryAmount !== null) {
    deliveryQuantity = plan.deliveryAmount
    console.log(`Using delivery amount: ${deliveryQuantity} for date: ${plan.date}`)
  } else {
    deliveryQuantity = 0
    console.log(`Using default delivery quantity: ${deliveryQuantity} for date: ${plan.date}`)
  }

  // factor 값 적용 - 요소수와 황산암모늄의 경우 ton을 mm로 변환
  const cleanProductName = productName.replace("bio2_", "")
  const detectedPlant = productName.startsWith("bio2_") ? "bio2" : plant || "bio1"
  const bioSetting = await getBioSettingOrDefault(detectedPlant, cleanProductName)
  const factor = bioSetting.factor || 1

  // 입고량에 factor 적용 (ton -> mm 변환)
  const convertedDeliveryQuantity = deliveryQuantity * factor

  console.log(
    `Factor 적용 - 원본 입고량: ${deliveryQuantity}ton, factor: ${factor}, 변환된 입고량: ${convertedDeliveryQuantity}`,
  )

  console.log("Saving dispatch plan with details:", {
    date: plan.date,
    plant: plant,
    chemical: chemical,
    company_id: finalCompanyId,
    chemical_name: plan.productName || productName,
    delivery_quantity: deliveryQuantity,
    delivery_count: plan.deliveryCount,
  })

  // 통합 테이블 형식에 맞게 데이터 변환
  const dispatchPlan = {
    date: plan.date,
    plant: plant,
    chemical: chemical,
    company_id: finalCompanyId,
    chemical_name: plan.productName || productName,
    status: plan.status,
    delivery_count: plan.deliveryCount,
    delivery_times: plan.deliveryTimes,
    delivery_quantity: deliveryQuantity,
    morning_stock: plan.morningStock,
    evening_stock: plan.eveningStock,
    pre_delivery_stocks: plan.preDeliveryStock,
    post_delivery_stocks: plan.postDeliveryStock,
    note: plan.note || "",
  }

  const { data, error } = await supabase.from("bio_chemical_plan").insert([dispatchPlan]).select("id").single()

  if (error) {
    console.error(`배차 계획을 bio_chemical_plan 테이블에 저장하는 중 오류 발생:`, error)
    return null
  }

  console.log(
    `Successfully saved dispatch plan with company_id: ${finalCompanyId}, delivery_quantity: ${deliveryQuantity} to bio_chemical_plan`,
  )
  return data.id
}

// 배차 계획 업데이트하기 (통합 함수 사용)
export async function updateDispatchPlan(
  id: string,
  updates: Partial<DeliveryDetailWithStatus>,
  plant?: string,
  productName?: string,
): Promise<boolean> {
  try {
    if (!id || (!isValidUUID(id) && isNaN(Number(id)))) {
      console.error(`Invalid ID format: ${id}`)
      return false
    }

    const finalPlant = plant || "bio1"
    const actualProductName = productName || updates.productName || "유동사"
    const chemical = PRODUCT_TO_CHEMICAL_ENUM[actualProductName] || "SAND"

    console.log(
      `Updating dispatch plan - ID: ${id}, Plant: ${finalPlant}, Chemical: ${chemical}, Product: ${actualProductName}`,
    )

    // 먼저 기존 데이터 조회
    let query = supabase.from("bio_chemical_plan").select("*").eq("plant", finalPlant).eq("chemical", chemical)

    if (isValidUUID(id)) {
      query = query.eq("id", id)
    } else {
      query = query.limit(1)
    }

    const { data: existingData, error: fetchError } = await query.single()

    if (fetchError) {
      console.error(`기존 데이터 조회 중 오류 발생:`, fetchError)
      return false
    }

    if (!existingData) {
      console.error(`No data found for ID: ${id}`)
      return false
    }

    const originalDate = existingData.date
    let stockChange = 0

    // 입고량이 변경되는 경우 재고 재계산 필요
    const needsRecalculation = updates.deliveryQuantity !== undefined || updates.deliveryAmount !== undefined

    if (needsRecalculation) {
      const newQuantity = updates.deliveryQuantity || updates.deliveryAmount || existingData.delivery_quantity
      const oldQuantity = existingData.delivery_quantity || 0
      const deliveryCount = existingData.delivery_count || 0
      const morningStock = existingData.morning_stock || 0

      const cleanProductName = actualProductName.replace("bio2_", "")
      const detectedPlant = actualProductName.startsWith("bio2_") ? "bio2" : plant || "bio1"

      const bioSetting = await getBioSettingOrDefault(detectedPlant, cleanProductName)
      const conversionRate = bioSetting.factor || 1

      console.log(`재고 재계산 - 품명: ${cleanProductName}, factor: ${conversionRate}, 새 입고량: ${newQuantity}ton`)

      // 통합 재고 계산 함수 사용 - factor 적용된 값으로 계산
      const stockParams: DayStockParams = {
        morningStock,
        deliveryTimes: existingData.delivery_times || [],
        deliveryCount,
        deliveryAmount: newQuantity * conversionRate, // factor 적용
        dailyUsage: bioSetting.flow || 15,
        conversionRate: 1, // 이미 변환된 값이므로 1로 설정
      }

      const { preDeliveryStocks, postDeliveryStocks, eveningStock } = calculateDayStocks(stockParams)

      const oldEveningStock = existingData.evening_stock || 0
      stockChange = eveningStock - oldEveningStock

      updates.preDeliveryStock = preDeliveryStocks
      updates.postDeliveryStock = postDeliveryStocks
      updates.eveningStock = eveningStock

      if (!updates.status) {
        updates.status = "modify"
      }
    }

    // 통합 테이블 형식에 맞게 데이터 변환
    const updateData: any = {}

    if (updates.date) updateData.date = updates.date
    if (updates.companyId !== undefined) updateData.company_id = updates.companyId.toString()
    if (updates.status) updateData.status = updates.status
    if (updates.deliveryCount !== undefined) updateData.delivery_count = updates.deliveryCount
    if (updates.deliveryTimes) updateData.delivery_times = updates.deliveryTimes
    if (updates.deliveryAmount !== undefined || updates.deliveryQuantity !== undefined) {
      updateData.delivery_quantity = updates.deliveryAmount || updates.deliveryQuantity || 0
    }
    if (updates.morningStock !== undefined) updateData.morning_stock = updates.morningStock
    if (updates.eveningStock !== undefined) updateData.evening_stock = updates.eveningStock
    if (updates.preDeliveryStock) updateData.pre_delivery_stocks = updates.preDeliveryStock
    if (updates.postDeliveryStock) updateData.post_delivery_stocks = updates.postDeliveryStock
    if (updates.note !== undefined) updateData.note = updates.note

    updateData.updated_at = new Date().toISOString()

    console.log(`Updating dispatch plan in bio_chemical_plan, id: ${id}, data:`, updateData)

    const actualId = existingData.id
    const { error } = await supabase.from("bio_chemical_plan").update(updateData).eq("id", actualId)

    if (error) {
      console.error(`배차 계획을 bio_chemical_plan 테이블에서 업데이트하는 중 오류 발생:`, error)
      return false
    }

    // 저녁 재고에 변화가 있는 경우 이후 날짜들 연쇄 업데이트
    if (stockChange !== 0) {
      console.log(`저녁 재고 변화량: ${stockChange}, 이후 날짜들 연쇄 업데이트 시작`)

      const { data: subsequentData, error: subsequentError } = await supabase
        .from("bio_chemical_plan")
        .select("*")
        .eq("plant", finalPlant)
        .eq("chemical", chemical)
        .gt("date", originalDate)
        .order("date", { ascending: true })

      if (subsequentError) {
        console.error(`이후 날짜 데이터 조회 중 오류:`, subsequentError)
        return false
      }

      if (subsequentData && subsequentData.length > 0) {
        console.log(`${subsequentData.length}개의 이후 날짜 항목 업데이트 시작`)

        for (const item of subsequentData) {
          const itemUpdateData = {
            morning_stock: (item.morning_stock || 0) + stockChange,
            evening_stock: (item.evening_stock || 0) + stockChange,
            pre_delivery_stocks: (item.pre_delivery_stocks || []).map((stock: number) => stock + stockChange),
            post_delivery_stocks: (item.post_delivery_stocks || []).map((stock: number) => stock + stockChange),
            updated_at: new Date().toISOString(),
          }

          const { error: itemUpdateError } = await supabase
            .from("bio_chemical_plan")
            .update(itemUpdateData)
            .eq("id", item.id)

          if (itemUpdateError) {
            console.error(`이후 날짜 항목 ${item.date} 업데이트 중 오류:`, itemUpdateError)
            return false
          }
        }

        console.log(`${subsequentData.length}개 이후 날짜 항목 업데이트 완료`)
      }
    }

    console.log(`Successfully updated dispatch plan in bio_chemical_plan`)
    return true
  } catch (error) {
    console.error("배차 계획 업데이트 중 오류:", error)
    return false
  }
}

// 시간 및 코멘트 업데이트 함수 (통합 함수 사용)
export async function updateTimeAndNote(
  id: string,
  plant: string,
  productName: string,
  deliveryTimes: string[],
  note: string,
  newDeliveryCount?: number,
): Promise<boolean> {
  const finalPlant = plant
  const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName] || "SAND"

  let query = supabase.from("bio_chemical_plan").select("*").eq("plant", finalPlant).eq("chemical", chemical)

  if (isValidUUID(id)) {
    query = query.eq("id", id)
  } else {
    const numericId = Number(id)
    if (!isNaN(numericId)) {
      query = query.limit(1)
    } else {
      console.error(`Invalid ID format for updateTimeAndNote: ${id}`)
      return false
    }
  }

  const { data: existingData, error: fetchError } = await query.single()

  if (fetchError) {
    console.error(`기존 데이터 조회 중 오류 발생:`, fetchError)
    return false
  }

  const originalDate = existingData.date
  const originalEveningStock = existingData.evening_stock || 0

  const actualCleanProductName = productName.replace("bio2_", "")
  const detectedPlant = productName.startsWith("bio2_") ? "bio2" : plant || "bio1"

  const bioSetting = await getBioSettingOrDefault(detectedPlant, actualCleanProductName)
  const conversionRate = bioSetting.factor || 1

  console.log(`시간 업데이트 - 품명: ${productName}, factor: ${conversionRate}`)

  const morningStock = existingData.morning_stock
  const actualDeliveryCount = newDeliveryCount !== undefined ? newDeliveryCount : deliveryTimes.length
  const deliveryQuantity = existingData.delivery_quantity || 0

  // 통합 재고 계산 함수 사용 - factor 적용
  const stockParams: DayStockParams = {
    morningStock,
    deliveryTimes,
    deliveryCount: actualDeliveryCount,
    deliveryAmount: deliveryQuantity * conversionRate, // factor 적용
    dailyUsage: bioSetting.flow || 15,
    conversionRate: 1, // 이미 변환된 값이므로 1로 설정
  }

  const { preDeliveryStocks, postDeliveryStocks, eveningStock } = calculateDayStocks(stockParams)

  console.log(`저녁 재고 계산 결과: ${eveningStock}`)

  const stockChange = eveningStock - originalEveningStock

  const updateData = {
    old_delivery_times: existingData.delivery_times,
    delivery_times: deliveryTimes,
    delivery_count: actualDeliveryCount,
    pre_delivery_stocks: preDeliveryStocks,
    post_delivery_stocks: postDeliveryStocks,
    evening_stock: eveningStock,
    note: note,
    status: "modify",
    updated_at: new Date().toISOString(),
  }

  console.log("업데이트할 데이터:", updateData)

  const actualId = existingData.id
  const { error } = await supabase.from("bio_chemical_plan").update(updateData).eq("id", actualId)

  if (error) {
    console.error(`배차 계획 시간/코멘트 업데이트 중 오류 발생:`, error)
    return false
  }

  // 저녁 재고에 변화가 있는 경우 이후 날짜들 연쇄 업데이트
  if (stockChange !== 0) {
    console.log(`저녁 재고 변화량: ${stockChange}, 이후 날짜들 연쇄 업데이트 시작`)

    const { data: subsequentData, error: subsequentError } = await supabase
      .from("bio_chemical_plan")
      .select("*")
      .eq("plant", finalPlant)
      .eq("chemical", chemical)
      .gt("date", originalDate)
      .order("date", { ascending: true })

    if (subsequentError) {
      console.error(`이후 날짜 데이터 조회 중 오류:`, subsequentError)
      return false
    }

    if (subsequentData && subsequentData.length > 0) {
      console.log(`${subsequentData.length}개의 이후 날짜 항목 업데이트 시작`)

      for (const item of subsequentData) {
        const itemUpdateData = {
          morning_stock: (item.morning_stock || 0) + stockChange,
          evening_stock: (item.evening_stock || 0) + stockChange,
          pre_delivery_stocks: (item.pre_delivery_stocks || []).map((stock: number) => stock + stockChange),
          post_delivery_stocks: (item.post_delivery_stocks || []).map((stock: number) => stock + stockChange),
          updated_at: new Date().toISOString(),
        }

        const { error: itemUpdateError } = await supabase
          .from("bio_chemical_plan")
          .update(itemUpdateData)
          .eq("id", item.id)

        if (itemUpdateError) {
          console.error(`이후 날짜 항목 ${item.date} 업데이트 중 오류:`, itemUpdateError)
          return false
        }
      }

      console.log(`${subsequentData.length}개 이후 날짜 항목 업데이트 완료`)
    }
  }

  return true
}

// 배차계획 불러오기 함수
export async function loadDispatchPlans(productName: string, plant?: string) {
  try {
    const finalPlant = plant || "bio1"
    const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName] || "SAND"

    console.log(`Loading dispatch plans for product: ${productName}, plant: ${finalPlant}, chemical: ${chemical}`)

    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("bio_chemical_plan")
      .select("*")
      .eq("plant", finalPlant)
      .eq("chemical", chemical)
      .gte("date", today)
      .order("date", { ascending: true })

    if (error) {
      console.error(`배차계획 불러오기 오류 (${productName} -> ${chemical}):`, error)
      return { success: false, data: [], error: error.message }
    }

    // 데이터 형식 변환
    const formattedData = data.map((item) => ({
      id: item.id,
      date: item.date,
      morningStock: item.morning_stock,
      eveningStock: item.evening_stock,
      deliveryCount: item.delivery_count,
      deliveryTimes: item.delivery_times || [],
      preDeliveryStock: item.pre_delivery_stocks || [],
      postDeliveryStock: item.post_delivery_stocks || [],
      status: item.status || "sent",
      companyId: item.company_id,
      deliveryAmount: item.delivery_quantity || item.delivery_amount,
      note: item.note || "",
      attachments: item.attachments || [],
    }))

    console.log(`Successfully loaded ${formattedData.length} dispatch plans from bio_chemical_plan`)
    return { success: true, data: formattedData }
  } catch (error) {
    console.error("배차계획 불러오기 중 오류:", error)
    return { success: false, data: [], error: "배차계획 불러오기 중 오류가 발생했습니다." }
  }
}

// 배차 계획 가져오기 (Final 페이지용 - 내일 이후 데이터만)
export async function fetchFinalDispatchPlans(
  plant: string,
  productName?: string,
): Promise<DeliveryDetailWithStatus[]> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

  console.log(`Final 페이지 데이터 조회 - 내일 날짜: ${tomorrowStr}, 품명: ${productName}, plant: ${plant}`)

  if (!productName) {
    return []
  }

  const finalPlant = plant
  const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName] || "SAND"

  console.log(`Using bio_chemical_plan for product: ${productName}, plant: ${finalPlant}, chemical: ${chemical}`)

  const query = supabase
    .from("bio_chemical_plan")
    .select("*")
    .eq("plant", finalPlant)
    .eq("chemical", chemical)
    .gte("date", tomorrowStr)
    .order("date", { ascending: true })

  console.log(
    `쿼리 실행: bio_chemical_plan 테이블에서 plant=${finalPlant}, chemical=${chemical}, date >= ${tomorrowStr}`,
  )

  const { data, error } = await query

  if (error) {
    console.error(`배차 계획을 bio_chemical_plan 테이블에서 가져오는 중 오류 발생:`, error)
    return []
  }

  console.log(`조회된 데이터 개수: ${data?.length || 0}`)
  if (data && data.length > 0) {
    console.log(`첫 번째 데이터 날짜: ${data[0].date}`)
    console.log(`마지막 데이터 날짜: ${data[data.length - 1].date}`)
  }

  const actualProductName = productName.replace("bio2_", "")

  return data.map((item) => convertToDeliveryDetail(item, actualProductName))
}

// Final 페이지용 배차 계획 상세 정보 불러오기
export async function loadFinalDeliveryDetails(
  plant: string,
  productName: string,
): Promise<{ success: boolean; data: DeliveryDetailWithStatus[]; error?: string }> {
  try {
    console.log(`Loading final delivery details - plant: ${plant}, productName: ${productName}`)

    const finalPlant = plant
    const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName] || "SAND"

    console.log(`Using bio_chemical_plan for product: ${productName}, plant: ${finalPlant}, chemical: ${chemical}`)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("bio_chemical_plan")
      .select("*")
      .eq("plant", finalPlant)
      .eq("chemical", chemical)
      .gte("date", tomorrowStr)
      .order("date", { ascending: true })

    if (error) {
      console.error(`Final 배차 계획 불러오기 오류 (${productName} -> ${chemical}):`, error)
      return { success: false, data: [], error: error.message }
    }

    const formattedData = data.map((item) => convertToDeliveryDetail(item, productName))

    console.log(`Successfully loaded ${formattedData.length} final delivery details from bio_chemical_plan`)
    return { success: true, data: formattedData }
  } catch (error) {
    console.error("Final 배차 계획 불러오기 중 오류:", error)
    return { success: false, data: [], error: "Final 배차 계획 불러오기 중 오류가 발생했습니다." }
  }
}

// Bio2 배차 이력 가져오기 (Bio2 전용 함수)
export async function fetchBio2HistoryDispatchPlans(filters?: {
  year?: string
  month?: string
  companyId?: string
  status?: string
  productName?: string
}): Promise<DeliveryDetailWithStatus[]> {
  console.log("Bio2 이력 조회 시작")

  try {
    let query = supabase
      .from("bio_chemical_plan")
      .select("*, attachments_1, attachments_2")
      .eq("plant", "BIO2")
      .order("date", { ascending: false })

    // 허용된 상태 목록
    const allowedStatuses = ["sent", "modify", "cancelrequest", "cancel", "done", "confirmed"]
    query = query.in("status", allowedStatuses)

    // 필터 적용
    if (filters) {
      if (filters.year && filters.year !== "all") {
        const startDate = `${filters.year}-01-01`
        const endDate = `${filters.year}-12-31`
        query = query.gte("date", startDate).lte("date", endDate)
      }

      if (filters.month && filters.month !== "all" && filters.year && filters.year !== "all") {
        const month = filters.month.padStart(2, "0")
        const year = filters.year
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate()

        const startDate = `${year}-${month}-01`
        const endDate = `${year}-${month}-${daysInMonth}`

        query = query.gte("date", startDate).lte("date", endDate)
      }

      if (filters.companyId && filters.companyId !== "all") {
        query = query.eq("company_id", filters.companyId)
      }

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }

      if (filters.productName && filters.productName !== "all") {
        const chemical = PRODUCT_TO_CHEMICAL_ENUM[filters.productName] || filters.productName.toUpperCase()
        query = query.eq("chemical", chemical)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error(`Bio2 배차 이력을 bio_chemical_plan 테이블에서 가져오는 중 오류 발생:`, error)
      return []
    }

    // 결과 변환 및 추가
    const convertedData = data.map((item) => {
      const productName = CHEMICAL_ENUM_TO_PRODUCT[item.chemical] || item.chemical_name || "알 수 없음"
      const detail = convertToDeliveryDetail(item, productName)
      detail.productName = productName
      return detail
    })

    console.log(`Bio2 이력 조회 완료: 총 ${convertedData.length}개 항목`)
    return convertedData
  } catch (error) {
    console.error(`Bio2 이력 조회 중 오류:`, error)
    return []
  }
}

// 배차 이력 가져오기 (이력 페이지용 - 오늘 포함 이전 데이터)
export async function fetchHistoryDispatchPlans(
  productName?: string,
  plant: string,
  filters?: {
    year?: string
    month?: string
    companyId?: string
    status?: string
    productName?: string
  },
): Promise<DeliveryDetailWithStatus[]> {
  const finalProductName =
    filters && filters.productName && filters.productName !== "all" ? filters.productName : productName

  let allResults: DeliveryDetailWithStatus[] = []

  // 품명이 지정되지 않은 경우 모든 Chemical에서 데이터 조회
  if (!finalProductName) {
    const allProductNames =
      plant === "bio2"
        ? ["유동사", "고령토", "소석회", "중탄산나트륨", "요소수", "황산암모늄"]
        : ["유동사", "고령토", "요소수", "황산암모늄", "소석회", "중탄산나트륨"]

    // 각 품명별로 데이터 조회 후 결합
    for (const prodName of allProductNames) {
      const finalPlant = plant
      const chemical = PRODUCT_TO_CHEMICAL_ENUM[prodName] || "SAND"

      let query = supabase
        .from("bio_chemical_plan")
        .select("*, attachments_1, attachments_2")
        .eq("plant", finalPlant)
        .eq("chemical", chemical)
        .order("date", { ascending: false })

      const allowedStatuses = ["sent", "modify", "cancelrequest", "cancel", "done", "confirmed"]
      query = query.in("status", allowedStatuses)

      // 필터 적용 (품명 제외)
      if (filters) {
        if (filters.year && filters.year !== "all") {
          const startDate = `${filters.year}-01-01`
          const endDate = `${filters.year}-12-31`
          query = query.gte("date", startDate).lte("date", endDate)
        }

        if (filters.month && filters.month !== "all" && filters.year && filters.year !== "all") {
          const month = filters.month.padStart(2, "0")
          const year = filters.year
          const daysInMonth = new Date(Number(year), Number(month), 0).getDate()

          const startDate = `${year}-${month}-01`
          const endDate = `${year}-${month}-${daysInMonth}`

          query = query.gte("date", startDate).lte("date", endDate)
        }

        if (filters.companyId && filters.companyId !== "all") {
          query = query.eq("company_id", filters.companyId)
        }

        if (filters.status && filters.status !== "all") {
          query = query.eq("status", filters.status)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error(`배차 이력을 bio_chemical_plan 테이블에서 가져오는 중 오류 발생:`, error)
        continue
      }

      const actualProductName = prodName.replace("bio2_", "")

      const convertedData = data.map((item) => {
        const detail = convertToDeliveryDetail(item, actualProductName)
        detail.productName = actualProductName
        return detail
      })

      allResults = [...allResults, ...convertedData]
    }

    allResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return allResults
  }

  // 품명이 지정된 경우 해당 Chemical만 조회
  const finalPlant = plant
  const chemical = PRODUCT_TO_CHEMICAL_ENUM[finalProductName] || "SAND"

  let query = supabase
    .from("bio_chemical_plan")
    .select("*, attachments_1, attachments_2")
    .eq("plant", finalPlant)
    .eq("chemical", chemical)
    .order("date", { ascending: false })

  const allowedStatuses = ["sent", "modify", "cancelrequest", "cancel", "done", "confirmed"]
  query = query.in("status", allowedStatuses)

  // 필터 적용
  if (filters) {
    if (filters.year && filters.year !== "all") {
      const startDate = `${filters.year}-01-01`
      const endDate = `${filters.year}-12-31`
      query = query.gte("date", startDate).lte("date", endDate)
    }

    if (filters.month && filters.month !== "all" && filters.year && filters.year !== "all") {
      const month = filters.month.padStart(2, "0")
      const year = filters.year
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate()

      const startDate = `${year}-${month}-01`
      const endDate = `${year}-${month}-${daysInMonth}`

      query = query.gte("date", startDate).lte("date", endDate)
    }

    if (filters.companyId && filters.companyId !== "all") {
      query = query.eq("company_id", filters.companyId)
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }
  }

  const { data, error } = await query

  if (error) {
    console.error(`배차 이력을 bio_chemical_plan 테이블에서 가져오는 중 오류 발생:`, error)
    return []
  }

  const cleanProductName = finalProductName.replace("bio2_", "")

  return data.map((item) => {
    const detail = convertToDeliveryDetail(item, cleanProductName)
    detail.productName = cleanProductName
    return detail
  })
}

// 배차 계획 삭제하기
export async function deleteDispatchPlan(id: string, plant?: string, productName?: string): Promise<boolean> {
  const finalPlant = plant || "bio1"
  const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName || "유동사"] || "SAND"

  let query = supabase.from("bio_chemical_plan").delete().eq("plant", finalPlant).eq("chemical", chemical)

  if (isValidUUID(id)) {
    query = query.eq("id", id)
  } else {
    console.error(`Invalid ID format for delete: ${id}`)
    return false
  }

  const { error } = await query

  if (error) {
    console.error(`배차 계획을 bio_chemical_plan 테이블에서 삭제하는 중 오류 발생:`, error)
    return false
  }

  return true
}

// 배차 계획 상태를 '취소요청'으로 변경하기
export async function requestCancelDispatchPlan(id: string, plant: string, productName?: string): Promise<boolean> {
  const finalPlant = plant
  const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName || "유동사"] || "SAND"

  let query = supabase
    .from("bio_chemical_plan")
    .update({
      status: "cancelrequest",
      updated_at: new Date().toISOString(),
    })
    .eq("plant", finalPlant)
    .eq("chemical", chemical)

  if (isValidUUID(id)) {
    query = query.eq("id", id)
  } else {
    console.error(`Invalid ID format for cancel request: ${id}`)
    return false
  }

  const { error } = await query

  if (error) {
    console.error(`배차 계획 상태를 취소요청으로 변경하는 중 오류 발생:`, error)
    return false
  }

  return true
}

// 긴급취소 - 전송, 수정, 확정 상태의 모든 배차계획을 취소로 변경
export async function emergencyCancelAllDispatchPlans(
  plant: string,
  productName: string,
): Promise<{ success: boolean; count: number }> {
  console.log("긴급취소 시작")

  const finalPlant = plant
  const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName] || "SAND"

  const targetStatuses = ["sent", "modify", "confirmed"]

  // 먼저 취소할 항목들의 개수 확인
  const { data: countData, error: countError } = await supabase
    .from("bio_chemical_plan")
    .select("id")
    .eq("plant", finalPlant)
    .eq("chemical", chemical)
    .in("status", targetStatuses)

  if (countError) {
    console.error(`긴급취소 대상 항목 개수 확인 중 오류 발생:`, countError)
    return { success: false, count: 0 }
  }

  const count = countData?.length || 0

  if (count === 0) {
    return { success: true, count: 0 }
  }

  // 상태를 '취소'로 변경
  const { error } = await supabase
    .from("bio_chemical_plan")
    .update({
      status: "cancelrequest",
      updated_at: new Date().toISOString(),
    })
    .eq("plant", finalPlant)
    .eq("chemical", chemical)
    .in("status", targetStatuses)

  if (error) {
    console.error(`긴급취소 실행 중 오류 발생:`, error)
    return { success: false, count: 0 }
  }

  return { success: true, count }
}

// 새로운 설정으로 재고 재계산 (통합 함수 사용)
export async function recalculateStocksWithNewSettings(
  plant: string,
  productName: string,
  newSettings: {
    morningStock: number
    dailyUsage: number
    dailyUsageValues?: number[]
    deliveryAmount?: number
    conversionRate: number
  },
): Promise<boolean> {
  try {
    const finalPlant = plant
    const chemical = PRODUCT_TO_CHEMICAL_ENUM[productName] || "SAND"

    console.log(`재고 재계산 시작 - plant: ${finalPlant}, chemical: ${chemical}`)
    console.log("새로운 설정:", newSettings)

    // 수정된 코드 (오늘 이후 조회 - Final 페이지와 동일한 범위)
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("bio_chemical_plan")
      .select("*")
      .eq("plant", finalPlant)
      .eq("chemical", chemical)
      .gte("date", todayStr) // 오늘부터 조회
      .order("date", { ascending: true })

    if (error) {
      console.error(`재계산용 데이터 조회 오류:`, error)
      return false
    }

    if (!data || data.length === 0) {
      console.log("재계산할 데이터가 없습니다")
      return true
    }

    console.log(`${data.length}개 항목 재계산 시작`)

    // 각 항목에 대해 재고 재계산 (통합 함수 사용)
    let previousEveningStock = newSettings.morningStock
    let previousNightDeliveries = 0

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const deliveryTimes = item.delivery_times || []
      const deliveryCount = item.delivery_count || 0
      const deliveryQuantity = item.delivery_quantity || newSettings.deliveryAmount || 0

      // 현재 날짜의 아침 재고 계산
      let currentMorningStock: number
      if (i === 0) {
        currentMorningStock = newSettings.morningStock
      } else {
        // 전날 저녁 재고에서 야간 사용량 차감하고 야간 입고량 추가
        const dayIndex = Math.min(i - 1, (newSettings.dailyUsageValues?.length || 10) - 1)
        const previousDailyUsage = newSettings.dailyUsageValues?.[dayIndex] || newSettings.dailyUsage

        currentMorningStock = calculateNextMorningStock(
          previousEveningStock,
          previousNightDeliveries,
          previousDailyUsage,
          newSettings.conversionRate,
        )
      }

      // 일일 사용량 결정
      const dayIndex = Math.min(i, (newSettings.dailyUsageValues?.length || 10) - 1)
      const currentDailyUsage = newSettings.dailyUsageValues?.[dayIndex] || newSettings.dailyUsage

      console.log(
        `${i + 1}일차 (${item.date}): 아침재고=${currentMorningStock.toFixed(2)}, 일일사용량=${currentDailyUsage}, 입고대수=${deliveryCount}, 입고량=${deliveryQuantity}`,
      )

      // 통합 재고 계산 함수 사용 - factor 적용
      const stockParams: DayStockParams = {
        morningStock: currentMorningStock,
        deliveryTimes,
        deliveryCount,
        deliveryAmount: deliveryQuantity * newSettings.conversionRate, // factor 적용
        dailyUsage: currentDailyUsage,
        conversionRate: 1, // 이미 변환된 값이므로 1로 설정
      }

      const { preDeliveryStocks, postDeliveryStocks, eveningStock, nightDeliveries } = calculateDayStocks(stockParams)

      console.log(
        `${i + 1}일차 결과: 저녁재고=${eveningStock.toFixed(2)}, 야간입고=${nightDeliveries.toFixed(2)}, 입고전재고=[${preDeliveryStocks
          .map((s) => s.toFixed(2))
          .join(", ")}], 입고후재고=[${postDeliveryStocks.map((s) => s.toFixed(2)).join(", ")}]`,
      )

      // 업데이트
      const updateData = {
        morning_stock: currentMorningStock,
        pre_delivery_stocks: preDeliveryStocks,
        post_delivery_stocks: postDeliveryStocks,
        evening_stock: eveningStock,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase.from("bio_chemical_plan").update(updateData).eq("id", item.id)

      if (updateError) {
        console.error(`항목 ${item.id} 업데이트 오류:`, updateError)
        return false
      }

      // 다음 날 계산을 위해 저장
      previousEveningStock = eveningStock
      previousNightDeliveries = nightDeliveries
    }

    console.log(`${data.length}개 항목 재계산 완료`)
    return true
  } catch (error) {
    console.error("recalculateStocksWithNewSettings 오류:", error)
    return false
  }
}

// 데이터 변환 함수 앞에 첨부파일 URL 파싱 함수 추가

// 첨부파일 URL 파싱 함수 - 이중 배열 형태 처리
function parseAttachmentUrls(attachment: any): string[] {
  console.log("Parsing attachment:", attachment, "Type:", typeof attachment)

  if (!attachment) return []

  // 이미 배열인 경우
  if (Array.isArray(attachment)) {
    // 이중 배열인 경우 ([["url1", "url2"]])
    if (attachment.length > 0 && Array.isArray(attachment[0])) {
      const flatUrls = attachment.flat().filter((url) => url && typeof url === "string" && url.trim() !== "")
      console.log("Double array flattened:", flatUrls)
      return flatUrls
    }
    // 단일 배열인 경우 (["url1", "url2"])
    const filtered = attachment.filter((url) => url && typeof url === "string" && url.trim() !== "")
    console.log("Single array filtered:", filtered)
    return filtered
  }

  // 문자열인 경우
  if (typeof attachment === "string") {
    const trimmed = attachment.trim()
    if (!trimmed) return []

    try {
      // JSON 배열 문자열인 경우 파싱
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const parsed = JSON.parse(trimmed)

        // 이중 배열인 경우
        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
          const flatUrls = parsed.flat().filter((url) => url && typeof url === "string" && url.trim() !== "")
          console.log("JSON double array parsed and flattened:", flatUrls)
          return flatUrls
        }

        // 단일 배열인 경우
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((url) => url && typeof url === "string" && url.trim() !== "")
          console.log("JSON single array parsed and filtered:", filtered)
          return filtered
        }
      }

      // 쉼표로 구분된 URL 문자열인 경우
      if (trimmed.includes(",")) {
        const urls = trimmed
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url !== "")
        console.log("Comma separated URLs:", urls)
        return urls
      }

      // 단일 URL 문자열
      console.log("Single URL:", [trimmed])
      return [trimmed]
    } catch (error) {
      console.error("Error parsing attachment string:", error, "Original:", trimmed)
      // JSON 파싱 실패 시 원본 문자열을 단일 URL로 반환
      return [trimmed]
    }
  }

  console.log("Unknown attachment type, returning empty array")
  return []
}

// convertToDeliveryDetail 함수 수정
function convertToDeliveryDetail(item: any, productName: string): DeliveryDetailWithStatus {
  const attachment1 = parseAttachmentUrls(item.attachments_1)
  const attachment2 = parseAttachmentUrls(item.attachments_2)

  console.log("Final parsed attachments for item", item.id, {
    attachment1,
    attachment2,
    original_attachments_1: item.attachments_1,
    original_attachments_2: item.attachments_2,
  })

  return {
    id: item.id,
    date: item.date,
    plant: item.plant?.toLowerCase() || "bio1",
    productName: productName,
    morningStock: item.morning_stock || 0,
    eveningStock: item.evening_stock || 0,
    deliveryCount: item.delivery_count || 0,
    deliveryTimes: item.delivery_times || [],
    oldDeliveryTimes: item.old_delivery_times || [], // old_delivery_times 필드 추가
    preDeliveryStock: item.pre_delivery_stocks || [],
    postDeliveryStock: item.post_delivery_stocks || [],
    status: item.status || "sent",
    companyId: Number.parseInt(item.company_id) || 0,
    deliveryAmount: item.delivery_quantity || 0,
    deliveryQuantity: item.delivery_quantity || 0,
    note: item.note || "",
    attachments: item.attachments || [],
    drivers: item.drivers || [],
    attachment1: attachment1,
    attachment2: attachment2,
    // 원본 데이터도 보존
    attachments_1: item.attachments_1,
    attachments_2: item.attachments_2,
  }
}
