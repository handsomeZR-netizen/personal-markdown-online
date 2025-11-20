# AI 功能实现文档

## 概述

本文档描述了笔记管理平台中集成的 DeepSeek AI 功能。所有 AI 功能都已实现并可以使用。

## 已实现的功能

### 1. DeepSeek API 客户端配置 ✅

**位置**: `src/lib/ai/deepseek.ts`

**功能**:
- 完整的 DeepSeek API 调用封装
- 错误处理和重试逻辑（最多3次重试）
- 支持自定义参数（temperature, max_tokens 等）
- 简化的单次对话接口

**配置**:
```env
DEEPSEEK_API_KEY=sk-4e3d7bb175a44822a032aab2a0fa105f
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 2. 智能标签建议 ✅

**位置**: 
- Server Action: `src/lib/actions/ai.ts` - `suggestTags()`
- 组件: `src/components/notes/ai-tag-suggestions.tsx`

**功能**:
- 基于笔记标题和内容生成3-5个相关标签
- 在笔记编辑器中显示"AI建议标签"按钮
- 点击建议的标签可直接添加到笔记
- 自动创建不存在的标签
- 加载状态和错误处理

**使用方式**:
1. 在笔记编辑器中输入内容
2. 点击"AI建议标签"按钮
3. 从建议列表中选择标签

### 3. 内容自动摘要 ✅

**位置**:
- Server Action: `src/lib/actions/ai.ts` - `summarizeNote()`
- Server Action: `src/lib/actions/notes.ts` - `regenerateNoteSummary()`
- 组件: `src/components/notes/regenerate-summary-button.tsx`

**功能**:
- 创建或更新笔记时自动生成摘要（内容长度 >= 50字符）
- 摘要存储在数据库中（`Note.summary` 字段）
- 在笔记卡片中显示摘要
- 在笔记详情页显示摘要
- 支持手动重新生成摘要

**数据库更新**:
```prisma
model Note {
  // ...
  summary String?
  // ...
}
```

### 4. 语义搜索 ✅

**位置**:
- Server Action: `src/lib/actions/ai.ts` - `semanticSearch()`, `generateEmbedding()`
- 组件: `src/components/ai-search-bar.tsx`
- 页面: `src/app/ai/page.tsx`

**功能**:
- 创建或更新笔记时自动生成向量嵌入
- 基于余弦相似度的语义搜索
- 支持自然语言查询
- 显示相似度百分比
- 如果没有嵌入，回退到关键词匹配

**数据库更新**:
```prisma
model Note {
  // ...
  embedding String? // JSON 格式的向量数组
  // ...
}
```

**实现说明**:
- 使用简化的嵌入生成算法（基于文本特征的384维向量）
- 在生产环境中，建议使用专业的嵌入服务（如 OpenAI Embeddings）

### 5. 自然语言问答 ✅

**位置**:
- Server Action: `src/lib/actions/ai.ts` - `answerQuery()`
- 组件: `src/components/ai-qa-interface.tsx`
- 页面: `src/app/ai/page.tsx`

**功能**:
- 用自然语言提问关于笔记的问题
- AI 基于相关笔记内容生成回答
- 显示相关笔记列表及相似度
- 对话历史记录
- 清除历史功能

**工作流程**:
1. 用户输入问题
2. 使用语义搜索找到最相关的5条笔记
3. 将笔记内容作为上下文发送给 AI
4. AI 生成基于笔记内容的回答
5. 显示回答和相关笔记链接

## 访问 AI 功能

### 导航入口

1. **桌面端**: 顶部导航栏 "AI功能" 按钮
2. **移动端**: 汉堡菜单中的 "AI功能" 选项
3. **直接访问**: `/ai` 路由

### AI 功能页面

访问 `/ai` 页面可以使用：
- **语义搜索**: 使用自然语言搜索笔记
- **自然语言问答**: 向 AI 提问关于笔记的问题

### 笔记编辑器中的 AI 功能

在创建或编辑笔记时：
- **AI 建议标签**: 标签选择器下方的按钮
- **自动摘要**: 保存时自动生成（内容 >= 50字符）

### 笔记详情页中的 AI 功能

在查看笔记时：
- **查看摘要**: 显示在笔记元数据区域
- **重新生成摘要**: 点击摘要旁边的按钮

## 技术实现细节

### 向量嵌入算法

当前实现使用简化的嵌入算法：
- 384维向量
- 基于词频和字符哈希
- 归一化处理
- 余弦相似度计算

**生产环境建议**:
- 使用专业的嵌入模型（如 text-embedding-ada-002）
- 考虑使用向量数据库（如 Pinecone, Weaviate）
- 实现批量嵌入生成以提高性能

### API 调用优化

- 使用防抖避免频繁调用
- 实现重试逻辑处理临时错误
- 错误处理和用户友好的错误消息
- 加载状态指示器

### 性能考虑

- 摘要和嵌入生成是异步的，不阻塞主要操作
- 如果 AI 服务失败，核心功能仍然可用
- 嵌入存储为 JSON 字符串，便于查询

## 测试建议

### 功能测试

1. **标签建议**:
   - 创建包含技术内容的笔记
   - 点击"AI建议标签"
   - 验证建议的标签是否相关

2. **自动摘要**:
   - 创建长内容笔记（>50字符）
   - 保存后查看笔记卡片
   - 验证摘要是否准确简洁

3. **语义搜索**:
   - 创建多条不同主题的笔记
   - 使用自然语言查询
   - 验证搜索结果的相关性

4. **自然语言问答**:
   - 创建包含特定信息的笔记
   - 提问相关问题
   - 验证 AI 回答是否基于笔记内容

### 错误处理测试

1. 测试 API 密钥无效的情况
2. 测试网络错误的情况
3. 测试内容过短的情况
4. 测试并发请求的情况

## 未来改进

1. **嵌入模型升级**: 使用专业的嵌入服务
2. **向量数据库**: 提高大规模数据的搜索性能
3. **批量处理**: 为现有笔记批量生成嵌入
4. **缓存策略**: 缓存常见查询的结果
5. **多语言支持**: 支持其他语言的笔记
6. **高级 AI 功能**: 
   - 笔记分类建议
   - 内容改写和优化
   - 相关笔记推荐
   - 知识图谱生成

## 故障排除

### AI 功能不工作

1. 检查 `.env` 文件中的 API 密钥配置
2. 验证 DeepSeek API 服务是否可用
3. 查看浏览器控制台和服务器日志的错误信息

### 嵌入生成失败

1. 检查笔记内容是否为空
2. 验证数据库 schema 是否包含 `embedding` 字段
3. 运行 `npx prisma generate` 重新生成 Prisma 客户端

### 搜索结果不准确

1. 确保笔记已生成嵌入（创建或更新笔记）
2. 尝试更具体的查询
3. 考虑升级到专业的嵌入模型

## 相关文件

- `src/lib/ai/deepseek.ts` - DeepSeek API 客户端
- `src/lib/actions/ai.ts` - AI 相关的 Server Actions
- `src/lib/validations/ai.ts` - AI 功能的验证 schemas
- `src/components/notes/ai-tag-suggestions.tsx` - 标签建议组件
- `src/components/notes/regenerate-summary-button.tsx` - 重新生成摘要按钮
- `src/components/ai-search-bar.tsx` - AI 搜索栏
- `src/components/ai-qa-interface.tsx` - AI 问答界面
- `src/app/ai/page.tsx` - AI 功能页面
- `prisma/schema.prisma` - 数据库 schema（包含 summary 和 embedding 字段）

## 总结

所有 AI 功能已成功实现并集成到笔记管理平台中。用户可以通过多个入口访问这些功能，包括笔记编辑器、笔记详情页和专门的 AI 功能页面。系统设计考虑了性能、错误处理和用户体验，为未来的扩展和优化奠定了良好的基础。
