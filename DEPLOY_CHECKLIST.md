# ✅ Vercel 部署检查清单

## 🚀 快速部署（5 步）

### 1️⃣ 准备环境变量

复制这些值，准备添加到 Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://llroqdgpohslhfejwxrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxscm9xZGdwb2hzbGhmZWp3eHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTcxNjAsImV4cCI6MjA3OTE5MzE2MH0.WIu4gMcByyrkdUhnvcXe4Uxgu7GXpmSN6RzTpX2P5yI
```

生成新的 NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 2️⃣ 推送到 GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 3️⃣ 在 Vercel 创建项目

1. 访问 [vercel.com/new](https://vercel.com/new)
2. 导入 GitHub 仓库
3. 根目录选择 `note-app`

### 4️⃣ 添加环境变量

在 Vercel 项目设置中添加:

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://llroqdgpohslhfejwxrn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXTAUTH_SECRET` | `[生成的新密钥]` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |

### 5️⃣ 部署

点击 "Deploy" 按钮！

---

## 📋 部署前检查

- [ ] 代码已推送到 GitHub
- [ ] Supabase 权限已配置（运行过 `supabase-grant-permissions.sql`）
- [ ] 已生成新的 `NEXTAUTH_SECRET`
- [ ] 环境变量已准备好

---

## 🧪 部署后测试

访问你的 Vercel URL 并测试:

- [ ] 首页加载
- [ ] 注册新用户
- [ ] 登录
- [ ] 创建笔记
- [ ] 编辑笔记
- [ ] 删除笔记
- [ ] 离线功能

---

## ⚠️ 常见问题

### Q: 构建失败？
A: 检查 Vercel 构建日志，确保所有依赖都在 `package.json` 中

### Q: 无法连接 Supabase？
A: 检查环境变量是否正确设置，特别是 `NEXT_PUBLIC_` 前缀

### Q: 登录失败？
A: 确保 `NEXTAUTH_URL` 设置为正确的 Vercel URL

### Q: 权限错误？
A: 在 Supabase 运行 `supabase-grant-permissions.sql`

---

## 🎉 部署成功！

你的应用现在运行在:
- ✅ 全球 CDN
- ✅ 自动 HTTPS
- ✅ 无服务器架构
- ✅ 自动扩展

**查看完整指南**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

---

**预计时间**: 5-10 分钟  
**难度**: ⭐⭐☆☆☆
