import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabaseClient'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

/**
 * 服务端 Supabase 客户端
 * 使用 Service Role Key，绕过 RLS
 * ⚠️ 仅在服务端（API 路由）使用，不要暴露给前端
 */
export const supabaseServer = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

/**
 * 检查是否配置了 Service Role Key
 */
export function hasServiceRoleKey(): boolean {
  return !!supabaseServiceKey
}

/**
 * 获取服务端客户端（如果未配置则抛出错误）
 */
export function getServerClient() {
  if (!supabaseServer) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY not configured. ' +
      'Please add it to .env.local or disable RLS in Supabase. ' +
      'See RLS_SETUP_GUIDE.md for details.'
    )
  }
  return supabaseServer
}
