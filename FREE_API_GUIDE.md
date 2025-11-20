# 免费体验API使用指南

## 概述

为了让所有用户都能体验AI功能，我们提供了免费的AI体验服务。用户无需配置API Key即可使用AI功能。

## 功能特点

### 1. 免费体验API
- ✅ **无需配置**: 开箱即用，无需注册或配置
- ✅ **完整功能**: 支持所有AI功能（标签建议、摘要生成等）
- ✅ **安全保护**: 开发者API Key不会暴露给用户
- ✅ **灵活切换**: 可随时切换到自定义API

### 2. 自定义API
- ✅ **更高配额**: 使用自己的API配额
- ✅ **更快速度**: 直接连接，无需共享
- ✅ **完全控制**: 自主管理API使用
- ✅ **隐私保护**: API Key仅存储在浏览器本地

## 实现原理

### 架构设计

```
用户请求
    ↓
检查用户配置
    ├─ 有自定义API → 使用用户API
    └─ 无自定义API → 使用免费体验API
         ↓
    服务端环境变量
    (开发者API Key)
         ↓
    DeepSeek API
         ↓
    返回结果
```

### 安全机制

1. **API Key隔离**
   - 开发者API Key存储在服务端环境变量
   - 用户无法通过任何方式获取
   - 所有API调用通过服务端代理

2. **配置存储**
   - 用户自定义配置存储在浏览器localStorage
   - 不会上传到服务器
   - 开发者无法获取用户的API Key

3. **请求代理**
   ```typescript
   // 客户端
   fetch('/api/ai/suggest-tags', { ... })
   
   // 服务端
   const config = getCurrentAIConfig()
   // 优先使用用户配置，否则使用环境变量
   ```

## 用户界面

### 设置页面

#### 免费API模式（默认）
```
┌─────────────────────────────────────┐
│ 🎁 免费体验API                      │
│                                     │
│ 我们为所有用户提供免费的AI体验服务！│
│ 无需配置API Key即可使用AI功能。     │
│                                     │
│ ☑ 使用免费体验API（推荐）           │
│ ✓ 当前使用免费API                   │
│                                     │
│ [确认使用免费API]                   │
└─────────────────────────────────────┘
```

#### 自定义API模式
```
┌─────────────────────────────────────┐
│ ⚠️ 提示                             │
│ 配置自己的API Key后，将使用您的配额 │
│                                     │
│ AI 提供商: [DeepSeek ▼]             │
│ API Key: [sk-...] 👁                │
│ API URL: [https://...]              │
│ 模型: [deepseek-chat]               │
│                                     │
│ [测试连接] [保存配置] [重置默认]    │
└─────────────────────────────────────┘
```

### 状态徽章

在设置页面右上角显示当前状态：
- 🌟 **免费体验API** - 蓝色徽章
- 🔑 **自定义API** - 绿色徽章

## 代码实现

### 1. 配置管理 (config.ts)

```typescript
// 检查是否使用免费API
export function isUsingFreeAPI(): boolean {
  const userConfig = getAIConfig();
  return !userConfig || !userConfig.apiKey;
}

// 获取当前配置
export function getCurrentAIConfig(): AIConfig {
  // 优先使用用户配置
  const userConfig = getAIConfig();
  if (userConfig && userConfig.apiKey) {
    return userConfig;
  }
  
  // 使用环境变量（免费API）
  if (typeof window === 'undefined') {
    return {
      provider: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
    };
  }
  
  return defaultConfig;
}
```

### 2. UI组件 (ai-config-form.tsx)

```typescript
const [useFreeAPI, setUseFreeAPI] = useState(true);

// 免费API提示
<div className="bg-blue-50 border border-blue-200">
  <h4>🎁 免费体验API</h4>
  <p>我们为所有用户提供免费的AI体验服务！</p>
  <input
    type="checkbox"
    checked={useFreeAPI}
    onChange={(e) => setUseFreeAPI(e.target.checked)}
  />
  <label>使用免费体验API（推荐）</label>
</div>

// 禁用输入框
<Input
  disabled={useFreeAPI}
  placeholder={useFreeAPI ? "留空使用免费API" : "sk-..."}
/>
```

### 3. 状态徽章 (api-status-badge.tsx)

```typescript
export function APIStatusBadge() {
  const [isFree, setIsFree] = useState(true);

  useEffect(() => {
    setIsFree(isUsingFreeAPI());
  }, []);

  if (isFree) {
    return <Badge>🌟 免费体验API</Badge>;
  }
  return <Badge>🔑 自定义API</Badge>;
}
```

## 使用流程

### 用户视角

#### 场景1: 新用户（使用免费API）
1. 注册登录
2. 直接使用AI功能
3. 无需任何配置

#### 场景2: 配置自定义API
1. 进入设置页面
2. 取消勾选"使用免费体验API"
3. 输入自己的API Key
4. 测试连接
5. 保存配置

#### 场景3: 切换回免费API
1. 进入设置页面
2. 勾选"使用免费体验API"
3. 点击"确认使用免费API"
4. 自定义配置被清除

### 开发者视角

#### 配置环境变量
```env
# .env.local
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

#### 监控使用情况
- 在DeepSeek控制台查看API使用量
- 设置使用限额和告警
- 定期检查配额消耗

## 成本控制

### 免费API限制

建议设置以下限制：

1. **速率限制**
   ```typescript
   // 每个用户每分钟最多10次请求
   const rateLimit = 10; // requests per minute
   ```

2. **配额限制**
   ```typescript
   // 每个用户每天最多100次请求
   const dailyLimit = 100;
   ```

3. **内容限制**
   ```typescript
   // 单次请求最大token数
   const maxTokens = 2000;
   ```

### 实现方式

#### 1. 使用Redis缓存
```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

async function checkRateLimit(userId: string) {
  const key = `rate-limit:${userId}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1分钟过期
  }
  
  return count <= 10; // 每分钟最多10次
}
```

#### 2. 使用数据库记录
```prisma
model APIUsage {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String
  createdAt DateTime @default(now())
  
  @@index([userId, createdAt])
}
```

## 提示信息

### 用户提示

#### 免费API说明
```
🎁 免费体验API

我们为所有用户提供免费的AI体验服务！
- 无需配置API Key即可使用AI功能
- 免费API有使用限制
- 建议配置自己的API Key以获得更好体验
```

#### 自定义API说明
```
⚠️ 关于自定义API

- 您的配置保存在浏览器本地，不会上传到服务器
- API Key仅在您的浏览器中使用
- 开发者无法获取您的API Key
- 配置后将使用您自己的API配额
```

### 开发者提示

#### 环境变量配置
```
# 必需配置
DEEPSEEK_API_KEY=sk-xxx  # 免费体验API的Key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# 可选配置
REDIS_URL=xxx            # 用于速率限制
REDIS_TOKEN=xxx
```

## 最佳实践

### 1. 用户体验
- ✅ 默认启用免费API
- ✅ 清晰的说明和提示
- ✅ 简单的切换流程
- ✅ 实时状态显示

### 2. 安全性
- ✅ API Key不暴露给客户端
- ✅ 所有请求通过服务端代理
- ✅ 用户配置本地存储
- ✅ 环境变量安全管理

### 3. 成本控制
- ✅ 设置速率限制
- ✅ 监控使用情况
- ✅ 设置告警阈值
- ✅ 定期审查配额

### 4. 用户引导
- ✅ 首次使用提示
- ✅ 功能说明文档
- ✅ 配置帮助指南
- ✅ 常见问题解答

## 常见问题

### Q1: 免费API有什么限制？
**A**: 免费API由开发者提供，有一定的使用限制。建议配置自己的API Key以获得更好的体验。

### Q2: 我的API Key安全吗？
**A**: 是的。您的API Key仅存储在浏览器本地，不会上传到服务器，开发者无法获取。

### Q3: 如何切换回免费API？
**A**: 在设置页面勾选"使用免费体验API"，然后点击确认即可。

### Q4: 免费API和自定义API有什么区别？
**A**: 
- 免费API: 共享配额，可能有速率限制
- 自定义API: 使用自己的配额，更快更稳定

### Q5: 开发者能看到我的API Key吗？
**A**: 不能。您的API Key仅存储在浏览器本地，所有API调用都在您的浏览器中完成。

## 更新日志

### v1.0.0 (2024-11-20)
- ✨ 新增免费体验API功能
- ✨ 添加API状态徽章
- ✨ 优化配置界面
- 📝 完善使用文档

## 相关文档

- [AI配置指南](./AI_CONFIG_GUIDE.md)
- [API测试修复](./API_TEST_FIX.md)
- [安全最佳实践](./SECURITY.md)

---

**最后更新**: 2024年11月20日
**版本**: 1.0.0
