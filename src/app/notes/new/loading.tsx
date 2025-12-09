import { CreativeLoader } from '@/components/ui/creative-loader';

export default function NewNoteLoading() {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-6" />
      <div className="flex items-center justify-center min-h-[400px]">
        <CreativeLoader variant="orbit" size="lg" message="准备编辑器..." />
      </div>
    </div>
  );
}
