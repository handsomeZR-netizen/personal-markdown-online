import { z } from 'zod';

/**
 * Validation schemas for folder operations
 */

export const createFolderSchema = z.object({
  name: z.string().min(1, '文件夹名称不能为空').max(255, '文件夹名称过长'),
  parentId: z.string().optional().nullable(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1, '文件夹名称不能为空').max(255, '文件夹名称过长').optional(),
  parentId: z.string().optional().nullable(),
});

export const deleteFolderSchema = z.object({
  id: z.string().cuid('无效的文件夹 ID'),
});

export const getFolderSchema = z.object({
  id: z.string().cuid('无效的文件夹 ID'),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
export type GetFolderInput = z.infer<typeof getFolderSchema>;
