# Vercel 部署指南

本指南将帮助你将 Note App 部署到 Vercel 平台。

## 前置准备

### 1. 确保 Supabase 已配置完成

在部署前，请确保：
- ✅ Supabase 项目已创建
- ✅ 数据库迁移已完成
- ✅ 已获取所有必需的环境变量

### 2. 准备环境变量

你需要准备以下环境变量（从 `.env.local` 文件中获取）：

```env
# 数据库配置
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 认证配置
AUTH_SECRET=your-auth-secret-here

# AI API 配置（可选）
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Supabase 公开配置（可选）
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 部署步骤

### 方法一：通过 Vercel Dashboard（推荐）

#### 1. 连接 Git 仓库

1. 访问 [Vercel Dashboard](https://vercel.com/new)
2. 点击 "Import Project"
3. 选择你的 Git 提供商（GitHub、GitLab 或 Bitbucket）
4. 授权 Vercel 访问你的仓库
5. 选择 `note-app` 项目

#### 2. 配置项目

在导入页面：

**Root Directory（根目录）：**
```
note-app
```

**Framework Preset（框架预设）：**
- 自动检测为 `Next.js`

**Build Command（构建命令）：**
```bash
npm run build
```

**Output Directory（输出目录）：**
```
.next
```

**Install Command（安装命令）：**
```bash
npm install
```

#### 3. 配置环境变量

在 "Environment Variables" 部分，添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://postgres:...` | Production, Preview |
| `DIRECT_URL` | `postgresql://postgres:...` | Production, Preview |
| `AUTH_SECRET` | `your-auth-secret` | Production, Preview |
| `DEEPSEEK_API_KEY` | `sk-...` | Production, Preview |
| `DEEPSEEK_API_URL` | `https://api.deepseek.com/v1` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Production, Preview |

**注意：**
- `NEXT_PUBLIC_*` 开头的变量会被打包到客户端代码中
- 其他变量仅在服务器端可用
- 为 Production 和 Preview 环境都设置相同的值（或根据需要设置不同的值）

#### 4. 部署

1. 点击 "Deploy" 按钮
2. 等待构建完成（通常需要 2-5 分钟）
3. 部署成功后，你会获得一个 `.vercel.app` 域名

### 方法二：通过 Vercel CLI

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

#### 3. 部署项目

在 `note-app` 目录下运行：

```bash
cd note-app
vercel
```

按照提示操作：
- Set up and deploy? `Y`
- Which scope? 选择你的账户
- Link to existing project? `N`
- What's your project's name? `note-app`
- In which directory is your code located? `./`

#### 4. 添加环境变量

```bash
# 添加生产环境变量
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add AUTH_SECRET production
vercel env add DEEPSEEK_API_KEY production
vercel env add DEEPSEEK_API_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# 添加预览环境变量
vercel env add DATABASE_URL preview
vercel env add DIRECT_URL preview
vercel env add AUTH_SECRET preview
# ... 重复其他变量
```

#### 5. 部署到生产环境

```bash
vercel --prod
```

## 部署后配置

### 1. 配置自定义域名（可选）

1. 在 Vercel Dashboard 中打开你的项目
2. 进入 "Settings" → "Domains"
3. 添加你的自定义域名
4. 按照提示配置 DNS 记录

### 2. 配置 Supabase 回调 URL

在 Supabase Dashboard 中：

1. 进入 "Authentication" → "URL Configuration"
2. 添加你的 Vercel 域名到 "Site URL"：
   ```
   https://your-app.vercel.app
   ```
3. 添加到 "Redirect URLs"：
   ```
   https://your-app.vercel.app/api/auth/callback/*
   ```

### 3. 验证部署

访问你的 Vercel 域名，测试以下功能：

- ✅ 用户注册和登录
- ✅ 创建和编辑笔记
- ✅ AI 功能（如果配置了）
- ✅ 标签管理
- ✅ 搜索功能

## 常见问题

### 1. 构建失败：数据库连接错误

**原因：** 环境变量未正确配置

**解决方案：**
- 检查 `DATABASE_URL` 和 `DIRECT_URL` 是否正确
- 确保 Supabase 数据库允许外部连接
- 检查密码中是否有特殊字符需要 URL 编码

### 2. 运行时错误：AUTH_SECRET 未定义

**原因：** 环境变量未设置

**解决方案：**
```bash
# 生成新的 AUTH_SECRET
openssl rand -base64 32

# 在 Vercel Dashboard 中添加该变量
```

### 3. AI 功能不工作

**原因：** API 密钥未配置或无效

**解决方案：**
- 检查 `DEEPSEEK_API_KEY` 是否正确
- 验证 API 密钥是否有效
- 检查 API 配额是否用尽

### 4. 数据库迁移未应用

**原因：** Vercel 不会自动运行数据库迁移

**解决方案：**
- 在本地运行迁移后再部署
- 或使用 Supabase Dashboard 手动执行 SQL

### 5. 预览部署使用生产数据库

**原因：** 预览环境使用了生产环境的数据库 URL

**解决方案：**
- 为预览环境创建单独的 Supabase 项目
- 或在环境变量中为 Preview 环境设置不同的数据库 URL

## 性能优化建议

### 1. 启用 Edge Runtime（可选）

对于某些 API 路由，可以启用 Edge Runtime 以获得更快的响应：

```typescript
// app/api/some-route/route.ts
export const runtime = 'edge';
```

### 2. 配置缓存策略

在 `next.config.ts` 中配置：

```typescript
const nextConfig = {
  // 启用 SWC 压缩
  swcMinify: true,
  
  // 配置图片优化
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
};
```

### 3. 使用 Vercel Analytics

在 Vercel Dashboard 中启用 Analytics 以监控性能。

## 持续部署

### 自动部署

Vercel 会自动部署：
- **Production：** 当你推送到 `main` 或 `master` 分支
- **Preview：** 当你创建 Pull Request 或推送到其他分支

### 手动部署

```bash
# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

## 监控和日志

### 查看部署日志

1. 在 Vercel Dashboard 中打开项目
2. 进入 "Deployments"
3. 点击具体的部署查看日志

### 查看运行时日志

1. 进入 "Logs" 标签
2. 实时查看应用日志
3. 使用过滤器查找特定错误

## 回滚部署

如果新部署出现问题：

1. 在 Vercel Dashboard 中进入 "Deployments"
2. 找到之前的稳定版本
3. 点击 "..." → "Promote to Production"

## 安全建议

1. ✅ 定期轮换 `AUTH_SECRET`
2. ✅ 使用环境变量存储敏感信息
3. ✅ 为不同环境使用不同的数据库
4. ✅ 启用 Vercel 的 DDoS 保护
5. ✅ 配置适当的 CORS 策略

## 成本估算

Vercel 免费计划包括：
- 100 GB 带宽/月
- 无限部署
- 自动 HTTPS
- 全球 CDN

对于大多数个人项目，免费计划已经足够。

## 支持资源

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Supabase 文档](https://supabase.com/docs)
- [Vercel 社区](https://github.com/vercel/vercel/discussions)

---

**部署成功后，记得更新项目的 README.md，添加你的线上地址！** 🚀
