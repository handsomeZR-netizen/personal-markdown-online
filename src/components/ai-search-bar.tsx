'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Search, History, X, Clock, Trash2 } from 'lucide-react';
import { semanticSearch } from '@/lib/actions/ai';
import { saveSearchHistory, getSearchHistory, deleteSearchHistory, clearSearchHistory } from '@/lib/actions/ai-history';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import Link from 'next/link';

interface SearchHistoryItem {
  id: string;
  query: string;
  resultCount: number;
  createdAt: Date;
}

export function AISearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [results, setResults] = useState<Array<{
    id: string;
    title: string;
    content: string;
    summary: string | null;
    similarity: number;
  }>>([]);

  // 加载搜索历史
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const result = await getSearchHistory('semantic', 10);
    if (result.success && result.data) {
      setHistory(result.data);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('请输入搜索内容');
      return;
    }

    setIsSearching(true);
    setShowHistory(false);
    
    try {
      const result = await semanticSearch(query, 10);
      
      if (result.success) {
        setResults(result.data);
        
        // 保存搜索历史
        await saveSearchHistory(query, 'semantic', result.data.length);
        await loadHistory();
        
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

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteSearchHistory(id);
    if (result.success) {
      await loadHistory();
    }
  };

  const handleClearHistory = async () => {
    const result = await clearSearchHistory('semantic');
    if (result.success) {
      setHistory([]);
      toast.success('搜索历史已清空');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            onFocus={() => history.length > 0 && setShowHistory(true)}
            className="pl-10 pr-10"
          />
          {history.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4" />
            </Button>
          )}
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

      {/* 搜索历史下拉 */}
      {showHistory && history.length > 0 && (
        <Card className="absolute z-10 w-full max-w-[calc(100%-120px)] shadow-lg">
          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              搜索历史
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleClearHistory}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              清空
            </Button>
          </CardHeader>
          <CardContent className="py-1 px-1">
            <div className="space-y-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded cursor-pointer group"
                  onClick={() => handleHistoryClick(item.query)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Search className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{item.query}</span>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {item.resultCount} 结果
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDeleteHistory(item.id, e)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
