import { supabase } from './supabaseClient'
import { supabaseServer } from './supabase-server'
import { prisma } from './prisma'

const databaseMode = process.env.DATABASE_MODE || 'local'

// 优先使用服务端客户端（绕过 RLS），否则使用普通客户端
// 在 local 模式下，使用 Prisma
const db = (supabaseServer || supabase) as typeof supabase

// Helper function to check if Supabase operations are available
function isSupabaseMode(): boolean {
  return databaseMode === 'supabase'
}

export interface CreateNoteData {
  title: string
  content: string
  userId: string
  summary?: string | null
  embedding?: string | null
  categoryId?: string | null
}

export interface UpdateNoteData {
  title?: string
  content?: string
  summary?: string | null
  embedding?: string | null
  categoryId?: string | null
}

/**
 * 获取用户的所有笔记
 */
export async function getUserNotes(userId: string) {
  // Local mode: use Prisma
  if (!isSupabaseMode()) {
    try {
      const notes = await prisma.note.findMany({
        where: {
          OR: [
            { userId: userId },
            { ownerId: userId },
            {
              Collaborator: {
                some: { userId: userId },
              },
            },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      })
      return { data: notes, error: null }
    } catch (error) {
      console.error('Get notes error (Prisma):', error)
      return { error: (error as Error).message, data: null }
    }
  }

  // Supabase mode - get owned notes
  const { data: ownedNotes, error: ownedError } = await db
    .from('Note')
    .select('*')
    .or(`userId.eq.${userId},ownerId.eq.${userId}`)
    .order('updatedAt', { ascending: false })

  if (ownedError) {
    console.error('Get owned notes error:', ownedError)
    return { error: ownedError.message, data: null }
  }

  // Get collaborated notes
  const { data: collaborations } = await db
    .from('Collaborator')
    .select('noteId')
    .eq('userId', userId)

  let collaboratedNotes: any[] = []
  if (collaborations && collaborations.length > 0) {
    const noteIds = collaborations.map(c => c.noteId)
    const { data: collabNotes } = await db
      .from('Note')
      .select('*')
      .in('id', noteIds)
      .order('updatedAt', { ascending: false })
    
    collaboratedNotes = collabNotes || []
  }

  // Merge and deduplicate notes
  const allNotes = [...(ownedNotes || [])]
  const existingIds = new Set(allNotes.map(n => n.id))
  
  for (const note of collaboratedNotes) {
    if (!existingIds.has(note.id)) {
      allNotes.push(note)
    }
  }

  // Sort by updatedAt
  allNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return { data: allNotes, error: null }
}

/**
 * 根据 ID 获取笔记
 */
export async function getNoteById(id: string, userId: string) {
  // Local mode: use Prisma
  if (!isSupabaseMode()) {
    try {
      const note = await prisma.note.findFirst({
        where: {
          id,
          OR: [
            { userId: userId },
            { ownerId: userId },
            {
              Collaborator: {
                some: { userId: userId },
              },
            },
          ],
        },
        include: {
          Tag: true,
          Category: true,
          Folder: true,
        },
      })
      
      if (!note) {
        return { error: 'Note not found', data: null }
      }
      
      // Transform to expected format
      const transformedNote = {
        ...note,
        tags: note.Tag,
        category: note.Category,
        folder: note.Folder,
      }
      return { data: transformedNote, error: null }
    } catch (error) {
      console.error('Get note error (Prisma):', error)
      return { error: (error as Error).message, data: null }
    }
  }

  // Supabase mode - first try direct ownership
  let { data, error } = await db
    .from('Note')
    .select('*')
    .eq('id', id)
    .or(`userId.eq.${userId},ownerId.eq.${userId}`)
    .maybeSingle()

  // If not found by ownership, check collaborator access
  if (!data && !error) {
    const { data: collaborator } = await db
      .from('Collaborator')
      .select('noteId')
      .eq('noteId', id)
      .eq('userId', userId)
      .maybeSingle()

    if (collaborator) {
      const result = await db
        .from('Note')
        .select('*')
        .eq('id', id)
        .single()
      
      data = result.data
      error = result.error
    }
  }

  if (error) {
    console.error('Get note error:', error)
    return { error: error.message, data: null }
  }

  if (!data) {
    return { error: 'Note not found', data: null }
  }

  return { data, error: null }
}

/**
 * 创建笔记
 */
export async function createNote(noteData: CreateNoteData) {
  // Local mode: use Prisma
  if (!isSupabaseMode()) {
    try {
      const note = await prisma.note.create({
        data: {
          title: noteData.title,
          content: noteData.content,
          summary: noteData.summary,
          embedding: noteData.embedding,
          userId: noteData.userId,
          ownerId: noteData.userId,
          categoryId: noteData.categoryId,
        },
      })
      return { data: note, error: null }
    } catch (error) {
      console.error('Create note error (Prisma):', error)
      return { error: (error as Error).message, data: null }
    }
  }

  // Supabase mode
  const { data, error } = await db
    .from('Note')
    .insert(noteData)
    .select()
    .single()

  if (error) {
    console.error('Create note error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * 更新笔记
 */
export async function updateNote(id: string, userId: string, updates: UpdateNoteData) {
  // Local mode: use Prisma
  if (!isSupabaseMode()) {
    try {
      // First, check if the note exists and get its ownership info
      const existingNote = await prisma.note.findUnique({
        where: { id },
        select: { id: true, userId: true, ownerId: true },
      })
      
      if (!existingNote) {
        console.error('Note not found:', id)
        return { error: 'Note not found', data: null }
      }
      
      console.log('Updating note:', { 
        noteId: id, 
        requestUserId: userId, 
        noteUserId: existingNote.userId, 
        noteOwnerId: existingNote.ownerId 
      })
      
      // Check if user is owner (either userId or ownerId matches)
      const isOwner = existingNote.userId === userId || existingNote.ownerId === userId
      
      if (isOwner) {
        // User is owner, allow update
        const updatedNote = await prisma.note.update({
          where: { id },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        })
        return { data: updatedNote, error: null }
      }
      
      // If not owner, check if user is a collaborator with editor role
      const collaborator = await prisma.collaborator.findFirst({
        where: {
          noteId: id,
          userId: userId,
          role: 'editor',
        },
      })
      
      if (collaborator) {
        // User is an editor collaborator, allow update
        const updatedNote = await prisma.note.update({
          where: { id },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        })
        return { data: updatedNote, error: null }
      }
      
      console.error('User not authorized to update note:', { userId, noteId: id })
      return { error: 'Not authorized to update this note', data: null }
    } catch (error) {
      console.error('Update note error (Prisma):', error)
      return { error: (error as Error).message, data: null }
    }
  }

  // Supabase mode - first try direct ownership
  let { data, error } = await db
    .from('Note')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .or(`userId.eq.${userId},ownerId.eq.${userId}`)
    .select()
    .single()

  // If not found by ownership, check collaborator access
  if (error && error.code === 'PGRST116') {
    const { data: collaborator } = await db
      .from('Collaborator')
      .select('role')
      .eq('noteId', id)
      .eq('userId', userId)
      .eq('role', 'editor')
      .maybeSingle()

    if (collaborator) {
      const result = await db
        .from('Note')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      
      data = result.data
      error = result.error
    }
  }

  if (error) {
    console.error('Update note error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * 删除笔记
 */
export async function deleteNote(id: string, userId: string) {
  // Local mode: use Prisma
  if (!isSupabaseMode()) {
    try {
      await prisma.note.deleteMany({
        where: {
          id,
          OR: [
            { userId: userId },
            { ownerId: userId },
          ],
        },
      })
      return { error: null }
    } catch (error) {
      console.error('Delete note error (Prisma):', error)
      return { error: (error as Error).message }
    }
  }

  // Supabase mode
  const { error } = await db
    .from('Note')
    .delete()
    .eq('id', id)
    .eq('userId', userId)

  if (error) {
    console.error('Delete note error:', error)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * 批量同步笔记
 */
export async function batchSyncNotes(notes: CreateNoteData[]) {
  // Local mode: use Prisma
  if (!isSupabaseMode()) {
    try {
      const results = await Promise.all(
        notes.map(note =>
          prisma.note.upsert({
            where: { id: (note as any).id || '' },
            create: {
              title: note.title,
              content: note.content,
              summary: note.summary,
              embedding: note.embedding,
              userId: note.userId,
              ownerId: note.userId,
              categoryId: note.categoryId,
            },
            update: {
              title: note.title,
              content: note.content,
              summary: note.summary,
              embedding: note.embedding,
              updatedAt: new Date(),
            },
          })
        )
      )
      return { data: results, error: null }
    } catch (error) {
      console.error('Batch sync error (Prisma):', error)
      return { error: (error as Error).message, data: null }
    }
  }

  // Supabase mode
  const { data, error } = await db
    .from('Note')
    .upsert(notes, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('Batch sync error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * 搜索笔记
 */
export async function searchNotes(userId: string, query: string) {
  // Local mode: use Prisma
  if (!isSupabaseMode()) {
    try {
      const notes = await prisma.note.findMany({
        where: {
          OR: [
            { userId: userId },
            { ownerId: userId },
          ],
          AND: [
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      })
      return { data: notes, error: null }
    } catch (error) {
      console.error('Search notes error (Prisma):', error)
      return { error: (error as Error).message, data: null }
    }
  }

  // Supabase mode
  const { data, error } = await db
    .from('Note')
    .select('*')
    .eq('userId', userId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('updatedAt', { ascending: false })

  if (error) {
    console.error('Search notes error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}
