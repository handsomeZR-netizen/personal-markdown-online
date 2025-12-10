# 🤖 AI API 配置说明

## ✅ 已完成的修改

你的应用现在支持**两种 AI API 使用方式**：

### 方式一：使用默认免费 API（推荐新用户）
- ✨ **无需配置**：用户无需提供自己的 API Key
- 🎁 **免费体验**：使用你在 Vercel 环境变量中配置的 API Key
- ⚡ **即开即用**：注册后立即可以使用 AI 功能
- ⚠️ **有限制**：所有用户共享你的 API 配额

### 方式二：使用自定义 API（推荐高级用户）
- 🔑 **自己的 Key**：用户配置自己的 DeepSeek/OpenAI API Key
- 🚀 **无限制**：不受共享配额限制
- 💰 **自己付费**：API 费用由用户自己承担
- 🔒 **更安全**：API Key 保存在用户浏览器本地

---

## 📋 Vercel 环境变量配置

确保在 Vercel 项目设置中配置了以下环境变量：

```bash
# AI API 配置（必需）
DEEPSEEK_API_KEY=sk-4e3d7bb175a44822a032aab2a0fa105f
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

**配置步骤**：
1. 登录 [Vercel Dashboard](https://vercel.com)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加上述两个环境变量
5. 选择环境：**Production**, **Preview**, **Development**（全选）
6. 点击 **Save**
7. 重新部署项目

---

## 🔧 技术实现

### 1. 客户端逻辑（`src/lib/ai/config.ts`）
```typescript
// 获取当前配置
export function getCurrentAIConfig(): AIConfig {
  const userConfig = getAIConfig(); // 从 localStorage 读取
  
  if (userConfig && userConfig.apiKey) {
    return userConfig; // 使用用户配置
  }
  
  // 返回默认配置（标记为使用服务器端 API）
  return {
    provider: 'deepseek',
    apiKey: 'USE_SERVER_DEFAULT', // 特殊标记
    apiUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  };
}
```

### 2. AI 客户端（`src/lib/ai/deepseek.ts`）
```typescript
// 检测是否使用服务器端 API
if (config.apiKey === 'USE_SERVER_DEFAULT') {
  return callDeepSeekViaAPI(messages, options); // 通过 API 路由调用
}

// 否则直接使用用户的 API Key
const response = await fetch(`${config.apiUrl}/chat/completions`, {
  headers: {
    'Authorization': `Bearer ${config.apiKey}`,
  },
  // ...
});
```

### 3. 服务器端 API 路由

#### `/api/ai/chat` - 普通调用
```typescript
// 从环境变量获取 API Key
const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  return NextResponse.json(
    { error: '服务器未配置 AI API' },
    { status: 503 }
  );
}

// 调用 DeepSeek API
const response = await fetch(`${apiUrl}/chat/completions`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  },
  // ...
});
```

#### `/api/ai/stream` - 流式调用
```typescript
// 用于 AI 格式化等需要流式响应的功能
const apiKey = process.env.DEEPSEEK_API_KEY;

const response = await fetch(`${apiUrl}/chat/completions`, {
  body: JSON.stringify({
    stream: true, // 启用流式响应
  }),
});

return new Response(response.body, {
  headers: {
    'Content-Type': 'text/event-stream',
  },
});
```

---

## 🎯 用户体验

### 默认状态（未配置 API Key）
- 设置页面显示：**"使用默认免费 API"** 徽章
- AI 功能正常工作
- 使用你的 API 配额

### 配置自己的 API Key 后
- 设置页面显示：**"使用自定义 API"** 徽章
- AI 功能使用用户自己的配额
- 不再消耗你的 API 配额

---

## 💡 使用建议

### 对于开发者（你）
1. **设置合理的限制**：考虑添加速率限制（Rate Limiting）
2. **监控使用量**：定期检查 DeepSeek API 使用情况
3. **成本控制**：设置 API 使用上限
4. **提示用户**：在应用中提示用户配置自己的 API Key

### 对于用户
1. **免费体验**：先使用默认 API 体验功能
2. **升级配置**：如果需要更多使用，配置自己的 API Key
3. **获取 API Key**：
   - DeepSeek: https://platform.deepseek.com
   - OpenAI: https://platform.openai.com

---

## 🔒 安全性

### 服务器端 API Key
- ✅ 保存在 Vercel 环境变量中
- ✅ 不会暴露给客户端
- ✅ 只能通过认证的 API 路由访问

### 用户 API Key
- ✅ 保存在浏览器 localStorage
- ✅ 不会上传到服务器
- ✅ 只在用户浏览器中使用

---

## 📊 API 调用流程

```
用户操作（如：AI 标签建议）
    ↓
检查 localStorage 中的 API Key
    ↓
┌─────────────────┬─────────────────┐
│  有用户 API Key  │  无用户 API Key  │
└─────────────────┴─────────────────┘
         ↓                  ↓
    直接调用 AI API    调用 /api/ai/chat
         ↓                  ↓
    使用用户配额      使用服务器端 API Key
         ↓                  ↓
    返回 AI 响应      返回 AI 响应
```

---

## 🚀 部署步骤

1. **提交代码**
```bash
git add .
git commit -m "feat: 添加默认免费 AI API 支持"
git push
```

2. **配置 Vercel 环境变量**
   - 添加 `DEEPSEEK_API_KEY`
   - 添加 `DEEPSEEK_API_URL`（可选）

3. **重新部署**
   - Vercel 会自动部署
   - 或手动触发重新部署

4. **测试功能**
   - 访问设置页面
   - 查看 API 状态徽章（应显示"使用默认免费 API"）
   - 测试 AI 功能（标签建议、格式化等）

---

## 🎉 完成！

现在你的用户可以：
- ✅ 无需配置即可使用 AI 功能
- ✅ 可选配置自己的 API Key
- ✅ 享受完整的 AI 辅助功能

如有问题，请检查：
1. Vercel 环境变量是否正确配置
2. API Key 是否有效
3. 浏览器控制台是否有错误信息
