'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Send, FileText } from 'lucide-react';
import { answerQuery } from '@/lib/actions/ai';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  relatedNotes?: Array<{ id: string; title: string; similarity: number }>;
}

export function AIQAInterface() {
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('请输入问题');
      return;
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
      const result = await answerQuery(currentQuery, 5);
      
      if (result.success) {
        // Add assistant message
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.data.answer,
          relatedNotes: result.data.relatedNotes,
        };
        setMessages(prev => [...prev, assistantMessage]);
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

  const handleClearHistory = () => {
    setMessages([]);
    toast.success('对话历史已清除');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('ai.naturalLanguageQuery')}</h2>
        </div>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
          >
            清除历史
          </Button>
        )}
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border rounded-lg bg-muted/30">
          {messages.map((message, index) => (
            <div
              key={index}
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
          disabled={isAsking}
          className="flex-1"
        />
        <Button type="submit" disabled={isAsking || !query.trim()}>
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
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
