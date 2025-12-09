"use client";

/**
 * Lazy-loaded Version History Component
 * Reduces initial bundle size by loading version history on demand
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface VersionHistoryProps {
  noteId: string;
  trigger?: React.ReactNode;
}

// Loading skeleton for version history
function VersionHistorySkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-full" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lazy load the VersionHistory component
export const VersionHistoryLazy = dynamic<VersionHistoryProps>(
  () => import('./version-history').then((mod) => ({ default: mod.VersionHistory })),
  {
    loading: () => <VersionHistorySkeleton />,
    ssr: false, // Version history is client-side only
  }
);
