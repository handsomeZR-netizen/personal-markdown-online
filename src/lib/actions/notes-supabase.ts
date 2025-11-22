"use server"

import { 
  getUserNotes, 
  getNoteById, 
  createNote as createNoteSupabase,
  updateNote as updateNoteSupabase,
  deleteNote as deleteNoteSupabase,
  searchNotes as searchNotesSupabase
} from "@/lib/supabase-notes"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { 
  createNoteSchema, 
  updateNoteSchema, 
  deleteNoteSchema,
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
 * 获取单个笔记
 */
export async function getNote(id: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    if (!isValidCuid(id)) {
        return null
    }

    const { data: note, error } = await getNoteById(id, session.user.id)
    
    if (error || !note) {
        return null
    }

    // 转换日期字符串为 Date 对象
    return {
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        tags: [],
        category: null,
    }
}

/**
 * 获取笔记列表
 */
export async function getNotes(params?: {
    page?: number
    pageSize?: number
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
    query?: string
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

    const { data: allNotes, error } = await getUserNotes(session.user.id)
    
    if (error || !allNotes) {
        return {
            notes: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
        }
    }

    // 客户端过滤和排序
    let notes = allNotes

    // 搜索过滤
    if (params?.query) {
        const query = params.query.toLowerCase()
        notes = notes.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        )
    }

    // 排序
    const sortBy = params?.sortBy || 'updatedAt'
    const sortOrder = params?.sortOrder || 'desc'
    notes.sort((a, b) => {
        const aValue = a[sortBy]
        const bValue = b[sortBy]
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
        } else {
            return aValue < bValue ? 1 : -1
        }
    })

    // 分页
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const start = (page - 1) * pageSize
    const paginatedNotes = notes.slice(start, start + pageSize)

    // 转换日期
    const formattedNotes = paginatedNotes.map(note => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        tags: [],
        category: null,
    }))

    return {
        notes: formattedNotes,
        totalCount: notes.length,
        totalPages: Math.ceil(notes.length / pageSize),
        currentPage: page,
    }
}

/**
 * 删除笔记
 */
export async function deleteNote(id: string): Promise<ActionResult> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: t('errors.unauthorized') }
    }

    const validation = validateData(deleteNoteSchema, { id })
    if (!validation.success) {
        return validation
    }

    const { error } = await deleteNoteSupabase(id, session.user.id)

    if (error) {
        return { success: false, error: t('notes.deleteError') }
    }

    revalidatePath("/dashboard")
    revalidatePath("/notes")
    
    return { success: true, data: undefined }
}

/**
 * 创建笔记
 */
export async function createNote(formData: FormData): Promise<never> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error(t('errors.unauthorized'))
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string

    const validation = validateData(createNoteSchema, { 
        title, 
        content,
    })

    if (!validation.success) {
        throw new Error(validation.error)
    }

    try {
        let summary: string | null = null
        if (content.length >= 50) {
            const summaryResult = await generateSummary(content)
            if (summaryResult.success) {
                summary = summaryResult.data
            }
        }

        let embedding: string | null = null
        try {
            const text = `${title}\n\n${content}`
            const embeddingVector = await generateEmbedding(text)
            embedding = JSON.stringify(embeddingVector)
        } catch (error) {
            console.error('生成嵌入失败:', error)
        }

        const { error } = await createNoteSupabase({
            title,
            content,
            summary,
            embedding,
            userId: session.user.id,
        })

        if (error) {
            throw new Error(error)
        }

        revalidatePath("/dashboard")
        revalidatePath("/notes")
    } catch (error) {
        throw new Error(t('notes.createError'))
    }
    
    redirect("/dashboard")
}

/**
 * 更新笔记
 */
export async function updateNote(id: string, formData: FormData): Promise<never> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error(t('errors.unauthorized'))
    }

    if (!isValidCuid(id)) {
        throw new Error("无效的笔记ID")
    }

    const title = formData.get("title") as string
    const content = formData.get("content") as string

    const validation = validateData(updateNoteSchema, { 
        id,
        title, 
        content,
    })

    if (!validation.success) {
        throw new Error(validation.error)
    }

    try {
        let summary: string | null = null
        if (content && content.length >= 50) {
            const summaryResult = await generateSummary(content)
            if (summaryResult.success) {
                summary = summaryResult.data
            }
        }

        let embedding: string | null = null
        if (title && content) {
            try {
                const text = `${title}\n\n${content}`
                const embeddingVector = await generateEmbedding(text)
                embedding = JSON.stringify(embeddingVector)
            } catch (error) {
                console.error('生成嵌入失败:', error)
            }
        }

        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (content !== undefined) updateData.content = content
        if (summary !== null) updateData.summary = summary
        if (embedding !== null) updateData.embedding = embedding

        const { error } = await updateNoteSupabase(id, session.user.id, updateData)

        if (error) {
            throw new Error(error)
        }

        revalidatePath("/dashboard")
        revalidatePath("/notes")
        revalidatePath(`/notes/${id}`)
    } catch (error) {
        throw new Error(t('notes.updateError'))
    }
    
    redirect("/dashboard")
}

/**
 * 自动保存笔记
 */
export async function autoSaveNote(
    id: string, 
    data: { title: string; content: string }
): Promise<ActionResult> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: t('errors.unauthorized') }
    }

    const validation = validateData(updateNoteSchema, { id, ...data })
    if (!validation.success) {
        return validation
    }

    const { error } = await updateNoteSupabase(id, session.user.id, {
        title: data.title,
        content: data.content,
    })

    if (error) {
        return { success: false, error: t('notes.updateError') }
    }

    revalidatePath("/dashboard")
    revalidatePath("/notes")
    revalidatePath(`/notes/${id}`)
    
    return { success: true, data: undefined }
}

/**
 * 搜索笔记
 */
export async function searchNotes(params: {
    query?: string
    page?: number
    pageSize?: number
}) {
    return getNotes(params)
}

/**
 * 重新生成笔记摘要
 */
export async function regenerateNoteSummary(id: string): Promise<ActionResult<string>> {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: t('errors.unauthorized') }
    }

    if (!isValidCuid(id)) {
        return { success: false, error: "无效的笔记ID" }
    }

    const { data: note, error: fetchError } = await getNoteById(id, session.user.id)

    if (fetchError || !note) {
        return { success: false, error: t('errors.notFound') }
    }

    const summaryResult = await generateSummary(note.content)
    
    if (!summaryResult.success) {
        return { success: false, error: summaryResult.error }
    }

    const { error } = await updateNoteSupabase(id, session.user.id, {
        summary: summaryResult.data,
    })

    if (error) {
        return { success: false, error: '重新生成摘要失败' }
    }

    revalidatePath("/dashboard")
    revalidatePath("/notes")
    revalidatePath(`/notes/${id}`)
    
    return { success: true, data: summaryResult.data }
}
