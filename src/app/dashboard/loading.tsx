import { NoteListSkeleton } from "@/components/notes/note-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-4">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Recent notes skeleton */}
      <div className="mb-4">
        <Skeleton className="h-6 w-32 mb-4" />
      </div>
      <NoteListSkeleton count={6} />
    </div>
  )
}
