import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * 认证和授权工具函数
 */

export type AuthResult = 
  | { success: true; userId: string }
  | { success: false; error: string }

/**
 * 获取当前用户会话
 * @returns 用户会话或错误
 */
export async function getCurrentUser(): Promise<AuthResult> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return {
      success: false,
      error: "未授权访问，请先登录",
    }
  }
  
  return {
    success: true,
    userId: session.user.id,
  }
}

/**
 * 验证用户是否拥有指定笔记的访问权限
 * @param noteId 笔记 ID
 * @param userId 用户 ID
 * @returns 是否有权限
 */
export async function canAccessNote(noteId: string, userId: string): Promise<boolean> {
  try {
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
        userId: userId,
      },
      select: {
        id: true,
      },
    })
    
    return note !== null
  } catch (error) {
    return false
  }
}

/**
 * 验证用户是否拥有指定笔记的修改权限
 * @param noteId 笔记 ID
 * @param userId 用户 ID
 * @returns 是否有权限
 */
export async function canModifyNote(noteId: string, userId: string): Promise<boolean> {
  // 目前修改权限和访问权限相同（用户只能修改自己的笔记）
  return canAccessNote(noteId, userId)
}

/**
 * 验证用户是否拥有指定笔记的删除权限
 * @param noteId 笔记 ID
 * @param userId 用户 ID
 * @returns 是否有权限
 */
export async function canDeleteNote(noteId: string, userId: string): Promise<boolean> {
  // 目前删除权限和访问权限相同（用户只能删除自己的笔记）
  return canAccessNote(noteId, userId)
}

/**
 * 获取笔记并验证权限
 * @param noteId 笔记 ID
 * @param userId 用户 ID
 * @returns 笔记数据或 null
 */
export async function getNoteWithAuth(noteId: string, userId: string) {
  try {
    const note = await prisma.note.findUnique({
      where: {
        id: noteId,
        userId: userId,
      },
    })
    
    return note
  } catch (error) {
    return null
  }
}

/**
 * 批量验证笔记权限
 * @param noteIds 笔记 ID 数组
 * @param userId 用户 ID
 * @returns 有权限的笔记 ID 数组
 */
export async function filterAccessibleNotes(
  noteIds: string[],
  userId: string
): Promise<string[]> {
  try {
    const notes = await prisma.note.findMany({
      where: {
        id: {
          in: noteIds,
        },
        userId: userId,
      },
      select: {
        id: true,
      },
    })
    
    return notes.map(note => note.id)
  } catch (error) {
    return []
  }
}

/**
 * 验证用户是否已认证（用于中间件）
 * @returns 用户 ID 或 null
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id || null
}

/**
 * 要求用户已认证，否则抛出错误
 * @returns 用户 ID
 * @throws Error 如果未认证
 */
export async function requireAuth(): Promise<string> {
  const result = await getCurrentUser()
  
  if (!result.success) {
    throw new Error(result.error)
  }
  
  return result.userId
}

/**
 * 要求用户对笔记有访问权限，否则抛出错误
 * @param noteId 笔记 ID
 * @returns 用户 ID
 * @throws Error 如果无权限
 */
export async function requireNoteAccess(noteId: string): Promise<string> {
  const userId = await requireAuth()
  
  const hasAccess = await canAccessNote(noteId, userId)
  if (!hasAccess) {
    throw new Error("无权访问该笔记")
  }
  
  return userId
}
