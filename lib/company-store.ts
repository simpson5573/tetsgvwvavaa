import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  fetchCompanies,
  saveCompany,
  updateCompanyInfo as updateCompany,
  deleteCompanyInfo as deleteCompany,
  migrateCompaniesToSupabase,
} from "./company-service"
import { setDefaultCompany as setDefaultCompanyAction } from "./company-actions"

export interface Company {
  id: number
  name: string
  contact: string[] // string에서 string[]로 변경
  phone: string[] // string에서 string[]로 변경
  price: number
  notes: string
  productName: string
  isDefault?: boolean
  plant?: string // 'bio1' 또는 'bio2'
  pin?: string // PIN 필드 추가
}

interface CompanyState {
  companies: Company[]
  loading: boolean
  error: string | null
  addCompany: (company: Omit<Company, "id">) => Promise<void>
  updateCompany: (id: number, company: Partial<Company>) => Promise<void>
  deleteCompany: (id: number) => Promise<void>
  setDefaultCompany: (id: number, productName: string) => Promise<void>
  getDefaultCompany: (productName: string) => Company | undefined
  loadCompanies: () => Promise<void>
  migrateToSupabase: () => Promise<{ success: boolean; message: string }>
}

// 초기 회사 데이터 (마이그레이션용)
const initialCompanies: Company[] = [
  {
    id: 1,
    name: "바이오매스 공급 주식회사",
    contact: ["김철수"],
    phone: ["010-1234-5678"],
    price: 125000,
    notes: "주 2회 납품, 품질 A급",
    productName: "유동사",
    isDefault: true,
    pin: "A001",
  },
  {
    id: 2,
    name: "그린에너지 솔루션",
    contact: ["박영희"],
    phone: ["010-9876-5432"],
    price: 118000,
    notes: "월 계약, 3일 전 발주 필요",
    productName: "유동사",
    pin: "A002",
  },
  {
    id: 3,
    name: "에코바이오 시스템",
    contact: ["이민수"],
    phone: ["010-5555-7777"],
    price: 130000,
    notes: "긴급 납품 가능, 추가 비용 발생",
    productName: "유동사",
    pin: "A003",
  },
  {
    id: 4,
    name: "자연에너지 코퍼레이션",
    contact: ["정지영"],
    phone: ["010-2222-3333"],
    price: 122000,
    notes: "품질 관리 우수, ISO 인증",
    productName: "고령토",
    isDefault: true,
    pin: "B001",
  },
  {
    id: 5,
    name: "바이오플랜트 시스템즈",
    contact: ["최동욱"],
    phone: ["010-8888-9999"],
    price: 127000,
    notes: "대량 납품 할인 가능",
    productName: "고령토",
    pin: "B002",
  },
  {
    id: 6,
    name: "케미칼 솔루션",
    contact: ["이수진"],
    phone: ["010-3333-4444"],
    price: 95000,
    notes: "요소수 전문 업체",
    productName: "요소수",
    isDefault: true,
    pin: "C001",
  },
  {
    id: 7,
    name: "유니케미칼",
    contact: ["박민호"],
    phone: ["010-5555-6666"],
    price: 98000,
    notes: "품질 보증, 빠른 배송",
    productName: "요소수",
    pin: "C002",
  },
  {
    id: 8,
    name: "암모니아 테크",
    contact: ["김영수"],
    phone: ["010-7777-8888"],
    price: 85000,
    notes: "황산암모늄 전문",
    productName: "황산암모늄",
    isDefault: true,
    pin: "D001",
  },
  {
    id: 9,
    name: "화학공업사",
    contact: ["최미영"],
    phone: ["010-9999-0000"],
    price: 88000,
    notes: "대량 주문 할인",
    productName: "황산암모늄",
    pin: "D002",
  },
  {
    id: 10,
    name: "라임 코퍼레이션",
    contact: ["정태현"],
    phone: ["010-1111-2222"],
    price: 75000,
    notes: "소석회 품질 최고급",
    productName: "소석회",
    isDefault: true,
    pin: "E001",
  },
  {
    id: 11,
    name: "석회산업",
    contact: ["한지원"],
    phone: ["010-3333-5555"],
    price: 72000,
    notes: "안정적 공급",
    productName: "소석회",
    pin: "E002",
  },
  {
    id: 12,
    name: "소다 케미칼",
    contact: ["윤성호"],
    phone: ["010-6666-7777"],
    price: 105000,
    notes: "중탄산나트륨 전문 제조",
    productName: "중탄산나트륨",
    isDefault: true,
    pin: "F001",
  },
  {
    id: 13,
    name: "나트륨 솔루션",
    contact: ["강혜진"],
    phone: ["010-8888-1111"],
    price: 108000,
    notes: "고순도 제품",
    productName: "중탄산나트륨",
    pin: "F002",
  },
]

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      companies: [...initialCompanies],
      loading: false,
      error: null,

      // 회사 정보 로드
      loadCompanies: async () => {
        set({ loading: true, error: null })
        try {
          const companies = await fetchCompanies()
          if (companies.length > 0) {
            set({ companies })
          }
          set({ loading: false })
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "회사 정보를 불러오는 중 오류가 발생했습니다.",
          })
        }
      },

      // 회사 추가
      addCompany: async (company) => {
        set({ loading: true, error: null })
        try {
          const newCompany = await saveCompany(company)
          if (newCompany) {
            set((state) => ({
              companies: [...state.companies, newCompany],
              loading: false,
            }))
          } else {
            throw new Error("회사 정보를 저장하는 데 실패했습니다.")
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "회사 정보를 저장하는 중 오류가 발생했습니다.",
          })
        }
      },

      // 회사 정보 업데이트
      updateCompany: async (id, updatedCompany) => {
        set({ loading: true, error: null })
        try {
          const success = await updateCompany(id, updatedCompany)
          if (success) {
            set((state) => ({
              companies: state.companies.map((company) =>
                company.id === id ? { ...company, ...updatedCompany } : company,
              ),
              loading: false,
            }))
          } else {
            throw new Error("회사 정보를 업데이트하는 데 실패했습니다.")
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "회사 정보를 업데이트하는 중 오류가 발생했습니다.",
          })
        }
      },

      // 회사 삭제
      deleteCompany: async (id) => {
        set({ loading: true, error: null })
        try {
          const success = await deleteCompany(id)
          if (success) {
            set((state) => ({
              companies: state.companies.filter((company) => company.id !== id),
              loading: false,
            }))
          } else {
            throw new Error("회사 정보를 삭제하는 데 실패했습니다.")
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "회사 정보를 삭제하는 중 오류가 발생했습니다.",
          })
        }
      },

      // 기본 회사 설정 - 오류 처리 개선
      setDefaultCompany: async (id: number, productName: string) => {
        set({ loading: true, error: null })
        try {
          console.log(`[Store] Setting default company: ID=${id}, Product=${productName}`)

          const success = await setDefaultCompanyAction(id, productName)

          if (success) {
            // 서버 액션이 성공했으면 로컬 상태도 업데이트
            set((state) => ({
              companies: state.companies.map((company) => ({
                ...company,
                isDefault:
                  company.id === id && company.productName === productName
                    ? true
                    : company.productName === productName
                      ? false
                      : company.isDefault,
              })),
              loading: false,
            }))

            console.log(`[Store] Successfully updated local state for default company`)
            return true
          } else {
            throw new Error("서버 액션에서 기본 회사 설정에 실패했습니다.")
          }
        } catch (error) {
          console.error("[Store] Error setting default company:", error)
          set({
            loading: false,
            error: error instanceof Error ? error.message : "기본 회사 설정 중 오류가 발생했습니다.",
          })
          return false
        }
      },

      // 기본 회사 가져오기
      getDefaultCompany: (productName) => {
        const companies = get().companies
        return companies.find((company) => company.productName === productName && company.isDefault)
      },

      // 로컬 데이터를 Supabase로 마이그레이션
      migrateToSupabase: async () => {
        set({ loading: true, error: null })
        try {
          const result = await migrateCompaniesToSupabase(get().companies)
          set({ loading: false })
          return result
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "마이그레이션 중 오류가 발생했습니다.",
          })
          return {
            success: false,
            message: error instanceof Error ? error.message : "마이그레이션 중 오류가 발생했습니다.",
          }
        }
      },
    }),
    {
      name: "company-storage",
    },
  ),
)
