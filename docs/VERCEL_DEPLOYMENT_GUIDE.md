# 🚀 Vercel 部署指南

## ✅ 准备就绪

你的应用现在完全使用 Supabase SDK，可以部署到 Vercel！

### 为什么现在可以部署？

- ✅ 不依赖本地 5432 端口
- ✅ 通过 HTTPS API 访问 Supabase
- ✅ 所有环境变量都是公开可配置的
- ✅ 无需 VPN 或特殊网络配置

---

## 📋 部署前检查清单

### 1. 环境变量准备

确保你有以下环境变量（从 `.env.local` 复制）：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://llroqdgpohslhfejwxrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_SECRET=your-production-secret-here
NEXTAUTH_URL=https://your-app.vercel.app

# 可选：Service Role Key（如果使用）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 生成生产环境的 NEXTAUTH_SECRET

```bash
# 在终端运行
openssl rand -base64 32
```

或者在 PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Supabase 权限配置

确保已在 Supabase 运行权限脚本（`supabase-grant-permissions.sql`）

---

## 🚀 部署步骤

### 方法 1: 通过 Vercel Dashboard（推荐）

#### 步骤 1: 推送代码到 GitHub

```bash
# 如果还没有 Git 仓库
git init
git add .
git commit -m "Ready for Vercel deployment"

# 创建 GitHub 仓库并推送
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

#### 步骤 2: 连接 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 选择 `note-app` 目录作为根目录

#### 步骤 3: 配置环境变量

在 Vercel 项目设置中添加环境变量：

**Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_URL = https://llroqdgpohslhfejwxrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET = [生成的新密钥]
NEXTAUTH_URL = https://your-app.vercel.app
```

**可选**（如果使用 Service Role Key）:
```
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
```

#### 步骤 4: 部署

点击 "Deploy" 按钮，Vercel 会自动：
1. 安装依赖
2. 构建应用
3. 部署到生产环境

---

### 方法 2: 使用 Vercel CLI

#### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 步骤 2: 登录

```bash
vercel login
```

#### 步骤 3: 部署

```bash
cd note-app
vercel
```

按照提示操作，然后添加环境变量：

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

#### 步骤 4: 重新部署

```bash
vercel --prod
```

---

## 🔧 部署后配置

### 1. 更新 NEXTAUTH_URL

部署完成后，获取 Vercel 提供的 URL（例如 `https://your-app.vercel.app`），然后：

1. 在 Vercel Dashboard 更新 `NEXTAUTH_URL` 环境变量
2. 重新部署（Vercel 会自动触发）

### 2. 配置自定义域名（可选）

在 Vercel Dashboard:
1. 进入项目设置
2. 点击 "Domains"
3. 添加你的自定义域名
4. 更新 `NEXTAUTH_URL` 为自定义域名

### 3. Supabase RLS 策略（生产环境）

**开发环境**: 可以禁用 RLS  
**生产环境**: 建议启用 RLS 并配置正确的策略

如果使用 Service Role Key，可以继续禁用 RLS。

---

## 📊 部署配置文件

### vercel.json（可选）

在 `note-app` 目录创建 `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### .vercelignore

创建 `.vercelignore` 排除不必要的文件:

```
node_modules
.next
.env.local
*.md
scripts
prisma
```

---

## 🧪 部署后测试

### 1. 基础功能测试

访问你的 Vercel URL:

- [ ] 首页加载正常
- [ ] 可以注册新用户
- [ ] 可以登录
- [ ] 可以创建笔记
- [ ] 可以编辑笔记
- [ ] 可以删除笔记

### 2. 离线功能测试

- [ ] 断网后可以编辑笔记
- [ ] 重新连接后自动同步
- [ ] 网络状态指示器正常工作

### 3. AI 功能测试

- [ ] 笔记自动生成摘要
- [ ] AI 聊天助手正常工作

---

## 🔍 故障排除

### 问题 1: 构建失败

**症状**: Vercel 构建时出错

**解决方案**:
1. 检查 `package.json` 中的 build 脚本
2. 确保所有依赖都在 `dependencies` 中
3. 查看 Vercel 构建日志

### 问题 2: 环境变量未生效

**症状**: 应用运行但无法连接 Supabase

**解决方案**:
1. 检查环境变量名称是否正确
2. 确保 `NEXT_PUBLIC_` 前缀正确
3. 重新部署应用

### 问题 3: NextAuth 错误

**症状**: 登录失败或重定向错误

**解决方案**:
1. 确保 `NEXTAUTH_URL` 设置为正确的域名
2. 确保 `NEXTAUTH_SECRET` 已设置
3. 检查 Vercel 日志

### 问题 4: 数据库权限错误

**症状**: "permission denied for schema public"

**解决方案**:
1. 在 Supabase 运行 `supabase-grant-permissions.sql`
2. 或者配置 `SUPABASE_SERVICE_ROLE_KEY`

---

## 📈 性能优化

### 1. 启用 Edge Runtime（可选）

在 API 路由中添加:

```typescript
export const runtime = 'edge'
```

### 2. 配置缓存

在 `next.config.js` 中:

```javascript
module.exports = {
  // ... 其他配置
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ],
}
```

### 3. 图片优化

使用 Next.js Image 组件自动优化图片。

---

## 🔐 安全建议

### 生产环境检查清单

- [ ] 使用强密码的 `NEXTAUTH_SECRET`
- [ ] 不要在代码中硬编码密钥
- [ ] 启用 Supabase RLS 策略
- [ ] 配置 CORS 策略
- [ ] 启用 HTTPS（Vercel 自动提供）
- [ ] 定期更新依赖

---

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署](https://nextjs.org/docs/deployment)
- [Supabase 文档](https://supabase.com/docs)
- [NextAuth 文档](https://next-auth.js.org/deployment)

---

## 🎉 部署成功！

部署完成后，你的应用将：

- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 无服务器架构
- ✅ 自动扩展
- ✅ 零停机部署

**享受你的云端笔记应用！** 🚀

---

## 💡 下一步

1. 配置自定义域名
2. 设置 CI/CD 自动部署
3. 配置监控和日志
4. 优化 SEO
5. 添加分析工具

---

**部署时间**: 约 5-10 分钟  
**难度**: ⭐⭐☆☆☆ (简单)
