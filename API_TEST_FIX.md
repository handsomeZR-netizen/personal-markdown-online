# API测试功能修复

## 问题描述
在客户端组件中直接调用服务端API导致 `TypeError: Failed to fetch` 错误。

## 原因分析
`testAIConfig` 函数在客户端组件中直接向外部API发起请求，但由于浏览器的CORS限制和安全策略，导致请求失败。

## 解决方案

### 1. 创建API路由
创建 `/api/ai/test` 路由处理API测试请求：

```typescript
// src/app/api/ai/test/route.ts
export async function POST(request: NextRequest) {
  const { apiKey, apiUrl, model } = await request.json();
  
  // 在服务端发起测试请求
  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    }),
  });
  
  // 返回测试结果
  return NextResponse.json({ success: response.ok });
}
```

### 2. 更新配置管理
修改 `testAIConfig` 函数，改为调用内部API路由：

```typescript
// src/lib/ai/config.ts
export async function testAIConfig(config: AIConfig) {
  const response = await fetch('/api/ai/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      model: config.model,
    }),
  });
  
  return await response.json();
}
```

### 3. 修复环境变量访问
更新 `getCurrentAIConfig` 函数，避免在客户端访问 `process.env`：

```typescript
export function getCurrentAIConfig(): AIConfig {
  const userConfig = getAIConfig();
  if (userConfig && userConfig.apiKey) {
    return userConfig;
  }
  
  // 仅在服务端使用环境变量
  if (typeof window === 'undefined') {
    return {
      provider: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
    };
  }
  
  // 客户端返回默认配置
  return {
    provider: 'deepseek',
    apiKey: '',
    apiUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  };
}
```

## 架构改进

### 之前的流程
```
客户端组件 → 直接调用外部API → CORS错误
```

### 现在的流程
```
客户端组件 → 内部API路由 → 外部API → 返回结果
```

## 优势

1. **安全性**: API Key不会暴露在客户端
2. **CORS**: 避免跨域问题
3. **统一管理**: 所有API调用通过服务端
4. **错误处理**: 更好的错误捕获和处理

## 测试步骤

1. 访问设置页面
2. 输入API配置
3. 点击"测试连接"按钮
4. 查看测试结果

## 相关文件

- `src/app/api/ai/test/route.ts` - API测试路由
- `src/lib/ai/config.ts` - 配置管理
- `src/components/settings/ai-config-form.tsx` - 配置表单

## 更新时间
2024年11月20日
