import { create } from "zustand"
import {
  loadFinalDeliveryDetails as loadFinalDeliveryDetailsService,
  saveDispatchPlan,
  updateDispatchPlan as updateDispatchPlanService,
  deleteDispatchPlan as deleteDispatchPlanService,
  requestCancelDispatchPlan as requestCancelDispatchPlanService,
} from "./dispatch-service"

// 타입 정의들
export interface DeliveryDetailWithStatus {
  id?: string
  date: string
  companyId?: number
  status: "draft" | "sent" | "confirmed" | "modify" | "done" | "cancelrequest" | "cancel"
  deliveryCount: number
  deliveryTimes: string[]
  oldDeliveryTimes?: string[]
  morningStock: number
  eveningStock: number
  preDeliveryStock: number[]
  postDeliveryStock: number[]
  productName?: string
  note?: string
  deliveryQuantity?: number
  deliveryAmount?: number
  drivers?: string[]
  attachment1?: string[]
  attachment2?: string[]
  plant: string
}

export interface DispatchSettings {
  plant: string
  deliveryAmount: number
  dailyUsage: number
  morningStock: number
  productName: string
}

export interface SimulationResult {
  deliveryDetails: DeliveryDetailWithStatus[]
  summary: {
    totalDays: number
    totalDeliveries: number
    averageStock: number
  }
}

interface DispatchStore {
  // Final 페이지용 상태
  finalDeliveryDetails: DeliveryDetailWithStatus[]
  settings: DispatchSettings | null
  loading: boolean
  error: string | null

  // Draft 페이지용 상태
  result: SimulationResult | null
  activeTab: string

  // Final 페이지용 액션
  loadFinalDeliveryDetails: (plant: string, productName: string) => Promise<void>
  returnToFinal: (id: string, productName?: string, plant?: string) => Promise<boolean>
  removeFromFinal: (id: string, productName?: string, plant?: string) => Promise<boolean>
  requestCancel: (id: string, productName?: string, plant?: string) => Promise<boolean>

  // Draft 페이지용 액션
  setSettings: (settings: DispatchSettings) => void
  setResult: (result: SimulationResult | null) => void
  setActiveTab: (tab: string) => void
  addToFinal: (plans: DeliveryDetailWithStatus[], companies?: any[]) => Promise<string[]>
  updateDeliveryStatus: (
    id: string,
    updates: Partial<DeliveryDetailWithStatus>,
    productName?: string,
    plant?: string,
  ) => Promise<boolean>
  deleteDraftRows: (ids: string[], productName?: string, plant?: string) => Promise<boolean>
}

export const useDispatchStore = create<DispatchStore>((set, get) => ({
  // 초기 상태
  finalDeliveryDetails: [],
  settings: null,
  loading: false,
  error: null,
  result: null,
  activeTab: "table",

  // Final 페이지용 액션들
  loadFinalDeliveryDetails: async (plant: string, productName: string) => {
    set({ loading: true, error: null })
    try {
      const result = await loadFinalDeliveryDetailsService(plant, productName)
      if (result.success) {
        set({ finalDeliveryDetails: result.data, loading: false })
      } else {
        set({ error: result.error || "데이터 로드 실패", loading: false })
      }
    } catch (error) {
      console.error("Final 배차 계획 로드 중 오류:", error)
      set({
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        loading: false,
      })
    }
  },

  returnToFinal: async (id: string, productName?: string, plant?: string) => {
    try {
      const success = await deleteDispatchPlanService(id, plant, productName)
      if (success && productName) {
        // 데이터 새로고침
        await get().loadFinalDeliveryDetails(plant || "bio1", productName)
      }
      return success
    } catch (error) {
      console.error("Final로 되돌리기 중 오류:", error)
      return false
    }
  },

  removeFromFinal: async (id: string, productName?: string, plant?: string) => {
    try {
      const success = await deleteDispatchPlanService(id, plant, productName)
      if (success && productName) {
        // 데이터 새로고침
        await get().loadFinalDeliveryDetails(plant || "bio1", productName)
      }
      return success
    } catch (error) {
      console.error("Final에서 제거 중 오류:", error)
      return false
    }
  },

  requestCancel: async (id: string, productName?: string, plant?: string) => {
    try {
      const success = await requestCancelDispatchPlanService(id, plant, productName)
      if (success && productName) {
        // 데이터 새로고침
        await get().loadFinalDeliveryDetails(plant || "bio1", productName)
      }
      return success
    } catch (error) {
      console.error("취소 요청 중 오류:", error)
      return false
    }
  },

  // Draft 페이지용 액션들
  setSettings: (settings: DispatchSettings) => {
    set({ settings })
  },

  setResult: (result: SimulationResult | null) => {
    set({ result })
  },

  setActiveTab: (tab: string) => {
    set({ activeTab: tab })
  },

  addToFinal: async (plans: DeliveryDetailWithStatus[], companies?: any[]) => {
    const savedIds: string[] = []

    try {
      for (const plan of plans) {
        const savedId = await saveDispatchPlan(plan, companies)
        if (savedId) {
          savedIds.push(savedId)
        }
      }
      return savedIds
    } catch (error) {
      console.error("Final로 추가 중 오류:", error)
      return []
    }
  },

  updateDeliveryStatus: async (
    id: string,
    updates: Partial<DeliveryDetailWithStatus>,
    productName?: string,
    plant?: string,
  ) => {
    try {
      return await updateDispatchPlanService(id, updates, plant, productName)
    } catch (error) {
      console.error("배차 상태 업데이트 중 오류:", error)
      return false
    }
  },

  // Draft 행 삭제는 실제로는 사용되지 않음 (로컬 상태에서만 처리)
  deleteDraftRows: async (ids: string[], productName?: string, plant?: string) => {
    // Draft 행들은 데이터베이스에 저장되지 않은 시뮬레이션 결과이므로
    // 실제로는 이 함수가 호출되지 않아야 함
    console.warn("deleteDraftRows called for draft rows - this should be handled locally")
    return true
  },
}))
