# API Key 隐私保护修复

## 问题描述

之前的实现中，系统会自动使用开发者在环境变量中配置的 API Key 作为后备方案。这意味着：

1. 即使用户没有配置 API Key，也能使用 AI 功能
2. 实际上是在消耗开发者的 API 配额
3. 这不是一个可持续的方案，也不应该暴露给用户

## 修复内容

### 1. 移除环境变量后备机制

**文件：`src/lib/ai/deepseek.ts`**

- 删除了 `DEEPSEEK_API_KEY` 环境变量的引用
- 修改 `getAPIConfig()` 函数，不再使用环境变量作为后备
- 现在如果用户没有配置 API Key，`apiKey` 将为空字符串

### 2. 更新配置管理逻辑

**文件：`src/lib/ai/config.ts`**

- 修改 `getCurrentAIConfig()` 函数，移除环境变量逻辑
- 现在只返回用户在 localStorage 中保存的配置
- 如果用户没有配置，返回空的 API Key

### 3. 更新设置界面

**文件：`src/components/settings/ai-config-form.tsx`**

- 移除了"免费体验 API"的选项和说明
- 简化了界面，明确要求用户配置自己的 API Key
- 更新了提示文字，强调 API Key 的安全性
- 移除了 `useFreeAPI` 状态和相关逻辑

## 现在的行为

1. **用户必须配置自己的 API Key** 才能使用 AI 功能
2. **不会自动使用开发者的 API Key**
3. 如果用户尝试使用 AI 功能但没有配置 API Key，会收到错误提示
4. 所有 API 调用都使用用户自己的配额

## 安全性

- 用户的 API Key 保存在浏览器的 localStorage 中
- API Key 不会上传到服务器
- 开发者无法获取用户的 API Key
- 开发者的 API Key 也不会暴露给用户

## 推荐做法

建议在应用的欢迎页面或首次使用时，引导用户：

1. 注册 DeepSeek 账号（或其他 AI 服务提供商）
2. 获取 API Key
3. 在设置页面配置 API Key
4. 测试连接确保配置正确

## 相关文件

- `src/lib/ai/deepseek.ts` - AI API 客户端
- `src/lib/ai/config.ts` - 配置管理
- `src/components/settings/ai-config-form.tsx` - 设置界面
- `src/app/api/ai/format/route.ts` - AI 格式化 API 路由
- `src/app/api/ai/test/route.ts` - API 测试路由
