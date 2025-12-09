"use client";

/**
 * Lazy-loaded Export Dialog Component
 * Reduces initial bundle size by loading export functionality on demand
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { NoteData } from '@/lib/export/export-manager';

interface ExportDialogProps {
  note: NoteData;
  trigger?: React.ReactNode;
}

// Loading skeleton for export dialog
function ExportDialogSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex justify-end gap-3">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Lazy load the ExportDialog component
export const ExportDialogLazy = dynamic<ExportDialogProps>(
  () => import('./export-dialog').then((mod) => ({ default: mod.ExportDialog })),
  {
    loading: () => <ExportDialogSkeleton />,
    ssr: false, // Export functionality is client-side only
  }
);
