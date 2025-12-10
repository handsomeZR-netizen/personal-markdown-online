# 🚨 紧急修复：AUTH_SECRET 缺失

## 你看到的错误
```
[auth][error] MissingSecret: Please define a `secret`
```

## ⚡ 3 步快速修复

### 第 1 步：生成 AUTH_SECRET

**Windows (PowerShell)**：
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Mac/Linux**：
```bash
openssl rand -base64 32
```

**或使用 NextAuth CLI**：
```bash
npx auth secret
```

复制生成的密钥（类似这样）：
```
jN8kF2mP9xR4vT6wY8zA3bC5dE7fG9hJ1kL3mN5pQ7r=
```

### 第 2 步：在 Vercel 添加环境变量

1. 打开 https://vercel.com/dashboard
2. 选择项目 `personal-markdown-online`
3. 点击 **Settings** → **Environment Variables**
4. 点击 **Add New**
5. 填写：
   - **Name**: `AUTH_SECRET`
   - **Value**: 粘贴刚才生成的密钥
   - **Environments**: 勾选所有（Production, Preview, Development）
6. 点击 **Save**

### 第 3 步：重新部署

**方法 A - 自动触发**（推荐）：
```bash
git commit --allow-empty -m "chore: add AUTH_SECRET"
git push
```

**方法 B - 手动触发**：
1. Vercel Dashboard → **Deployments**
2. 点击最新部署的 **...** 菜单
3. 选择 **Redeploy**

## ✅ 验证修复

等待 2-3 分钟后：
1. 访问 https://personal-markdown-online.vercel.app
2. 打开浏览器控制台（F12）
3. 不应再看到 `MissingSecret` 错误

## 📋 完整环境变量检查清单

确保 Vercel 上配置了以下所有变量：

```bash
✅ AUTH_SECRET                      # 刚才添加的
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_JWT_SECRET
✅ DATABASE_URL
✅ DIRECT_URL
✅ POSTGRES_USER
✅ POSTGRES_PASSWORD
⚠️ DEEPSEEK_API_KEY                # 可选
⚠️ DEEPSEEK_API_URL                # 可选
```

## 🔧 使用自动化脚本（可选）

如果你安装了 Vercel CLI：

**Windows**：
```bash
npm run vercel:env:win
```

**Mac/Linux**：
```bash
npm run vercel:env
```

这会自动从 `.env.local` 读取并配置所有环境变量。

## 🐛 仍然有问题？

### 检查 1：确认环境变量已保存
- Vercel → Settings → Environment Variables
- 应该能看到 `AUTH_SECRET` 在列表中

### 检查 2：确认已重新部署
- Vercel → Deployments
- 最新部署的时间应该在你添加环境变量之后

### 检查 3：清除浏览器缓存
```
Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
```

### 检查 4：查看部署日志
- Vercel → Deployments → 选择最新部署
- 查看 **Function Logs**
- 搜索 "MissingSecret"

## 📞 需要更多帮助？

查看详细文档：
- [VERCEL_AUTH_FIX.md](./VERCEL_AUTH_FIX.md) - 详细解决方案
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- [QUICK_FIX.md](./QUICK_FIX.md) - 快速修复指南

---

**重要**：添加环境变量后必须重新部署才能生效！
