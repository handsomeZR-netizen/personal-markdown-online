/**
 * 本地缓存工具函数
 * 用于安全地管理用户特定的本地存储数据
 */

/**
 * 清理不属于当前用户的所有缓存
 * @param currentUserId 当前登录用户的 ID
 */
export function cleanupOtherUsersCaches(currentUserId: string | null) {
  if (typeof window === 'undefined') return

  const keysToRemove: string[] = []

  // 遍历所有 localStorage 键
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    // 检查是否是笔记草稿缓存
    if (key.startsWith('note-draft-')) {
      try {
        const cached = localStorage.getItem(key)
        if (cached) {
          const parsed = JSON.parse(cached)
          
          // 如果缓存有 userId 字段
          if (parsed.userId) {
            // 如果不是当前用户的缓存，标记为删除
            if (parsed.userId !== currentUserId) {
              keysToRemove.push(key)
            }
          } else {
            // 旧版本缓存（没有 userId），也删除
            keysToRemove.push(key)
          }
        }
      } catch (e) {
        // 解析失败，删除损坏的缓存
        keysToRemove.push(key)
      }
    }
  }

  // 删除标记的键
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })

  if (keysToRemove.length > 0) {
    console.log(`已清理 ${keysToRemove.length} 个其他用户的缓存`)
  }
}

/**
 * 清理过期的缓存（超过指定天数）
 * @param maxAgeDays 最大保留天数，默认 7 天
 */
export function cleanupExpiredCaches(maxAgeDays: number = 7) {
  if (typeof window === 'undefined') return

  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
  const now = Date.now()
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    if (key.startsWith('note-draft-')) {
      try {
        const cached = localStorage.getItem(key)
        if (cached) {
          const parsed = JSON.parse(cached)
          
          // 检查时间戳
          if (parsed.timestamp && (now - parsed.timestamp > maxAgeMs)) {
            keysToRemove.push(key)
          }
        }
      } catch (e) {
        // 解析失败，删除损坏的缓存
        keysToRemove.push(key)
      }
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })

  if (keysToRemove.length > 0) {
    console.log(`已清理 ${keysToRemove.length} 个过期缓存`)
  }
}

/**
 * 获取用户特定的缓存键
 * @param userId 用户 ID
 * @param noteId 笔记 ID（可选）
 * @returns 缓存键
 */
export function getUserCacheKey(userId: string, noteId?: string): string {
  return noteId 
    ? `note-draft-${userId}-${noteId}` 
    : `note-draft-${userId}-new`
}

/**
 * 安全地保存缓存
 * @param userId 用户 ID
 * @param noteId 笔记 ID（可选）
 * @param data 要缓存的数据
 */
export function saveUserCache(
  userId: string, 
  noteId: string | undefined, 
  data: { content: string; title: string }
) {
  if (typeof window === 'undefined') return

  const cacheKey = getUserCacheKey(userId, noteId)
  
  localStorage.setItem(cacheKey, JSON.stringify({
    ...data,
    userId,
    timestamp: Date.now()
  }))
}

/**
 * 安全地读取缓存
 * @param userId 用户 ID
 * @param noteId 笔记 ID（可选）
 * @returns 缓存的数据或 null
 */
export function loadUserCache(
  userId: string, 
  noteId?: string
): { content: string; title: string } | null {
  if (typeof window === 'undefined') return null

  const cacheKey = getUserCacheKey(userId, noteId)
  const cached = localStorage.getItem(cacheKey)
  
  if (!cached) return null

  try {
    const parsed = JSON.parse(cached)
    
    // 验证用户 ID
    if (parsed.userId !== userId) {
      localStorage.removeItem(cacheKey)
      return null
    }

    // 检查是否过期（24小时）
    if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return {
      content: parsed.content || '',
      title: parsed.title || ''
    }
  } catch (e) {
    localStorage.removeItem(cacheKey)
    return null
  }
}

/**
 * 清除特定笔记的缓存
 * @param userId 用户 ID
 * @param noteId 笔记 ID（可选）
 */
export function clearUserCache(userId: string, noteId?: string) {
  if (typeof window === 'undefined') return

  const cacheKey = getUserCacheKey(userId, noteId)
  localStorage.removeItem(cacheKey)
}
