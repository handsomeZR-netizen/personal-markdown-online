import { createClient } from '@supabase/supabase-js'

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 类型定义（可选，根据你的数据库结构调整）
export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          title: string
          content: string
          userId: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          userId: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          userId?: string
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}
