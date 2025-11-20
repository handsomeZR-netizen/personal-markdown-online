import { z } from "zod"

/**
 * 笔记相关的验证 schema
 */

// 创建笔记验证
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, "标题不能为空")
    .max(200, "标题不能超过200个字符")
    .trim(),
  content: z
    .string()
    .max(100000, "内容不能超过100000个字符"),
  tagIds: z
    .array(z.string().cuid("无效的标签ID"))
    .max(10, "最多只能选择10个标签")
    .optional(),
  categoryId: z
    .string()
    .cuid("无效的分类ID")
    .optional(),
})

// 更新笔记验证
export const updateNoteSchema = z.object({
  id: z.string().cuid("无效的笔记ID"),
  title: z
    .string()
    .min(1, "标题不能为空")
    .max(200, "标题不能超过200个字符")
    .trim()
    .optional(),
  content: z
    .string()
    .max(100000, "内容不能超过100000个字符")
    .optional(),
  tagIds: z
    .array(z.string().cuid("无效的标签ID"))
    .max(10, "最多只能选择10个标签")
    .optional(),
  categoryId: z
    .string()
    .cuid("无效的分类ID")
    .nullable()
    .optional(),
})

// 删除笔记验证
export const deleteNoteSchema = z.object({
  id: z.string().cuid("无效的笔记ID"),
})

// 获取笔记列表验证
export const getNotesSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  tagIds: z.array(z.string().cuid()).optional(),
  categoryId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
})

// 搜索笔记验证
export const searchNotesSchema = z.object({
  query: z
    .string()
    .min(1, "搜索关键词不能为空")
    .max(200, "搜索关键词不能超过200个字符"),
  tagIds: z.array(z.string().cuid()).optional(),
  categoryId: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
})

// 类型导出
export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>
export type GetNotesInput = z.infer<typeof getNotesSchema>
export type SearchNotesInput = z.infer<typeof searchNotesSchema>

// 向后兼容的导出
export const noteSchema = createNoteSchema
export type NoteFormData = CreateNoteInput
