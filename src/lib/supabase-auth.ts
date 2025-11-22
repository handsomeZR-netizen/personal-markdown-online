import { supabase } from './supabaseClient'
import { supabaseServer } from './supabase-server'
import bcrypt from 'bcryptjs'

// 优先使用服务端客户端（绕过 RLS），否则使用普通客户端
const db = (supabaseServer || supabase) as typeof supabase

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface SignInData {
  email: string
  password: string
}

/**
 * 用户注册
 */
export async function signUp({ email, password, name }: SignUpData) {
  try {
    // 1. 检查用户是否已存在
    const { data: existingUser } = await db
      .from('User')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { error: 'User already exists' }
    }

    // 2. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. 创建用户
    const { data: user, error } = await db
      .from('User')
      .insert({
        email,
        password: hashedPassword,
        name: name || null,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    return { data: user }
  } catch (error) {
    console.error('Sign up error:', error)
    return { error: 'Failed to sign up' }
  }
}

/**
 * 用户登录
 */
export async function signIn({ email, password }: SignInData) {
  try {
    // 1. 查找用户
    const { data: user, error } = await db
      .from('User')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return { error: 'Invalid credentials' }
    }

    // 2. 验证密码
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return { error: 'Invalid credentials' }
    }

    // 3. 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user
    return { data: userWithoutPassword }
  } catch (error) {
    console.error('Sign in error:', error)
    return { error: 'Failed to sign in' }
  }
}

/**
 * 根据 ID 获取用户
 */
export async function getUserById(id: string) {
  const { data, error } = await db
    .from('User')
    .select('id, email, name, createdAt, updatedAt')
    .eq('id', id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

/**
 * 根据 email 获取用户
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await db
    .from('User')
    .select('id, email, name, createdAt, updatedAt')
    .eq('email', email)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}
