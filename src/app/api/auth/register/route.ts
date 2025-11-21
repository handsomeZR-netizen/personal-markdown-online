import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        // 🌟 加入环境变量打印
        console.log("ENV DATABASE_URL:", process.env.DATABASE_URL)
        console.log("ENV DIRECT_URL:", process.env.DIRECT_URL)

        console.log("收到注册请求")
        const body = await req.json()
        console.log("请求体:", body)
        
        const { email, password, name } = registerSchema.parse(body)
        console.log("验证通过:", { email, name })

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            console.log("用户已存在:", email)
            return NextResponse.json(
                { message: "该邮箱已被注册" },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        console.log("密码加密完成")

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        })

        console.log("用户创建成功:", user.id)
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword, { status: 201 })
    } catch (error: any) {
        console.error("注册失败 - 详细错误:", error)
        return NextResponse.json({
            message: "服务器错误",
            error: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }, { status: 500 })
    }
}
