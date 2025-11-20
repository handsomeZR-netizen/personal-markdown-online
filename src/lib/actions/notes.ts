"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { 
  createNoteSchema, 
  updateNoteSchema, 
  deleteNoteSchema,
  getNotesSchema,
  searchNotesSchema,
  type CreateNoteInput,
  type UpdateNoteInput 
} from "@/lib/validations/notes"
import { validateData, isValidCuid } from "@/lib/validation-utils"
import { t } from "@/lib/i18n"
import { summarizeNote as generateSummary, generateEmbedding } from "./ai"

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }

/**
 * 创建新笔记
 * Create a new note
 */
export async function createNote(formData: FormData): Promise<never> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error(t('errors.unauthorized'))
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const tagIds = formData.get("tagIds") ? JSON.parse(formData.get("tagIds") as string) : []
    const categoryId = formData.get("categoryId") as string | null

    // 服务端验证
    const validation = validateData(createNoteSchema, { 
        title, 
        content,
        tagIds,
        categoryId: categoryId || undefined,
    })

    if (!validation.success) {
        throw new Error(validation.error)
    }

    const validatedFields = validation

    try {
        // Generate summary if content is long enough
        let summary: string | null = null
        if (validatedFields.data.content.length >= 50) {
            const summaryResult = await generateSummary(validatedFields.data.content)
            if (summaryResult.success) {
                summary = summaryResult.data
            }
        }

        // Generate embedding for semantic search
        let embedding: string | null = null
        try {
            const text = `${validatedFields.data.title}\n\n${validatedFields.data.content}`
            const embeddingVector = await generateEmbedding(text)
            embedding = JSON.stringify(embeddingVector)
        } catch (error) {
            console.error('生成嵌入失败:', error)
            // Continue without embedding
        }

        // @ts-ignore - Prisma Client type generation issue with summary field
        await prisma.note.create({
            data: {
                title: validatedFields.data.title,
                content: validatedFields.data.content,
                summary,
                embedding,
                userId: session.user.id,
                tags: validatedFields.data.tagIds ? {
                    connect: validatedFields.data.tagIds.map(id => ({ id }))
                } : undefined,
                categoryId: validatedFields.data.categoryId || null,
            },
        })

        revalidatePath("/dashboard")
        revalidatePath("/notes")
    } catch (error) {
        throw new Error(t('notes.createError'))
    }
    
    redirect("/dashboard")
}

/**
 * 获取单个笔记
 * Get a single note by ID
 */
export async function getNote(id: string): Promise<{
    id: string
    title: string
    content: string
    summary: string | null
    createdAt: Date
    updatedAt: Date
    userId: string
    categoryId: string | null
    tags: Array<{ id: string; name: string }>
    category: { id: string; name: string } | null
} | null> {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    // 验证 ID 格式
    if (!isValidCuid(id)) {
        return null
    }

    try {
        // @ts-ignore - Prisma Client type generation issue with summary field
        const note = await prisma.note.findUnique({
            where: {
                id,
                userId: session.user.id,
            },
            select: {
                id: true,
                title: true,
                content: true,
                summary: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                categoryId: true,
                tags: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        return note
    } catch (error) {
        return null
    }
}

/**
 * 更新笔记
 * Update an existing note
 */
export async function updateNote(id: string, formData: FormData): Promise<never> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error(t('errors.unauthorized'))
    }

    // 验证笔记 ID
    if (!isValidCuid(id)) {
        throw new Error("无效的笔记ID")
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const tagIds = formData.get("tagIds") ? JSON.parse(formData.get("tagIds") as string) : []
    const categoryId = formData.get("categoryId") as string | null

    // 服务端验证
    const validation = validateData(updateNoteSchema, { 
        id,
        title, 
        content,
        tagIds,
        categoryId: categoryId || undefined,
    })

    if (!validation.success) {
        throw new Error(validation.error)
    }

    const validatedFields = validation

    try {
        // Generate summary if content is provided and long enough
        let summary: string | null = null
        if (validatedFields.data.content && validatedFields.data.content.length >= 50) {
            const summaryResult = await generateSummary(validatedFields.data.content)
            if (summaryResult.success) {
                summary = summaryResult.data
            }
        }

        // Generate embedding for semantic search if content is provided
        let embedding: string | null = null
        if (validatedFields.data.title && validatedFields.data.content) {
            try {
                const text = `${validatedFields.data.title}\n\n${validatedFields.data.content}`
                const embeddingVector = await generateEmbedding(text)
                embedding = JSON.stringify(embeddingVector)
            } catch (error) {
                console.error('生成嵌入失败:', error)
                // Continue without embedding
            }
        }

        // First, disconnect all existing tags
        await prisma.note.update({
            where: {
                id,
                userId: session.user.id,
            },
            data: {
                tags: {
                    set: [],
                },
            },
        })

        // Build update data object
        const updateData: any = {
            tags: validatedFields.data.tagIds ? {
                connect: validatedFields.data.tagIds.map(id => ({ id }))
            } : undefined,
        }

        // Only update fields that are provided
        if (validatedFields.data.title !== undefined) {
            updateData.title = validatedFields.data.title
        }
        if (validatedFields.data.content !== undefined) {
            updateData.content = validatedFields.data.content
        }
        if (summary !== null) {
            updateData.summary = summary
        }
        if (embedding !== null) {
            updateData.embedding = embedding
        }
        if (validatedFields.data.categoryId !== undefined) {
            updateData.categoryId = validatedFields.data.categoryId || null
        }

        // Then update with new data
        // @ts-ignore - Prisma Client type generation issue with summary field
        await prisma.note.update({
            where: {
                id,
                userId: session.user.id,
            },
            data: updateData,
        })

        revalidatePath("/dashboard")
        revalidatePath("/notes")
        revalidatePath(`/notes/${id}`)
    } catch (error) {
        throw new Error(t('notes.updateError'))
    }
    
    redirect("/dashboard")
}

/**
 * 删除笔记
 * Delete a note
 */
export async function deleteNote(id: string): Promise<ActionResult> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: t('errors.unauthorized') }
    }

    // 服务端验证
    const validation = validateData(deleteNoteSchema, { id })
    if (!validation.success) {
        return validation
    }

    try {
        // 验证笔记所有权
        const note = await prisma.note.findUnique({
            where: { id, userId: session.user.id },
        })

        if (!note) {
            return { success: false, error: "笔记不存在或无权访问" }
        }

        await prisma.note.delete({
            where: {
                id,
                userId: session.user.id,
            },
        })

        revalidatePath("/dashboard")
        revalidatePath("/notes")
        
        return { success: true, data: undefined }
    } catch (error) {
        return { success: false, error: t('notes.deleteError') }
    }
}

/**
 * 自动保存笔记
 * Auto-save note (for editor)
 */
export async function autoSaveNote(
    id: string, 
    data: { title: string; content: string; tagIds?: string[]; categoryId?: string }
): Promise<ActionResult> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: t('errors.unauthorized') }
    }

    // 服务端验证
    const validation = validateData(updateNoteSchema, { id, ...data })
    if (!validation.success) {
        return validation
    }

    const validatedFields = validation

    try {
        // First, disconnect all existing tags
        await prisma.note.update({
            where: {
                id,
                userId: session.user.id,
            },
            data: {
                tags: {
                    set: [],
                },
            },
        })

        // Then update with new data
        await prisma.note.update({
            where: {
                id,
                userId: session.user.id,
            },
            data: {
                title: validatedFields.data.title,
                content: validatedFields.data.content,
                tags: validatedFields.data.tagIds ? {
                    connect: validatedFields.data.tagIds.map(id => ({ id }))
                } : undefined,
                categoryId: validatedFields.data.categoryId || null,
            },
        })

        revalidatePath("/dashboard")
        revalidatePath("/notes")
        revalidatePath(`/notes/${id}`)
        
        return { success: true, data: undefined }
    } catch (error) {
        return { success: false, error: t('notes.updateError') }
    }
}

/**
 * 获取笔记列表（支持分页和排序）
 * Get notes list with pagination and sorting
 */
export async function getNotes(params: {
    page?: number
    pageSize?: number
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
    query?: string
    tagIds?: string[]
    categoryId?: string
}) {
    const session = await auth()
    if (!session?.user?.id) {
        return {
            notes: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
        }
    }

    // 服务端验证参数
    const validation = validateData(getNotesSchema, {
        page: params.page,
        pageSize: params.pageSize,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        search: params.query,
        tagIds: params.tagIds,
        categoryId: params.categoryId,
    })

    if (!validation.success) {
        return {
            notes: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
        }
    }

    const {
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search: query,
        tagIds,
        categoryId,
    } = validation.data

    try {
        const where = {
            userId: session.user.id,
            ...(query && {
                OR: [
                    { title: { contains: query } },
                    { content: { contains: query } },
                ],
            }),
            ...(categoryId && { categoryId }),
            ...(tagIds && tagIds.length > 0 && {
                tags: {
                    some: {
                        id: {
                            in: tagIds,
                        },
                    },
                },
            }),
        }

        // @ts-ignore - Prisma Client type generation issue with summary field
        const [notes, totalCount] = await Promise.all([
            prisma.note.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    summary: true,
                    createdAt: true,
                    updatedAt: true,
                    userId: true,
                    categoryId: true,
                    tags: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    [sortBy]: sortOrder,
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.note.count({ where }),
        ])

        const totalPages = Math.ceil(totalCount / pageSize)

        return {
            notes,
            totalCount,
            totalPages,
            currentPage: page,
        }
    } catch (error) {
        return {
            notes: [] as Array<{
                id: string
                title: string
                content: string
                summary: string | null
                createdAt: Date
                updatedAt: Date
                userId: string
                categoryId: string | null
                tags: Array<{ id: string; name: string }>
                category: { id: string; name: string } | null
            }>,
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
        }
    }
}

/**
 * 搜索笔记
 * Search notes by keyword, tags, and category
 */
export async function searchNotes(params: {
    query?: string
    tagIds?: string[]
    categoryId?: string
    page?: number
    pageSize?: number
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
}) {
    // searchNotes is essentially the same as getNotes with filters
    return getNotes(params)
}

/**
 * 重新生成笔记摘要
 * Regenerate note summary
 */
export async function regenerateNoteSummary(id: string): Promise<ActionResult<string>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: t('errors.unauthorized') }
    }

    // 验证 ID 格式
    if (!isValidCuid(id)) {
        return { success: false, error: "无效的笔记ID" }
    }

    try {
        // Get the note and verify ownership
        const note = await prisma.note.findUnique({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (!note) {
            return { success: false, error: t('errors.notFound') }
        }

        // Generate new summary
        const summaryResult = await generateSummary(note.content)
        
        if (!summaryResult.success) {
            return { success: false, error: summaryResult.error }
        }

        // Update note with new summary
        // @ts-ignore - Prisma Client type generation issue with summary field
        await prisma.note.update({
            where: {
                id,
                userId: session.user.id,
            },
            data: {
                summary: summaryResult.data,
            },
        })

        revalidatePath("/dashboard")
        revalidatePath("/notes")
        revalidatePath(`/notes/${id}`)
        
        return { success: true, data: summaryResult.data }
    } catch (error) {
        return { success: false, error: '重新生成摘要失败' }
    }
}
