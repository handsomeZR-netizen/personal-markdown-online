import { NoteEditorSkeleton } from "@/components/notes/note-editor-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditNoteLoading() {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Skeleton className="h-8 w-32 mb-6" />
      <NoteEditorSkeleton />
    </div>
  )
}
