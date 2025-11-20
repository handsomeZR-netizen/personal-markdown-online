"use client"

import { useRouter } from "next/navigation"
import { useSwipe } from "@/hooks/use-swipe"

interface NoteDetailWrapperProps {
  children: React.ReactNode
  noteId: string
}

/**
 * 笔记详情包装组件，支持滑动手势
 * Note detail wrapper with swipe gesture support
 */
export function NoteDetailWrapper({ children, noteId }: NoteDetailWrapperProps) {
  const router = useRouter()

  const swipeHandlers = useSwipe({
    onSwipeRight: () => {
      // 向右滑动返回列表
      router.back()
    },
    minSwipeDistance: 100,
  })

  return (
    <div {...swipeHandlers} className="min-h-screen">
      {children}
    </div>
  )
}
