import { z } from "zod"
import { cuid } from "./shared"

/**
 * 标签相关的验证 schema
 */

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "标签名称不能为空")
    .max(30, "标签名称不能超过30个字符")
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, "标签名称只能包含中文、字母、数字、下划线和连字符"),
})

export const updateTagSchema = z.object({
  id: cuid("无效的标签ID"),
  name: z
    .string()
    .min(1, "标签名称不能为空")
    .max(30, "标签名称不能超过30个字符")
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, "标签名称只能包含中文、字母、数字、下划线和连字符"),
})

export const deleteTagSchema = z.object({
  id: cuid("无效的标签ID"),
})

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type DeleteTagInput = z.infer<typeof deleteTagSchema>
