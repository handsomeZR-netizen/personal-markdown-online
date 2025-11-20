/**
 * DeepSeek AI API 客户端
 * 提供与 DeepSeek API 交互的工具函数
 */

import { getCurrentAIConfig } from './config';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1';

/**
 * 获取当前API配置（仅使用用户配置，不使用环境变量）
 * 注意：不再自动使用开发者的 API Key
 */
function getAPIConfig() {
  const config = getCurrentAIConfig();
  return {
    apiKey: config.apiKey || '', // 不再使用环境变量作为后备
    apiUrl: config.apiUrl || DEEPSEEK_API_URL,
    model: config.model || 'deepseek-chat',
  };
}

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'DeepSeekError';
  }
}

/**
 * 调用 DeepSeek API
 * @param messages - 对话消息数组
 * @param options - API 选项
 * @returns DeepSeek API 响应
 */
export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {}
): Promise<DeepSeekResponse> {
  const config = getAPIConfig();
  
  if (!config.apiKey) {
    throw new DeepSeekError('API key 未配置，请在设置中配置');
  }

  const {
    model = config.model,
    temperature = 0.7,
    max_tokens = 2000,
    top_p = 1,
    stream = false,
  } = options;

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens,
    top_p,
    stream,
  };

  try {
    const response = await fetch(`${config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DeepSeekError(
        errorData.error?.message || `API 请求失败: ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof DeepSeekError) {
      throw error;
    }
    throw new DeepSeekError(
      `DeepSeek API 调用失败: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}

/**
 * 带重试逻辑的 DeepSeek API 调用
 * @param messages - 对话消息数组
 * @param options - API 选项
 * @param maxRetries - 最大重试次数
 * @param retryDelay - 重试延迟（毫秒）
 * @returns DeepSeek API 响应
 */
export async function callDeepSeekWithRetry(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<DeepSeekResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callDeepSeek(messages, options);
    } catch (error) {
      lastError = error as Error;

      // 如果是客户端错误（4xx），不重试
      if (error instanceof DeepSeekError && error.statusCode && error.statusCode < 500) {
        throw error;
      }

      // 如果还有重试机会，等待后重试
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new DeepSeekError('API 调用失败');
}

/**
 * 简化的单次对话调用
 * @param prompt - 用户提示
 * @param systemPrompt - 系统提示（可选）
 * @param options - API 选项
 * @returns AI 生成的文本内容
 */
export async function simpleChat(
  prompt: string,
  systemPrompt?: string,
  options: DeepSeekOptions = {}
): Promise<string> {
  const messages: DeepSeekMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await callDeepSeekWithRetry(messages, options);
  return response.choices[0]?.message?.content || '';
}

/**
 * 流式响应 DeepSeek API
 * @param prompt - 用户提示
 * @param systemPrompt - 系统提示（可选）
 * @returns ReadableStream
 */
export async function streamDeepSeekResponse(
  prompt: string,
  systemPrompt?: string
): Promise<ReadableStream> {
  const config = getAPIConfig();
  
  if (!config.apiKey) {
    throw new DeepSeekError('API key 未配置，请在设置中配置');
  }

  const messages: DeepSeekMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new DeepSeekError(`API 请求失败: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new DeepSeekError('无法读取响应流');
  }

  return new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
