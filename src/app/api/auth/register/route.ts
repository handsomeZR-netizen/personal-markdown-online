import { NextResponse } from "next/server"
import { getAuthAdapter } from "@/lib/auth/auth-adapter"
import { z } from "zod"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        console.log("收到注册请求")
        const body = await req.json()
        console.log("请求体:", { email: body.email, name: body.name })
        
        const { email, password, name } = registerSchema.parse(body)
        console.log("验证通过:", { email, name })

        // 使用统一的认证适配器（自动选择 Prisma 或 Supabase）
        const authAdapter = getAuthAdapter()
        const { data: user, error } = await authAdapter.signUp({
            email,
            password,
            name,
        })

        if (error) {
            console.log("注册失败:", error)
            return NextResponse.json(
                { message: error === 'User already exists' ? "该邮箱已被注册" : "注册失败，请稍后重试" },
                { status: 400 }
            )
        }

        console.log("用户创建成功:", user?.id)

        return NextResponse.json(user, { status: 201 })
    } catch (error: any) {
        console.error("注册失败 - 详细错误:", error)
        
        // Zod 验证错误
        if (error.name === 'ZodError') {
            return NextResponse.json({
                message: "输入数据格式错误",
                errors: error.errors
            }, { status: 400 })
        }
        
        return NextResponse.json({
            message: "服务器错误",
            error: error.message || "Unknown error"
        }, { status: 500 })
    }
}
