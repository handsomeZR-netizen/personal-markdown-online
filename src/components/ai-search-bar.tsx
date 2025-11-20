'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Search } from 'lucide-react';
import { semanticSearch } from '@/lib/actions/ai';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import Link from 'next/link';

export function AISearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{
    id: string;
    title: string;
    content: string;
    summary: string | null;
    similarity: number;
  }>>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('请输入搜索内容');
      return;
    }

    setIsSearching(true);
    try {
      const result = await semanticSearch(query, 10);
      
      if (result.success) {
        setResults(result.data);
        if (result.data.length === 0) {
          toast.info('未找到相关笔记');
        } else {
          toast.success(`找到 ${result.data.length} 条相关笔记`);
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('搜索失败');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('ai.aiSearchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              搜索中...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              {t('ai.semanticSearch')}
            </>
          )}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            搜索结果 ({results.length})
          </h3>
          <div className="space-y-2">
            {results.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{note.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(note.similarity * 100)}% 匹配
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.summary || note.content.substring(0, 150) + '...'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
