# 🚨 紧急修复：Vercel 环境变量未配置

## 错误信息
```
PrismaClientInitializationError: Invalid `prisma.user.findUnique()` invocation
```

## 问题原因
**Vercel 上没有配置数据库连接环境变量**，导致 Prisma 无法连接到 Supabase。

本地可以运行是因为读取了 `.env.local` 文件，但 Vercel 不会自动读取这些文件。

---

## ⚡ 立即修复（5 分钟）

### 方法 A：手动在 Vercel 添加（推荐）

1. **登录 Vercel**
   - 访问 https://vercel.com/dashboard
   - 选择项目 `personal-markdown-online`

2. **进入环境变量设置**
   - 点击 **Settings** 标签
   - 点击左侧 **Environment Variables**

3. **添加以下变量**（每个变量都要添加）

点击 **Add New** 按钮，逐个添加：

#### 变量 1: AUTH_SECRET
```
Name: AUTH_SECRET
Value: TPa9haEef5cCxxfX5Lm+aZEwY3r1q4gh+3eBvsB+Dvs=
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 2: DATABASE_URL ⭐ 最重要
```
Name: DATABASE_URL
Value: postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 3: DIRECT_URL
```
Name: DIRECT_URL
Value: postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:5432/postgres
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 4: NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://llroqdgpohslhfejwxrn.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 5: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxscm9xZGdwb2hzbGhmZWp3eHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTcxNjAsImV4cCI6MjA3OTE5MzE2MH0.WIu4gMcByyrkdUhnvcXe4Uxgu7GXpmSN6RzTpX2P5yI
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 6: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxscm9xZGdwb2hzbGhmZWp3eHJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYxNzE2MCwiZXhwIjoyMDc5MTkzMTYwfQ.xCydSblzA7RnX8f_1lb7zQiXy_coLOXDIBhgDnkYw30
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 7: SUPABASE_JWT_SECRET
```
Name: SUPABASE_JWT_SECRET
Value: ED+YLxLQJiDyejzNiFwQgCqjilGD1RLj6hVTceIEoLJVlQSFhk0+vEp2DpOdMHJpAnlMAJs1RE311txVW/V/jQ==
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 8: POSTGRES_USER
```
Name: POSTGRES_USER
Value: postgres
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 9: POSTGRES_PASSWORD
```
Name: POSTGRES_PASSWORD
Value: 151692483515156555878
Environments: ✅ Production ✅ Preview ✅ Development
```

#### 变量 10-11: AI 功能（可选）
```
Name: DEEPSEEK_API_KEY
Value: sk-4e3d7bb175a44822a032aab2a0fa105f
Environments: ✅ Production ✅ Preview ✅ Development

Name: DEEPSEEK_API_URL
Value: https://api.deepseek.com/v1
Environments: ✅ Production ✅ Preview ✅ Development
```

4. **保存所有变量**
   - 确认每个变量都显示在列表中
   - 确认每个变量都应用到了所有环境

---

### 方法 B：使用 Vercel CLI（自动化）

如果你安装了 Vercel CLI：

```bash
# Windows PowerShell
npm run vercel:env:win

# Mac/Linux
npm run vercel:env
```

这会自动从 `.env.local` 读取并配置所有环境变量。

---

## 🔄 重新部署

**重要**：添加环境变量后必须重新部署！

### 方法 1：Git 推送（推荐）
```bash
git commit --allow-empty -m "chore: configure environment variables"
git push
```

### 方法 2：手动重新部署
1. Vercel Dashboard → **Deployments** 标签
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Redeploy**
4. 确认重新部署

---

## ✅ 验证修复

### 1. 确认环境变量已保存

在 Vercel Dashboard：
- Settings → Environment Variables
- 应该看到至少 9 个变量（包括 DATABASE_URL）

### 2. 等待部署完成

- 通常需要 2-3 分钟
- Vercel Dashboard → Deployments
- 等待状态变为 "Ready"

### 3. 测试注册功能

1. 访问 https://personal-markdown-online.vercel.app/register
2. 填写注册表单：
   - Email: test@example.com
   - Password: 123456
   - Name: Test User
3. 点击注册
4. 应该成功注册并跳转

### 4. 检查 Vercel 日志

1. Vercel Dashboard → Deployments → 选择最新部署
2. 点击 **Functions** 标签
3. 找到 `/api/auth/register` 的日志
4. 应该看到：
   ```
   ENV DATABASE_URL: postgresql://postgres:...
   收到注册请求
   用户创建成功: clxxx...
   ```

### 5. 检查 Supabase 数据

1. 访问 https://supabase.com/dashboard
2. 选择项目
3. Table Editor → User 表
4. 应该看到新创建的用户

---

## 🐛 仍然失败？

### 检查 1: DATABASE_URL 格式

**正确格式**（注意细节）：
```
postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:6543/postgres?pgbouncer=true
```

**常见错误**：
- ❌ 端口写成 5432（应该是 6543）
- ❌ 缺少 `?pgbouncer=true`
- ❌ 项目 ID 错误
- ❌ 密码错误

### 检查 2: 环境变量是否生效

在 Vercel Functions 日志中查找：
```
ENV DATABASE_URL: postgresql://...
```

如果显示 `undefined`，说明环境变量没有生效，需要重新部署。

### 检查 3: Supabase 项目状态

1. 访问 https://supabase.com/dashboard
2. 确认项目状态为 "Active"
3. 确认数据库没有暂停

### 检查 4: 数据库表是否存在

1. Supabase Dashboard → Table Editor
2. 应该看到：User, Note, Tag, Category, _NoteToTag
3. 如果没有，运行 `supabase-setup.sql`

---

## 📋 环境变量检查清单

在 Vercel Settings → Environment Variables 中确认：

- [ ] AUTH_SECRET
- [ ] DATABASE_URL ⭐ 最重要
- [ ] DIRECT_URL
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] SUPABASE_JWT_SECRET
- [ ] POSTGRES_USER
- [ ] POSTGRES_PASSWORD
- [ ] DEEPSEEK_API_KEY（可选）
- [ ] DEEPSEEK_API_URL（可选）

**每个变量都应该**：
- ✅ 有正确的值
- ✅ 应用到所有环境（Production, Preview, Development）
- ✅ 显示在环境变量列表中

---

## 💡 为什么本地可以运行但 Vercel 不行？

### 本地环境
- Next.js 自动读取 `.env.local` 文件
- 所有环境变量都可用
- 可以连接到 Supabase

### Vercel 环境
- **不会**自动读取 `.env` 文件
- 必须在 Vercel Dashboard 手动配置
- 配置后需要重新部署才能生效

### 解决方案
1. 在 Vercel 手动添加所有环境变量
2. 或使用 Vercel CLI 自动同步
3. 重新部署

---

## 🔐 安全提示

1. **不要提交敏感信息到 Git**
   - `.env.local` 已在 `.gitignore` 中
   - 确认 `.env` 也在 `.gitignore` 中

2. **定期轮换密钥**
   - AUTH_SECRET
   - 数据库密码
   - API 密钥

3. **使用不同的密钥**
   - 开发环境：本地 `.env.local`
   - 生产环境：Vercel 环境变量

---

## 📞 需要帮助？

### 提供以下信息

1. **Vercel 环境变量截图**
   - Settings → Environment Variables
   - 隐藏敏感值

2. **Vercel 函数日志**
   - Deployments → Functions → /api/auth/register
   - 复制完整错误信息

3. **DATABASE_URL 格式**
   - 确认端口和参数正确

4. **Supabase 项目状态**
   - 项目是否 Active
   - 数据库是否可访问

---

## ✨ 修复后的效果

配置正确后，你应该能够：
- ✅ 在 Vercel 上成功注册用户
- ✅ 登录功能正常
- ✅ 创建和管理笔记
- ✅ 所有数据库操作正常
- ✅ 无 PrismaClientInitializationError 错误

---

**关键点**：
1. ⭐ DATABASE_URL 是最重要的环境变量
2. ⭐ 添加环境变量后必须重新部署
3. ⭐ 确保所有变量都应用到所有环境
4. ⭐ 端口必须是 6543（不是 5432）
5. ⭐ 必须包含 `?pgbouncer=true`
