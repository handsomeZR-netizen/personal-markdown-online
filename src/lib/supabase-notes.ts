import { supabase } from './supabaseClient'
import { supabaseServer } from './supabase-server'

// 优先使用服务端客户端（绕过 RLS），否则使用普通客户端
const db = (supabaseServer || supabase) as typeof supabase

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
  const { data, error } = await db
    .from('Note')
    .select('*')
    .eq('userId', userId)
    .order('updatedAt', { ascending: false })

  if (error) {
    console.error('Get notes error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * 根据 ID 获取笔记
 */
export async function getNoteById(id: string, userId: string) {
  const { data, error } = await db
    .from('Note')
    .select('*')
    .eq('id', id)
    .eq('userId', userId)
    .single()

  if (error) {
    console.error('Get note error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

/**
 * 创建笔记
 */
export async function createNote(noteData: CreateNoteData) {
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
  const { data, error } = await db
    .from('Note')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('userId', userId)
    .select()
    .single()

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
