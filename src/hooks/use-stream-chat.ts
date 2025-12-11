'use client';

import { useState, useCallback, useRef } from 'react';

interface RelatedNote {
  id: string;
  title: string;
  similarity: number;
}

interface StreamChatOptions {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (content: string, relatedNotes: RelatedNote[]) => void;
  onError?: (error: string) => void;
}

interface StreamChatState {
  isStreaming: boolean;
  content: string;
  relatedNotes: RelatedNote[];
  error: string | null;
}

/**
 * 流式聊天 Hook
 * 支持实时流式输出 AI 回复
 */
export function useStreamChat(options: StreamChatOptions = {}) {
  const [state, setState] = useState<StreamChatState>({
    isStreaming: false,
    content: '',
    relatedNotes: [],
    error: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    query: string,
    conversationId?: string,
    includeNotes: boolean = true
  ) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState({
      isStreaming: true,
      content: '',
      relatedNotes: [],
      error: null,
    });

    options.onStart?.();

    try {
      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversationId, includeNotes }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      let relatedNotes: RelatedNote[] = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              // 处理相关笔记信息
              if (parsed.type === 'related_notes') {
                relatedNotes = parsed.notes;
                setState(prev => ({ ...prev, relatedNotes }));
                continue;
              }

              // 处理 OpenAI 格式的流式响应
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setState(prev => ({ ...prev, content: fullContent }));
                options.onToken?.(content);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      setState(prev => ({ ...prev, isStreaming: false }));
      options.onComplete?.(fullContent, relatedNotes);

      return { content: fullContent, relatedNotes };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setState(prev => ({ ...prev, isStreaming: false }));
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : '发送消息失败';
      setState(prev => ({ 
        ...prev, 
        isStreaming: false, 
        error: errorMessage 
      }));
      options.onError?.(errorMessage);
      throw error;
    }
  }, [options]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  const reset = useCallback(() => {
    stopStreaming();
    setState({
      isStreaming: false,
      content: '',
      relatedNotes: [],
      error: null,
    });
  }, [stopStreaming]);

  return {
    ...state,
    sendMessage,
    stopStreaming,
    reset,
  };
}
