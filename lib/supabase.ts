import { createClient } from "@supabase/supabase-js"

// Get Supabase URL and keys from environment variables with fallbacks
const getSupabaseUrl = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
}

const getSupabaseAnonKey = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
}

const getSupabaseServiceKey = () => {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

// Validate environment variables
const validateSupabaseConfig = (url: string, key: string, context: string) => {
  if (!url) {
    throw new Error(
      `[Supabase ${context}] Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.`,
    )
  }
  if (!key) {
    throw new Error(`[Supabase ${context}] Missing Supabase key. Please set the appropriate key environment variable.`)
  }
}

// 클라이언트 사이드에서 사용할 Supabase 클라이언트 (싱글톤 패턴)
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()

    validateSupabaseConfig(supabaseUrl, supabaseAnonKey, "Client")

    console.log("[Supabase] Creating client instance with URL:", supabaseUrl)
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// 서버 사이드에서 사용할 Supabase 클라이언트 (서버 액션용)
export const createServerSupabaseClient = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceKey() || getSupabaseAnonKey()

  validateSupabaseConfig(url, key, "Server")

  console.log("[Supabase] Creating server client instance with URL:", url)

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

// 기존 코드와의 호환성을 위해 supabase 객체 노출
// 하지만 lazy initialization을 위해 getter 함수 사용
export const supabase = getSupabaseClient()
