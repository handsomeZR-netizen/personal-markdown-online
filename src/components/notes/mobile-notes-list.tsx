"use client"

import { SwipeableNoteCard } from "./swipeable-note-card"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { useRouter } from "next/navigation"

type MobileNotesListProps = {
  notes: Array<{
    id: string
    title: string
    content: string
    summary?: string | null
    createdAt: Date
    updatedAt: Date
    tags: Array<{ id: string; name: string }>
    category: { id: string; name: string } | null
  }>
}

/**
 * 移动端笔记列表组件
 * Mobile-optimized notes list with gesture support
 * 
 * Features:
 * - Pull-to-refresh to reload notes
 * - Swipeable note cards with quick actions
 * - Touch-optimized layout
 * - Smooth animations
 */
export function MobileNotesList({ notes }: MobileNotesListProps) {
  const router = useRouter()

  const handleRefresh = async () => {
    // Refresh the page data
    router.refresh()
    
    // Optional: Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 p-4">
        {notes.map((note) => (
          <SwipeableNoteCard key={note.id} note={note} />
        ))}
        
        {notes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无笔记</p>
            <p className="text-sm mt-2">下拉刷新或创建新笔记</p>
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
