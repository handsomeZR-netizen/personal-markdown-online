import { NoteListSkeleton } from '@/components/loading/note-list-skeleton';

export default function NotesLoading() {
  return (
    <div className="container mx-auto p-4">
      {/* 头部骨架 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </div>
        <div className="h-10 w-full sm:w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>

      {/* 搜索栏骨架 */}
      <div className="mb-6">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>

      {/* 笔记列表骨架 */}
      <NoteListSkeleton count={6} />
    </div>
  );
}
