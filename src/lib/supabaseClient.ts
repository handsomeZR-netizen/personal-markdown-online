import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const databaseMode = process.env.DATABASE_MODE || 'local'

// Only throw error if in Supabase mode and credentials are missing
if (databaseMode === 'supabase' && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables in Supabase mode')
}

// Create a dummy client for local mode to prevent import errors
// In local mode, this client should not be used
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

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
