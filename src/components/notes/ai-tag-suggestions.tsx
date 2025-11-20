'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { suggestTags } from '@/lib/actions/ai';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

interface AITagSuggestionsProps {
  content: string;
  title?: string;
  onAddTags: (tags: string[]) => Promise<void>;
}

export function AITagSuggestions({
  content,
  title,
  onAddTags,
}: AITagSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSuggestTags = async () => {
    // 使用标题和内容的组合来判断
    const combinedContent = `${title || ''} ${content || ''}`.trim();
    
    if (!combinedContent || combinedContent.length < 5) {
      toast.error('请先输入标题或内容');
      return;
    }

    setIsLoading(true);
    try {
      const result = await suggestTags(content || '', title);
      
      if (result.success && result.data.length > 0) {
        // 直接将所有建议的标签添加到标签栏
        await onAddTags(result.data);
        toast.success(`已添加 ${result.data.length} 个AI建议标签`);
      } else {
        toast.error('未能生成标签建议');
      }
    } catch (error) {
      toast.error('生成标签建议失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 判断是否可以生成标签：标题或内容至少有一个有内容
  const canGenerate = (title && title.trim().length > 0) || (content && content.trim().length > 0);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSuggestTags}
      disabled={isLoading || !canGenerate}
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t('ai.generating')}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          {t('ai.suggestTags')}
        </>
      )}
    </Button>
  );
}
