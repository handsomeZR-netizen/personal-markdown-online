'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, Loader2, Send, FileText, History, 
  Plus, Trash2, ChevronLeft, Search, X
} from 'lucide-react';
import { answerQuery } from '@/lib/actions/ai';
import { 
  createConversation, 
  addMessageToConversation, 
  getConversations, 
  getConversation,
  deleteConversation,
  clearAllConversations,
  saveSearchHistory,
  searchConversations,
} from '@/lib/actions/ai-history';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import Link from 'next/link';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  relatedNotes?: Array<{ id: string; title: string; similarity: number }>;
}

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
  messageCount?: number;
}

export function AIQAInterface() {
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadConversations = async () => {
    const result = await getConversations(50);
    if (result.success && result.data) {
      setConversations(result.data);
    }
  };

  const handleSearchConversations = async () => {
    if (!searchKeyword.trim()) {
      await loadConversations();
      return;
    }
    setIsSearching(true);
    const result = await searchConversations(searchKeyword.trim());
    if (result.success && result.data) {
      setConversations(result.data);
    }
    setIsSearching(false);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const handleLoadConversation = async (conversationId: string) => {
    setIsLoadingHistory(true);
    const result = await getConversation(conversationId);
    if (result.success && result.data) {
      setCurrentConversationId(conversationId);
      setMessages(result.data.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        relatedNotes: msg.relatedNotes || undefined,
      })));
      setShowHistory(false);
    }
    setIsLoadingHistory(false);
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await deleteConversation(conversationId);
    if (result.success) {
      await loadConversations();
      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
      toast.success('对话已删除');
    }
  };

  const handleClearAllConversations = async () => {
    if (!confirm('确定要清空所有对话历史吗？')) return;
    const result = await clearAllConversations();
    if (result.success) {
      setConversations([]);
      handleNewConversation();
      toast.success('所有对话已清空');
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isAsking) return;

    // 创建或获取对话 ID
    let conversationId = currentConversationId;
    if (!conversationId) {
      const createResult = await createConversation();
      if (!createResult.success || !createResult.data) {
        toast.error('创建对话失败');
        return;
      }
      conversationId = createResult.data.id;
      setCurrentConversationId(conversationId);
    }

    // 添加用户消息到界面
    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    
    const currentQuery = query;
    setQuery('');
    setIsAsking(true);

    try {
      // 保存用户消息到数据库
      await addMessageToConversation(conversationId, 'user', currentQuery);
      
      // 保存搜索历史
      await saveSearchHistory(currentQuery, 'natural_language', 0);

      // 调用原来的 answerQuery action（使用数据库查询笔记）
      const result = await answerQuery(currentQuery, 5);
      
      if (result.success) {
        // 添加 AI 回复到界面
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.data.answer,
          relatedNotes: result.data.relatedNotes,
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // 保存 AI 回复到数据库
        await addMessageToConversation(
          conversationId, 
          'assistant', 
          result.data.answer,
          result.data.relatedNotes
        );
        
        // 刷新对话列表
        await loadConversations();
      } else {
        toast.error(result.error || '提问失败');
        // 移除用户消息
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('AI 问答错误:', error);
      toast.error('提问失败，请重试');
      // 移除用户消息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAsking(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showHistory && (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {showHistory ? '对话历史' : t('ai.naturalLanguageQuery')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {!showHistory && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setShowHistory(true); loadConversations(); }}
              >
                <History className="h-4 w-4 mr-1" />
                历史 ({conversations.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleNewConversation}>
                <Plus className="h-4 w-4 mr-1" />
                新对话
              </Button>
            </>
          )}
          {showHistory && conversations.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAllConversations}>
              <Trash2 className="h-4 w-4 mr-1" />
              清空全部
            </Button>
          )}
        </div>
      </div>

      {/* 对话历史列表 */}
      {showHistory ? (
        <div className="space-y-3">
          {/* 搜索框 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索对话历史..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchConversations()}
                className="pl-9 pr-9"
              />
              {searchKeyword && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => { setSearchKeyword(''); loadConversations(); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={handleSearchConversations} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : '搜索'}
            </Button>
          </div>

          {/* 对话列表 */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {conversations.length === 0 ? (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center">
                      {searchKeyword ? '未找到匹配的对话' : '暂无对话历史'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                conversations.map((conv) => (
                  <Card
                    key={conv.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow group ${
                      currentConversationId === conv.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleLoadConversation(conv.id)}
                  >
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title || '新对话'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(conv.updatedAt)}
                          {conv.messageCount !== undefined && ` · ${conv.messageCount} 条消息`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <>
          {/* 消息列表 */}
          {messages.length > 0 && (
            <ScrollArea className="h-[500px] p-4 border rounded-lg bg-muted/30">
              <div className="space-y-4 pr-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="text-sm">
                          <MarkdownRenderer content={message.content} />
                        </div>
                      )}
                      
                      {/* 相关笔记 */}
                      {message.relatedNotes && message.relatedNotes.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t('ai.relatedNotes')}:
                          </p>
                          <div className="space-y-1">
                            {message.relatedNotes.map((note) => (
                              <Link
                                key={note.id}
                                href={`/notes/${note.id}`}
                                className="flex items-center justify-between gap-2 text-xs hover:underline text-primary"
                              >
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  <span className="truncate">{note.title}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(note.similarity * 100)}%
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* 加载中状态 */}
                {isAsking && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg p-3 bg-background border">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">AI 正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* 输入表单 */}
          <form onSubmit={handleAsk} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder={t('ai.askQuestion')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isAsking || isLoadingHistory}
              className="flex-1"
            />
            <Button type="submit" disabled={!query.trim() || isAsking || isLoadingHistory}>
              {isAsking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  提问
                </>
              )}
            </Button>
          </form>

          {/* 空状态提示 */}
          {messages.length === 0 && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  向 AI 提问关于您笔记的任何问题，AI 会基于您的笔记内容给出回答。
                  <br />
                  <span className="text-xs">支持 Markdown 格式和数学公式渲染，对话将自动保存。</span>
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
