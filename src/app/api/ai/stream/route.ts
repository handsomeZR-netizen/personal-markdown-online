import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

/**
 * 使用服务器端默认 API Key 进行流式调用
 * 这个路由使用 Vercel 环境变量中的 DEEPSEEK_API_KEY
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return new Response('未授权', { status: 401 });
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('缺少必要参数', { status: 400 });
    }

    // 从环境变量获取 API 配置
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';
    const model = 'deepseek-chat';

    if (!apiKey) {
      return new Response('服务器未配置 AI API，请在设置中配置您自己的 API Key', { 
        status: 503 
      });
    }

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
      return new Response(`API 请求失败: ${response.status}`, { 
        status: response.status 
      });
    }

    // 直接返回流式响应
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Stream 错误:', error);
    return new Response(
      error instanceof Error ? error.message : '服务器错误',
      { status: 500 }
    );
  }
}
