"use client"

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// Loading skeleton for AI Search Bar
function AISearchBarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

// Loading skeleton for AI QA Interface
function AIQAInterfaceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
      </div>
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Lazy load AI components
export const AISearchBarLazy = dynamic(
  () => import('./ai-search-bar').then(mod => ({ default: mod.AISearchBar })),
  {
    loading: () => <AISearchBarSkeleton />,
    ssr: false,
  }
)

export const AIQAInterfaceLazy = dynamic(
  () => import('./ai-qa-interface').then(mod => ({ default: mod.AIQAInterface })),
  {
    loading: () => <AIQAInterfaceSkeleton />,
    ssr: false,
  }
)
