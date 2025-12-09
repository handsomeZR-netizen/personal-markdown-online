"use client";

/**
 * Lazy-loaded Tiptap Editor Component
 * Reduces initial bundle size by loading the rich text editor on demand
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface TiptapEditorProps {
  noteId: string;
  initialContent?: string;
  userId: string;
  userName: string;
  userColor: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

// Loading skeleton for Tiptap editor
function TiptapEditorSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 p-2 border rounded-lg">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <div className="w-px h-6 bg-border mx-2" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <div className="w-px h-6 bg-border mx-2" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
      
      {/* Editor content skeleton */}
      <div className="border rounded-lg p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="py-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

// Lazy load the TiptapEditor component
export const TiptapEditorLazy = dynamic<TiptapEditorProps>(
  () => import('./tiptap-editor').then((mod) => ({ default: mod.TiptapEditor })),
  {
    loading: () => <TiptapEditorSkeleton />,
    ssr: false, // Tiptap editor is client-side only
  }
);
