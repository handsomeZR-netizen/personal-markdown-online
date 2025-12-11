"use client"

import dynamic from 'next/dynamic'
import { NoteEditorSkeleton } from './note-editor-skeleton'

interface RecentNote {
  id: string
  title: string
  updatedAt: Date
}

interface NoteEditorLazyProps {
  note?: {
    id: string
    title: string
    content: string
    tags?: Array<{ id: string; name: string }>
    categoryId?: string | null
  }
  userId?: string | null
  recentNotes?: RecentNote[]
}

// Lazy load the NoteEditor component
const DynamicNoteEditor = dynamic(
  () => import('./note-editor').then(mod => ({ default: mod.NoteEditor })),
  {
    loading: () => <NoteEditorSkeleton />,
    ssr: false, // Disable SSR for the editor since it's highly interactive
  }
)

export function NoteEditorLazy({ note, userId, recentNotes }: NoteEditorLazyProps) {
  return <DynamicNoteEditor note={note} userId={userId} recentNotes={recentNotes} />
}
