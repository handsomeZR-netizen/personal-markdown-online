"use client"

import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// 浏览器端 Supabase 客户端
// 使用 NEXT_PUBLIC_ 前缀的环境变量可以在客户端访问
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
