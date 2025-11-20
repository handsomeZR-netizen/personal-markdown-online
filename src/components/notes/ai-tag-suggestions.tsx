'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { suggestTags } from '@/lib/actions/ai';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';

interface AITagSuggestionsProps {
  content: string;
  title?: string;
  onSelectTag: (tag: string) => void;
  selectedTags: string[];
}

export function AITagSuggestions({
  content,
  title,
  onSelectTag,
  selectedTags,
}: AITagSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSuggestTags = async () => {
    if (!content || content.trim().length < 10) {
      toast.error('内容太短，无法生成标签建议');
      return;
    }

    setIsLoading(true);
    try {
      const result = await suggestTags(content, title);
      
      if (result.success) {
        setSuggestions(result.data);
        toast.success('AI 标签建议生成成功');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('生成标签建议失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (tag: string) => {
    await onSelectTag(tag);
    // Remove the selected tag from suggestions
    setSuggestions(prev => prev.filter(t => t !== tag));
    toast.success(`已添加标签: ${tag}`);
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSuggestTags}
        disabled={isLoading || !content || content.trim().length < 10}
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

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            点击标签添加到笔记：
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "secondary"}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary hover:text-primary-foreground'
                  }`}
                  onClick={() => !isSelected && handleSelectSuggestion(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
