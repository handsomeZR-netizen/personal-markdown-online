import { Skeleton } from '@/components/ui/skeleton';

export function FolderTreeSkeleton({ depth = 3, itemsPerLevel = 4 }: { depth?: number; itemsPerLevel?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: itemsPerLevel }).map((_, index) => (
        <FolderItemSkeleton key={index} level={0} depth={depth} />
      ))}
    </div>
  );
}

function FolderItemSkeleton({ level, depth }: { level: number; depth: number }) {
  const hasChildren = level < depth - 1;
  const childCount = Math.floor(Math.random() * 3) + 1;
  
  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      {/* Folder item */}
      <div className="flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
        {/* Expand icon */}
        <Skeleton className="h-4 w-4 flex-shrink-0" />
        
        {/* Folder icon */}
        <Skeleton className="h-4 w-4 flex-shrink-0" />
        
        {/* Folder name */}
        <Skeleton className="h-4 flex-1" style={{ width: `${Math.random() * 40 + 60}%` }} />
        
        {/* Count badge */}
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      
      {/* Children */}
      {hasChildren && (
        <div className="mt-1">
          {Array.from({ length: childCount }).map((_, index) => (
            <FolderItemSkeleton key={index} level={level + 1} depth={depth} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderBreadcrumbsSkeleton() {
  return (
    <div className="flex items-center gap-2 py-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function FolderSidebarSkeleton() {
  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      
      {/* Search */}
      <Skeleton className="h-10 w-full rounded-lg" />
      
      {/* Tree */}
      <FolderTreeSkeleton depth={3} itemsPerLevel={5} />
    </div>
  );
}
