import { Suspense } from 'react'
import { SearchBar } from '@/components/search-bar'
import { UnifiedSearchResults } from '@/components/search/unified-search-results'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Search page with unified folder and note search
 * Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5
 */
export default function SearchPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">搜索</h1>
        <p className="text-muted-foreground">
          搜索文件夹和笔记
        </p>
      </div>

      <div className="mb-6">
        <SearchBar placeholder="搜索文件夹和笔记..." />
      </div>

      <Suspense fallback={<SearchResultsSkeleton />}>
        <UnifiedSearchResults />
      </Suspense>
    </div>
  )
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
