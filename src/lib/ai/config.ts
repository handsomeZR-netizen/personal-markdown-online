/**
 * AI API 配置管理
 */

export type AIProvider = 'deepseek' | 'openai' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  apiUrl: string;
  model: string;
}

export const DEFAULT_CONFIGS: Record<AIProvider, Omit<AIConfig, 'apiKey'>> = {
  deepseek: {
    provider: 'deepseek',
    apiUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  openai: {
    provider: 'openai',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
  },
  custom: {
    provider: 'custom',
    apiUrl: '',
    model: '',
  },
};

const CONFIG_KEY = 'ai-config';

/**
 * 获取用户自定义的AI配置（仅从localStorage读取）
 * 注意：此函数只返回用户配置，不包含环境变量
 */
export function getAIConfig(): AIConfig | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      // 确保配置包含必要字段
      if (config && config.apiKey && config.provider) {
        return config;
      }
    }
  } catch (error) {
    console.error('Failed to load AI config:', error);
  }
  
  return null;
}

/**
 * 保存AI配置
 */
export function saveAIConfig(config: AIConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save AI config:', error);
  }
}

/**
 * 检查是否使用免费体验API
 * 只有当用户在localStorage中保存了有效配置时才返回false
 */
export function isUsingFreeAPI(): boolean {
  if (typeof window === 'undefined') return true;
  
  const userConfig = getAIConfig();
  // 只有用户明确配置了API Key才返回false
  return userConfig === null || !userConfig.apiKey || userConfig.apiKey.trim() === '';
}

/**
 * 获取当前使用的API配置（仅使用用户配置）
 * 注意：不再自动使用环境变量中的 API Key
 */
export function getCurrentAIConfig(): AIConfig {
  // 只使用用户自定义配置
  const userConfig = getAIConfig();
  if (userConfig && userConfig.apiKey) {
    return userConfig;
  }
  
  // 返回默认配置（无API Key）
  return {
    provider: 'deepseek',
    apiKey: '',
    apiUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  };
}

/**
 * 测试API配置是否有效（通过API路由）
 */
export async function testAIConfig(config: AIConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/ai/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        model: config.model,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    };
  }
}
