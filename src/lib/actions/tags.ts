"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { withCache, queryCache } from "@/lib/cache"
import { createTagSchema, type CreateTagInput } from "@/lib/validations/tags"
import { validateData, sanitizeString } from "@/lib/validation-utils"

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

/**
 * 获取所有标签
 * Get all tags
 */
export async function getTags(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
    try {
        const tags = await withCache(
            'tags:all',
            async () => {
                return await prisma.tag.findMany({
                    orderBy: {
                        name: 'asc',
                    },
                })
            },
            300000 // Cache for 5 minutes
        )
        return { success: true, data: tags }
    } catch (error) {
        return { success: false, error: "获取标签列表失败" }
    }
}

/**
 * 创建新标签
 * Create a new tag
 */
export async function createTag(name: string): Promise<ActionResult<{ id: string; name: string }>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "未授权访问" }
    }

    // 清理和验证输入
    const sanitizedName = sanitizeString(name)
    const validation = validateData(createTagSchema, { name: sanitizedName })

    if (!validation.success) {
        return validation
    }

    try {
        // Check if tag already exists
        const existingTag = await prisma.tag.findUnique({
            where: { name: validation.data.name },
        })

        if (existingTag) {
            return { success: true, data: existingTag }
        }

        const { createId } = await import('@paralleldrive/cuid2')
        const tag = await prisma.tag.create({
            data: {
                id: createId(),
                name: validation.data.name,
            },
        })

        // Invalidate tags cache
        queryCache.invalidate('tags:*')

        return { success: true, data: tag }
    } catch (error) {
        return { success: false, error: "创建标签失败" }
    }
}
