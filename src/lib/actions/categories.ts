"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { withCache, queryCache } from "@/lib/cache"
import { createCategorySchema, type CreateCategoryInput } from "@/lib/validations/categories"
import { validateData, sanitizeString } from "@/lib/validation-utils"
import { randomUUID } from "crypto"

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

/**
 * 获取所有分类
 * Get all categories
 */
export async function getCategories(): Promise<ActionResult<Array<{ id: string; name: string }>>> {
    try {
        const categories = await withCache(
            'categories:all',
            async () => {
                return await prisma.category.findMany({
                    orderBy: {
                        name: 'asc',
                    },
                })
            },
            300000 // Cache for 5 minutes
        )
        return { success: true, data: categories }
    } catch (error) {
        return { success: false, error: "获取分类列表失败" }
    }
}

/**
 * 创建新分类
 * Create a new category
 */
export async function createCategory(name: string): Promise<ActionResult<{ id: string; name: string }>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "未授权访问" }
    }

    // 清理和验证输入
    const sanitizedName = sanitizeString(name)
    const validation = validateData(createCategorySchema, { name: sanitizedName })

    if (!validation.success) {
        return validation
    }

    try {
        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
            where: { name: validation.data.name },
        })

        if (existingCategory) {
            return { success: true, data: existingCategory }
        }

        const category = await prisma.category.create({
            data: {
                id: randomUUID(),
                name: validation.data.name,
            },
        })

        // Invalidate categories cache
        queryCache.invalidate('categories:*')

        return { success: true, data: category }
    } catch (error) {
        return { success: false, error: "创建分类失败" }
    }
}

/**
 * 删除分类
 * Delete a category
 */
export async function deleteCategory(categoryId: string): Promise<ActionResult> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: "未授权访问" }
    }

    try {
        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: { Note: true }
                }
            }
        })

        if (!category) {
            return { success: false, error: "分类不存在" }
        }

        // Check if category has notes
        if (category._count.Note > 0) {
            return { success: false, error: `该分类下还有 ${category._count.Note} 篇笔记，无法删除` }
        }

        await prisma.category.delete({
            where: { id: categoryId },
        })

        // Invalidate categories cache
        queryCache.invalidate('categories:*')

        return { success: true, data: undefined }
    } catch (error) {
        return { success: false, error: "删除分类失败" }
    }
}
