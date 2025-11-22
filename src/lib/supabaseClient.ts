import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          password: string
          name: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          name?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          name?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Note: {
        Row: {
          id: string
          title: string
          content: string
          summary: string | null
          embedding: string | null
          userId: string
          categoryId: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          summary?: string | null
          embedding?: string | null
          userId: string
          categoryId?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          summary?: string | null
          embedding?: string | null
          userId?: string
          categoryId?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      Tag: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      Category: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
    }
  }
}
