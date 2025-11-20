import { z } from "zod"

/**
 * 分类相关的验证 schema
 */

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "分类名称不能为空")
    .max(30, "分类名称不能超过30个字符")
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, "分类名称只能包含中文、字母、数字、下划线和连字符"),
})

export const updateCategorySchema = z.object({
  id: z.string().cuid("无效的分类ID"),
  name: z
    .string()
    .min(1, "分类名称不能为空")
    .max(30, "分类名称不能超过30个字符")
    .regex(/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, "分类名称只能包含中文、字母、数字、下划线和连字符"),
})

export const deleteCategorySchema = z.object({
  id: z.string().cuid("无效的分类ID"),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>
