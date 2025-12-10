"use client"

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// 浏览器端 Supabase 客户端
// 使用 NEXT_PUBLIC_ 前缀的环境变量可以在客户端访问
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查是否在 Supabase 模式下
const isSupabaseMode = process.env.NEXT_PUBLIC_DATABASE_MODE === 'supabase' || 
  process.env.DATABASE_MODE === 'supabase'

// 检查 Supabase 配置是否可用
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// 创建一个懒加载的 Supabase 客户端
let _supabaseBrowser: SupabaseClient<Database> | null = null

/**
 * 获取 Supabase 浏览器客户端
 * 在 local 模式下返回 null，避免初始化错误
 */
export function getSupabaseBrowser(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null
  }
  
  if (!_supabaseBrowser) {
    _supabaseBrowser = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  
  return _supabaseBrowser
}

/**
 * 导出 Supabase 客户端（向后兼容）
 * 注意：在 local 模式下使用此导出会抛出错误
 * 推荐使用 getSupabaseBrowser() 并检查返回值
 */
export const supabaseBrowser: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getSupabaseBrowser()
    if (!client) {
      // 在 local 模式下，如果尝试使用 Supabase 客户端，给出明确的错误提示
      if (prop === 'storage' || prop === 'auth' || prop === 'from') {
        throw new Error(
          `Supabase client is not available in local mode. ` +
          `Set DATABASE_MODE=supabase and configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase features.`
        )
      }
      // 对于其他属性，返回 undefined
      return undefined
    }
    return (client as any)[prop]
  }
})
