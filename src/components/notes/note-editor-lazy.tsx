"use client"

import dynamic from 'next/dynamic'
import { NoteEditorSkeleton } from './note-editor-skeleton'

// Lazy load the NoteEditor component
export const NoteEditorLazy = dynamic(
  () => import('./note-editor').then(mod => ({ default: mod.NoteEditor })),
  {
    loading: () => <NoteEditorSkeleton />,
    ssr: false, // Disable SSR for the editor since it's highly interactive
  }
)
