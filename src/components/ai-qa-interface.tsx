'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, Loader2, Send, FileText, History, 
  Plus, Trash2, ChevronLeft 
} from 'lucide-react';
import { answerQuery } from '@/lib/actions/ai';
import { 
  createConversation, 
  addMessageToConversation, 
  getConversations, 
  getConversation,
  deleteConversation,
  clearAllConversations,
  saveSearchHistory
} from '@/lib/actions/ai-history';
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
}

export function AIQAInterface() {
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const result = await getConversations(20);
    if (result.success && result.data) {
      setConversations(result.data);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const handleLoadConversation = async (conversationId: string) => {
    setIsLoadingHistory(true);
    const result = await getConversation(conversationId);
    if (result.success && result.data) {
      setCurrentConversationId(conversationId);
      setMessages(result.data.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        relatedNotes: msg.relatedNotes,
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
    const result = await clearAllConversations();
    if (result.success) {
      setConversations([]);
      handleNewConversation();
      toast.success('所有对话已清空');
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('请输入问题');
      return;
    }

    // 如果没有当前对话，创建新对话
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

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: query,
    };
    setMessages(prev => [...prev, userMessage]);
    
    const currentQuery = query;
    setQuery('');
    setIsAsking(true);

    try {
      // 保存用户消息到数据库
      await addMessageToConversation(conversationId, 'user', currentQuery);
      
      // 保存搜索历史
      await saveSearchHistory(currentQuery, 'natural_language', 0);

      const result = await answerQuery(currentQuery, 5);
      
      if (result.success) {
        // Add assistant message
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
        toast.error(result.error);
        // Remove user message if failed
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      toast.error('提问失败');
      // Remove user message if failed
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
    
    if (days === 0) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showHistory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(false)}
            >
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
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                disabled={conversations.length === 0}
              >
                <History className="h-4 w-4 mr-1" />
                历史 ({conversations.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
              >
                <Plus className="h-4 w-4 mr-1" />
                新对话
              </Button>
            </>
          )}
          {showHistory && conversations.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAllConversations}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              清空全部
            </Button>
          )}
        </div>
      </div>

      {/* 对话历史列表 */}
      {showHistory ? (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {conversations.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  暂无对话历史
                </p>
              </CardContent>
            </Card>
          ) : (
            conversations.map((conv) => (
              <Card
                key={conv.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  currentConversationId === conv.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleLoadConversation(conv.id)}
              >
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.title || '新对话'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conv.updatedAt)}
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
      ) : (
        <>
          {/* Messages */}
          {messages.length > 0 && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border rounded-lg bg-muted/30">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Related notes */}
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
                              className="flex items-center justify-between gap-2 text-xs hover:underline"
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
              
              {isAsking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-background border">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">AI 正在思考...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleAsk} className="flex gap-2">
            <Input
              type="text"
              placeholder={t('ai.askQuestion')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isAsking || isLoadingHistory}
              className="flex-1"
            />
            <Button type="submit" disabled={isAsking || !query.trim() || isLoadingHistory}>
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

          {messages.length === 0 && (
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">
                  向 AI 提问关于您笔记的任何问题，AI 会基于您的笔记内容给出回答。
                  <br />
                  <span className="text-xs">对话将自动保存到历史记录中。</span>
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
