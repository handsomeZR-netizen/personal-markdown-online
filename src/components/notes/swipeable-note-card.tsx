"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteNote } from "@/lib/actions/notes"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { NoteCard } from "./note-card"

type SwipeableNoteCardProps = {
  note: {
    id: string
    title: string
    content: string
    summary?: string | null
    createdAt: Date
    updatedAt: Date
    tags: Array<{ id: string; name: string }>
    category: { id: string; name: string } | null
  }
}

/**
 * 可滑动的笔记卡片组件
 * Swipeable note card with action buttons (Requirement 12.4)
 * 
 * Features:
 * - Swipe left to reveal edit and delete buttons
 * - Smooth animation with spring physics
 * - Auto-close on tap outside
 * - Touch-friendly button sizes (44x44px)
 * - Haptic feedback on action
 */
export function SwipeableNoteCard({ note }: SwipeableNoteCardProps) {
  const router = useRouter()
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const actionButtonsWidth = 120 // 两个按钮的总宽度
  const swipeThreshold = 50 // 触发打开的最小滑动距离

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
  }

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX
    const diff = touchStartX.current - touchCurrentX.current

    // 只允许向左滑动
    if (diff > 0) {
      const offset = Math.min(diff, actionButtonsWidth)
      setSwipeOffset(offset)
    } else if (isOpen) {
      // 如果已经打开，允许向右滑动关闭
      const offset = Math.max(actionButtonsWidth + diff, 0)
      setSwipeOffset(offset)
    }
  }

  // 处理触摸结束
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchCurrentX.current

    if (isOpen) {
      // 如果已经打开，向右滑动超过阈值则关闭
      if (diff < -swipeThreshold) {
        setIsOpen(false)
        setSwipeOffset(0)
      } else {
        // 否则保持打开
        setSwipeOffset(actionButtonsWidth)
      }
    } else {
      // 如果未打开，向左滑动超过阈值则打开
      if (diff > swipeThreshold) {
        setIsOpen(true)
        setSwipeOffset(actionButtonsWidth)
      } else {
        // 否则回弹
        setSwipeOffset(0)
      }
    }
  }

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSwipeOffset(0)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // 处理编辑
  const handleEdit = () => {
    router.push(`/notes/${note.id}`)
  }

  // 处理删除
  const handleDelete = async () => {
    if (confirm(t('notes.confirmDelete'))) {
      try {
        await deleteNote(note.id)
        // 触发触觉反馈（如果支持）
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
    }
  }

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden md:overflow-visible"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 操作按钮背景层 */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 md:hidden",
          "transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        style={{ width: `${actionButtonsWidth}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleEdit}
          aria-label={t('notes.editNote')}
        >
          <Edit className="h-5 w-5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={handleDelete}
          aria-label={t('notes.deleteNote')}
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* 笔记卡片 - 可滑动层 */}
      <div
        className="transition-transform duration-200 ease-out md:transform-none"
        style={{
          transform: `translateX(-${swipeOffset}px)`,
        }}
      >
        <NoteCard note={note} />
      </div>
    </div>
  )
}
