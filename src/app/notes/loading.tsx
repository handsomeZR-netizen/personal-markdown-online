import { NoteListSkeleton } from "@/components/notes/note-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotesLoading() {
  return (
    <div className="container mx-auto p-4">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Search and filters skeleton */}
      <div className="mb-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Notes list skeleton */}
      <NoteListSkeleton count={6} />

      {/* Pagination skeleton */}
      <div className="mt-6 flex justify-center">
        <Skeleton className="h-10 w-64" />
      </div>
    </div>
  )
}
