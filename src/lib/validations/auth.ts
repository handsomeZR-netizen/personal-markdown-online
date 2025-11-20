import { z } from "zod"

/**
 * 认证相关的验证 schema
 */

// 登录表单验证
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "邮箱不能为空")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(6, "密码至少需要6个字符")
    .max(100, "密码不能超过100个字符"),
})

// 注册表单验证
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "姓名至少需要2个字符")
    .max(50, "姓名不能超过50个字符")
    .optional(),
  email: z
    .string()
    .min(1, "邮箱不能为空")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(6, "密码至少需要6个字符")
    .max(100, "密码不能超过100个字符")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "密码必须包含大小写字母和数字"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

// 类型导出
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
