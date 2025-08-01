import { supabase } from "./supabase"

export interface BioSetting {
  id?: number
  plant: "bio1" | "bio2"
  product_name: string
  min_level: number
  max_level: number
  delivery_quantity: number
  stock_06: number
  flow: number
  factor?: number // factor 컬럼 추가
  inventory_6am?: number
  created_at?: string
}

// Bio 설정 가져오기
export async function getBioSetting(plant: "bio1" | "bio2", productName: string): Promise<BioSetting | null> {
  try {
    const { data, error } = await supabase
      .from("bio_setting")
      .select("*, inventory_6am, factor") // factor 추가
      .eq("plant", plant)
      .eq("product_name", productName)
      .single()

    if (error) {
      console.error(`Bio 설정 조회 중 오류 (${plant}, ${productName}):`, error)
      return null
    }

    return data
  } catch (error) {
    console.error("Bio 설정 조회 중 오류:", error)
    return null
  }
}

// Bio 설정 업데이트
export async function updateBioSetting(
  plant: "bio1" | "bio2",
  productName: string,
  settings: Partial<BioSetting>,
): Promise<boolean> {
  try {
    const updateData = {
      min_level: settings.min_level,
      max_level: settings.max_level,
      delivery_quantity: settings.delivery_quantity,
      stock_06: settings.stock_06,
      flow: settings.flow,
      factor: settings.factor, // factor 추가
    }

    const { error } = await supabase
      .from("bio_setting")
      .update(updateData)
      .eq("plant", plant)
      .eq("product_name", productName)

    if (error) {
      console.error(`Bio 설정 업데이트 중 오류 (${plant}, ${productName}):`, error)
      return false
    }

    console.log(`Bio 설정 업데이트 성공 (${plant}, ${productName})`)
    return true
  } catch (error) {
    console.error("Bio 설정 업데이트 중 오류:", error)
    return false
  }
}

// Bio 설정 생성 (존재하지 않는 경우)
export async function createBioSetting(setting: BioSetting): Promise<boolean> {
  try {
    const { error } = await supabase.from("bio_setting").insert([
      {
        plant: setting.plant,
        product_name: setting.product_name,
        min_level: setting.min_level,
        max_level: setting.max_level,
        delivery_quantity: setting.delivery_quantity,
        stock_06: setting.stock_06,
        flow: setting.flow,
        factor: setting.factor, // factor 추가
      },
    ])

    if (error) {
      console.error(`Bio 설정 생성 중 오류:`, error)
      return false
    }

    console.log(`Bio 설정 생성 성공 (${setting.plant}, ${setting.product_name})`)
    return true
  } catch (error) {
    console.error("Bio 설정 생성 중 오류:", error)
    return false
  }
}

// Bio 설정 가져오기 또는 기본값으로 생성
export async function getBioSettingOrDefault(plant: "bio1" | "bio2", productName: string): Promise<BioSetting> {
  // 먼저 기존 설정 조회
  const existingSetting = await getBioSetting(plant, productName)

  if (existingSetting) {
    // inventory_6am이 있으면 그것을 stock_06 대신 사용
    if (existingSetting.inventory_6am !== null && existingSetting.inventory_6am !== undefined) {
      existingSetting.stock_06 = existingSetting.inventory_6am
    }

    // factor 값이 없으면 기본값 1 사용
    if (!existingSetting.factor) {
      existingSetting.factor = 1
    }

    return existingSetting
  }

  // 존재하지 않으면 기본값 반환 (DB에는 저장하지 않음)
  const defaultSettings: Record<string, Partial<BioSetting>> = {
    유동사: {
      min_level: 30,
      max_level: 80,
      delivery_quantity: 29,
      stock_06: 50,
      flow: 40,
      factor: 1,
    },
    고령토: {
      min_level: 25,
      max_level: 70,
      delivery_quantity: 30,
      stock_06: 45,
      flow: 35,
      factor: 1,
    },
    요소수: {
      min_level: 1000,
      max_level: 4500,
      delivery_quantity: 20,
      stock_06: 2500,
      flow: 10,
      factor: 1, // mm 단위이지만 환산계수는 1로 설정
    },
    황산암모늄: {
      min_level: 1000,
      max_level: 6000,
      delivery_quantity: 30,
      stock_06: 3000,
      flow: 12,
      factor: 1, // mm 단위이지만 환산계수는 1로 설정
    },
    소석회: {
      min_level: 10,
      max_level: 60,
      delivery_quantity: 30,
      stock_06: 35,
      flow: 14,
      factor: 1,
    },
    중탄산나트륨: {
      min_level: 10,
      max_level: 25,
      delivery_quantity: 30,
      stock_06: 18,
      flow: 20,
      factor: 1,
    },
  }

  const defaultSetting = defaultSettings[productName] || defaultSettings["유동사"]

  return {
    plant,
    product_name: productName,
    min_level: defaultSetting.min_level || 30,
    max_level: defaultSetting.max_level || 80,
    delivery_quantity: defaultSetting.delivery_quantity || 29,
    stock_06: defaultSetting.stock_06 || 50,
    flow: defaultSetting.flow || 40,
    factor: defaultSetting.factor || 1,
  }
}
