import { NextResponse } from "next/server"
import { signUp } from "@/lib/supabase-auth"
import { z } from "zod"

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    name: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        console.log("收到注册请求")
        const body = await req.json()
        console.log("请求体:", body)
        
        const { email, password, name } = registerSchema.parse(body)
        console.log("验证通过:", { email, name })

        // 使用 Supabase SDK 注册用户
        const { data: user, error } = await signUp({
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
        return NextResponse.json({
            message: "服务器错误",
            error: error.message || "Unknown error"
        }, { status: 500 })
    }
}
