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
import { triggerNoteCreated, triggerNoteUpdated, triggerNoteDeleted } from "@/lib/webhooks/webhook-triggers"
import { saveNoteVersion } from "@/lib/versions/version-manager"

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

    // 转换日期字符串为 Date 对象，保留关联数据
    return {
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
        tags: note.tags || [],
        category: note.category || null,
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
    ownership?: 'all' | 'mine' | 'shared'
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

    const userId = session.user.id
    const { prisma } = await import('@/lib/prisma')

    // 获取用户协作的笔记ID列表
    const collaborations = await prisma.collaborator.findMany({
        where: { userId },
        select: { noteId: true, role: true },
    })
    const collaborationMap = new Map(collaborations.map(c => [c.noteId, c.role]))
    const collaboratedNoteIds = collaborations.map(c => c.noteId)

    const { data: allNotes, error } = await getUserNotes(userId)
    
    if (error || !allNotes) {
        return {
            notes: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
        }
    }

    // 为每个笔记添加协作信息
    let notes = allNotes.map(note => ({
        ...note,
        isShared: collaboratedNoteIds.includes(note.id),
        isOwner: note.ownerId === userId || note.userId === userId,
        collaboratorRole: collaborationMap.get(note.id) || null,
    }))

    // 所有权筛选
    const ownership = params?.ownership || 'all'
    if (ownership === 'mine') {
        notes = notes.filter(note => note.isOwner)
    } else if (ownership === 'shared') {
        notes = notes.filter(note => note.isShared && !note.isOwner)
    }

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
        const aValue = a[sortBy as keyof typeof a]
        const bValue = b[sortBy as keyof typeof b]
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

    // Get note title before deletion for webhook
    const { data: note } = await getNoteById(id, session.user.id)
    const noteTitle = note?.title || 'Untitled'

    const { error } = await deleteNoteSupabase(id, session.user.id)

    if (error) {
        return { success: false, error: t('notes.deleteError') }
    }

    // Trigger webhook for note deletion
    triggerNoteDeleted(id, noteTitle, session.user.id).catch(err => {
        console.error('Webhook trigger failed:', err)
    })

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

    let noteId: string | undefined

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

        const { data, error } = await createNoteSupabase({
            title,
            content,
            summary,
            embedding,
            userId: session.user.id,
        })

        if (error) {
            throw new Error(error)
        }

        noteId = data?.id

        // Trigger webhook for note creation
        if (noteId) {
            triggerNoteCreated(noteId, title, session.user.id).catch(err => {
                console.error('Webhook trigger failed:', err)
            })
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

    // Get the current note before updating to save as version
    const { data: currentNote, error: fetchError } = await getNoteById(id, session.user.id)
    
    if (fetchError) {
        console.error('Failed to fetch note for update:', fetchError)
        throw new Error(t('notes.updateError') + ': ' + fetchError)
    }
    
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
        console.error('Failed to update note:', error)
        throw new Error(t('notes.updateError') + ': ' + error)
    }

    // Save version after successful update (save the previous state)
    if (currentNote) {
        console.log('Saving version for note:', id, 'user:', session.user.id)
        const versionResult = await saveNoteVersion(
            session.user.id,
            id,
            currentNote.title,
            currentNote.content
        )
        if (!versionResult.success) {
            console.error('Failed to save version:', versionResult.error)
        } else {
            console.log('Version saved successfully')
        }
    }

    // Trigger webhook for note update
    triggerNoteUpdated(id, title, session.user.id).catch(err => {
        console.error('Webhook trigger failed:', err)
    })

    revalidatePath("/dashboard")
    revalidatePath("/notes")
    revalidatePath(`/notes/${id}`)
    revalidatePath(`/notes/${id}/edit`)
    
    redirect(`/notes/${id}/edit`)
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

    // Get the current note before updating to save as version
    const { data: currentNote } = await getNoteById(id, session.user.id)

    const { error } = await updateNoteSupabase(id, session.user.id, {
        title: data.title,
        content: data.content,
    })

    if (error) {
        return { success: false, error: t('notes.updateError') }
    }

    // Save version after successful update (save the previous state)
    // Only save version if there's a significant change (not on every keystroke)
    if (currentNote && shouldSaveVersion(currentNote, data)) {
        await saveNoteVersion(
            session.user.id,
            id,
            currentNote.title,
            currentNote.content
        ).catch(err => {
            console.error('Failed to save version:', err)
        })
    }

    // Trigger webhook for note update
    triggerNoteUpdated(id, data.title, session.user.id).catch(err => {
        console.error('Webhook trigger failed:', err)
    })

    revalidatePath("/dashboard")
    revalidatePath("/notes")
    revalidatePath(`/notes/${id}`)
    
    return { success: true, data: undefined }
}

/**
 * Determine if a version should be saved
 * Only save if there's a significant change (e.g., more than 100 characters difference)
 */
function shouldSaveVersion(
    currentNote: { title: string; content: string },
    newData: { title: string; content: string }
): boolean {
    const titleChanged = currentNote.title !== newData.title
    const contentDiff = Math.abs(currentNote.content.length - newData.content.length)
    const significantContentChange = contentDiff > 100
    
    return titleChanged || significantContentChange
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
 * 统一搜索文件夹和笔记
 * Validates: Requirements 21.1, 21.2
 */
export async function searchAll(params: {
    query?: string
    page?: number
    pageSize?: number
}) {
    const session = await auth()
    if (!session?.user?.id) {
        return {
            folders: [],
            notes: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
        }
    }

    const query = params.query?.toLowerCase() || ''
    const page = params.page || 1
    const pageSize = params.pageSize || 20

    if (!query.trim()) {
        return {
            folders: [],
            notes: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
        }
    }

    try {
        // Import prisma to use in server action
        const { prisma } = await import('@/lib/prisma')

        // Search folders
        const folders = await prisma.folder.findMany({
            where: {
                userId: session.user.id,
                name: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            include: {
                parent: true,
                _count: {
                    select: {
                        children: true,
                        notes: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        })

        // Search notes
        const notes = await prisma.note.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { userId: session.user.id },
                            { ownerId: session.user.id },
                            {
                                collaborators: {
                                    some: {
                                        userId: session.user.id,
                                    },
                                },
                            },
                        ],
                    },
                    {
                        OR: [
                            {
                                title: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                content: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                ],
            },
            include: {
                folder: true,
                tags: true,
                category: true,
            },
            orderBy: { updatedAt: 'desc' },
        })

        // Calculate total and pagination
        const totalCount = folders.length + notes.length
        const totalPages = Math.ceil(totalCount / pageSize)
        const skip = (page - 1) * pageSize

        // Combine and paginate
        const allResults = [
            ...folders.map((f: any) => ({ type: 'folder' as const, data: f })),
            ...notes.map((n: any) => ({ type: 'note' as const, data: n })),
        ]

        const paginatedResults = allResults.slice(skip, skip + pageSize)

        // Separate back
        const paginatedFolders = paginatedResults
            .filter((r: any) => r.type === 'folder')
            .map((r: any) => r.data)
        const paginatedNotes = paginatedResults
            .filter((r: any) => r.type === 'note')
            .map((r: any) => r.data)

        return {
            folders: paginatedFolders,
            notes: paginatedNotes,
            totalCount,
            totalPages,
            currentPage: page,
        }
    } catch (error) {
        console.error('Search error:', error)
        return {
            folders: [],
            notes: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
        }
    }
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
