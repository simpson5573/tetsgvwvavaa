import { supabase } from "./supabase"

// 입고이력 데이터 타입
export interface WeightHistoryRecord {
  id: string
  plant: string
  chemical: string
  io_gb: string
  paper_no: string
  company: string
  chemical_name: string
  chemical_id: string
  car_no: string
  first_time: string
  first_weight: number
  second_time: string
  second_weight: number
  real_weight: number
  seq_no: number
  created_at: string
  updated_at: string
}

// 누적 사용량 데이터 타입
export interface CumulativeUsageRecord {
  date: string
  chemical: string
  chemical_name: string
  total_weight: number
  usage_amount: number // 추후 구현 예정
}

// 필터 타입
export interface WeightHistoryFilters {
  year?: string
  month?: string
  companyId?: string
  status?: string
  productName?: string
}

// 입고이력 데이터 조회
export async function fetchWeightHistory(
  plant: string,
  filters?: WeightHistoryFilters,
): Promise<WeightHistoryRecord[]> {
  try {
    console.log(`=== 입고이력 조회 디버깅 시작 ===`)
    console.log(`요청된 Plant: "${plant}"`)
    console.log(`필터:`, filters)

    // 1단계: 전체 테이블 데이터 확인
    console.log(`1단계: 전체 테이블 데이터 상세 확인`)
    const { data: allData, error: allError } = await supabase.from("bio_weight_history").select("*").limit(10)

    if (allError) {
      console.error(`전체 데이터 조회 오류:`, allError)
    } else {
      console.log(`전체 데이터 개수: ${allData?.length || 0}`)
      if (allData && allData.length === 0) {
        console.log(`테이블에 데이터가 없습니다!`)
        return []
      }
    }

    // 2단계: 실제 데이터 조회 쿼리 실행
    console.log(`2단계: 실제 조회 쿼리 실행`)

    let query = supabase
      .from("bio_weight_history")
      .select("*")
      .eq("plant", plant)
      .eq("io_gb", "입고")
      .order("first_time", { ascending: false })

    // 필터 적용
    if (filters?.year && filters.year !== "") {
      const startDate = `${filters.year}-01-01`
      const endDate = `${filters.year}-12-31`
      query = query.gte("first_time", startDate).lte("first_time", endDate)
    }

    if (filters?.month && filters.month !== "") {
      const year = filters.year || new Date().getFullYear().toString()
      const startDate = `${year}-${filters.month.padStart(2, "0")}-01`
      const lastDay = new Date(Number.parseInt(year), Number.parseInt(filters.month), 0).getDate()
      const endDate = `${year}-${filters.month.padStart(2, "0")}-${lastDay}`
      query = query.gte("first_time", startDate).lte("first_time", endDate)
    }

    if (filters?.companyId && filters.companyId !== "") {
      // company 필드로 필터링 (companyId는 실제 company 이름으로 매핑 필요)
      // 현재는 company 이름으로 직접 필터링
      query = query.eq("company", filters.companyId)
    }

    if (filters?.productName && filters.productName !== "") {
      // chemical_name으로 필터링
      query = query.eq("chemical_name", filters.productName)
    }

    const { data, error } = await query

    if (error) {
      console.error("입고이력 조회 오류:", error)
      return []
    }

    console.log(`조회된 데이터 개수: ${data?.length || 0}`)

    if (data && data.length > 0) {
      console.log(`조회 성공 - 첫 번째 레코드:`, data[0])
    }

    return data || []
  } catch (error) {
    console.error("입고이력 조회 중 예외 발생:", error)
    return []
  }
}

// 누적 사용량 데이터 조회
export async function fetchCumulativeUsage(
  plant: string,
  filters?: WeightHistoryFilters,
): Promise<CumulativeUsageRecord[]> {
  try {
    console.log(`=== 누적 사용량 조회 디버깅 시작 ===`)
    console.log(`요청된 Plant: "${plant}"`)
    console.log(`필터:`, filters)

    let query = supabase
      .from("bio_weight_history")
      .select("first_time, chemical, chemical_name, real_weight")
      .eq("plant", plant)
      .eq("io_gb", "입고")
      .order("first_time", { ascending: false })

    // 필터 적용
    if (filters?.year && filters.year !== "") {
      const startDate = `${filters.year}-01-01`
      const endDate = `${filters.year}-12-31`
      query = query.gte("first_time", startDate).lte("first_time", endDate)
    }

    if (filters?.month && filters.month !== "") {
      const year = filters.year || new Date().getFullYear().toString()
      const startDate = `${year}-${filters.month.padStart(2, "0")}-01`
      const lastDay = new Date(Number.parseInt(year), Number.parseInt(filters.month), 0).getDate()
      const endDate = `${year}-${filters.month.padStart(2, "0")}-${lastDay}`
      query = query.gte("first_time", startDate).lte("first_time", endDate)
    }

    if (filters?.productName && filters.productName !== "") {
      query = query.eq("chemical_name", filters.productName)
    }

    const { data, error } = await query

    if (error) {
      console.error("누적 사용량 조회 오류:", error)
      return []
    }

    if (!data || data.length === 0) {
      console.log("누적 사용량 데이터가 없습니다.")
      return []
    }

    // 날짜별, 약품별로 그룹화하여 합계 계산
    const groupedData = data.reduce(
      (acc, item) => {
        const date = item.first_time.split("T")[0] // YYYY-MM-DD 형식으로 날짜 추출
        const key = `${date}-${item.chemical}`

        if (!acc[key]) {
          acc[key] = {
            date,
            chemical: item.chemical,
            chemical_name: item.chemical_name,
            total_weight: 0,
            usage_amount: 0, // 추후 구현 예정
          }
        }

        acc[key].total_weight += item.real_weight || 0
        return acc
      },
      {} as Record<string, CumulativeUsageRecord>,
    )

    const result = Object.values(groupedData).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log(`누적 사용량 조회 완료: ${result.length}개 항목`)
    return result
  } catch (error) {
    console.error("누적 사용량 조회 중 예외 발생:", error)
    return []
  }
}

// Chemical enum을 품명으로 변환
export function getProductNameFromChemical(chemical: string): string {
  const CHEMICAL_TO_PRODUCT: Record<string, string> = {
    SAND: "유동사",
    KAOLIN: "고령토",
    UREA: "요소수",
    SULFATE: "황산암모늄",
    HYDRATED: "소석회",
    SODIUM: "중탄산나트륨",
  }
  return CHEMICAL_TO_PRODUCT[chemical] || chemical
}

// 시간 포맷팅 함수
export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch (error) {
    console.error("시간 포맷팅 오류:", error)
    return "-"
  }
}
