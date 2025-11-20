"use client"

import { useEffect } from 'react'
import { cleanupOtherUsersCaches, cleanupExpiredCaches } from '@/lib/cache-utils'

interface CacheCleanupProps {
  userId: string | null
}

/**
 * 缓存清理组件
 * 在用户登录时自动清理其他用户的缓存和过期缓存
 */
export function CacheCleanup({ userId }: CacheCleanupProps) {
  useEffect(() => {
    if (userId) {
      // 清理其他用户的缓存
      cleanupOtherUsersCaches(userId)
      
      // 清理过期缓存（7天以上）
      cleanupExpiredCaches(7)
    }
  }, [userId])

  return null // 这是一个无 UI 的工具组件
}
