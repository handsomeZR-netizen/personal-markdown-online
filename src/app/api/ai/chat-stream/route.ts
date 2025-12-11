import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * 流式 AI 问答 API
 * 支持基于笔记内容的上下文问答，实时流式输出
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: '未授权' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { query, conversationId, includeNotes = true, maxNotes = 5 } = await request.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: '缺少查询内容' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 从环境变量获取 API 配置
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
    const model = 'deepseek-chat';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务器未配置 AI API' }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取相关笔记作为上下文
    let relatedNotes: Array<{ id: string; title: string; content: string; similarity: number }> = [];
    
    if (includeNotes) {
      // 简单的关键词匹配搜索相关笔记
      const notes = await prisma.note.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { title: { contains: query.substring(0, 50), mode: 'insensitive' } },
            { content: { contains: query.substring(0, 50), mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
        },
        take: maxNotes,
      });

      relatedNotes = notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content.substring(0, 2000), // 限制内容长度
        similarity: 0.8, // 简化的相似度
      }));
    }

    // 构建消息
    const messages: Array<{ role: string; content: string }> = [];
    
    // 系统提示
    let systemPrompt = '你是一个专业的笔记助手，擅长从用户的笔记中提取信息并回答问题。请用 Markdown 格式回答，支持数学公式（使用 $...$ 或 $$...$$）。';
    
    if (relatedNotes.length > 0) {
      const context = relatedNotes
        .map((note, i) => `【笔记${i + 1}: ${note.title}】\n${note.content}`)
        .join('\n\n---\n\n');
      
      systemPrompt += `\n\n以下是用户的相关笔记内容，请基于这些内容回答问题：\n\n${context}`;
    }

    messages.push({ role: 'system', content: systemPrompt });

    // 如果有对话历史，加载最近的消息
    if (conversationId) {
      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, userId: session.user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10, // 最近10条消息
          },
        },
      });

      if (conversation) {
        for (const msg of conversation.messages) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }
    }

    // 添加当前用户问题
    messages.push({ role: 'user', content: query });

    // 调用 DeepSeek API（流式）
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API 错误:', errorText);
      return new Response(JSON.stringify({ error: `API 请求失败: ${response.status}` }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建转换流，添加相关笔记信息到第一个数据块
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let isFirstChunk = true;
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        
        // 在第一个数据块前发送相关笔记信息
        if (isFirstChunk && relatedNotes.length > 0) {
          const notesData = JSON.stringify({
            type: 'related_notes',
            notes: relatedNotes.map(n => ({
              id: n.id,
              title: n.title,
              similarity: n.similarity,
            })),
          });
          controller.enqueue(encoder.encode(`data: ${notesData}\n\n`));
          isFirstChunk = false;
        }
        
        controller.enqueue(chunk);
      },
    });

    // 返回流式响应
    const stream = response.body?.pipeThrough(transformStream);
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Chat Stream 错误:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
