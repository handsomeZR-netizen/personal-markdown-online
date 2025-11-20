"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "@/lib/validations/auth"
import { validateData } from "@/lib/validation-utils"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

/**
 * 用户注册
 */
export async function registerUser(data: unknown): Promise<ActionResult<{ userId: string }>> {
  try {
    console.log("开始注册流程，接收到的数据:", data)
    
    // 服务端验证
    const validation = validateData(registerSchema, data)
    if (!validation.success) {
      console.log("验证失败:", validation)
      return validation
    }

    const { name, email, password } = validation.data
    console.log("验证通过，准备创建用户:", { name, email })

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log("邮箱已存在:", email)
      return {
        success: false,
        error: "该邮箱已被注册",
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("密码加密完成")

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    console.log("用户创建成功:", user.id)
    return {
      success: true,
      data: { userId: user.id },
    }
  } catch (error) {
    console.error("注册失败 - 详细错误:", error)
    console.error("错误堆栈:", error instanceof Error ? error.stack : "无堆栈信息")
    return {
      success: false,
      error: "注册失败，请稍后重试",
    }
  }
}

/**
 * 用户登录
 */
export async function loginUser(data: unknown): Promise<ActionResult> {
  try {
    // 服务端验证
    const validation = validateData(loginSchema, data)
    if (!validation.success) {
      return validation
    }

    const { email, password } = validation.data

    // 使用 NextAuth 登录
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: "邮箱或密码错误",
      }
    }
    
    console.error("登录失败:", error)
    return {
      success: false,
      error: "登录失败，请稍后重试",
    }
  }
}
