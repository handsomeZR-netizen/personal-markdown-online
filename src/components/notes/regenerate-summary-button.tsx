'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { regenerateNoteSummary } from '@/lib/actions/notes';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

interface RegenerateSummaryButtonProps {
  noteId: string;
}

export function RegenerateSummaryButton({ noteId }: RegenerateSummaryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegenerate = async () => {
    setIsLoading(true);
    try {
      const result = await regenerateNoteSummary(noteId);
      
      if (result.success) {
        toast.success('摘要已重新生成');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('重新生成摘要失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t('ai.generating')}
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('ai.regenerateSummary')}
        </>
      )}
    </Button>
  );
}
