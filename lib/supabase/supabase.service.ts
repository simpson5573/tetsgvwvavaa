import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const getSupabaseUrl = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
}

const getSupabaseAnonKey = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ""
}

export const createClient = () => {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl) {
    throw new Error(
      "[Supabase Service] Missing Supabase URL. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.",
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "[Supabase Service] Missing Supabase anon key. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY environment variable.",
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Also export as default for compatibility
export default createClient
