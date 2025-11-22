# 🔐 Supabase RLS 配置指南

## 问题说明

当前遇到 `permission denied for schema public` 错误，这是因为 Supabase 默认启用了 Row Level Security (RLS)。

## 🚀 快速解决方案（推荐用于开发）

### 方案 1: 临时禁用 RLS（仅开发环境）

在 Supabase Dashboard 执行：

1. 访问 https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn/sql/new
2. 运行以下 SQL：

```sql
-- 临时禁用 RLS（仅用于开发测试）
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;
```

⚠️ **警告**: 这会让所有表公开访问，仅用于开发测试！

### 方案 2: 使用 Service Role Key（推荐）

Service Role Key 绕过 RLS，适合服务端使用。

1. 在 Supabase Dashboard 获取 Service Role Key:
   - 访问 Project Settings → API
   - 复制 `service_role` key（不是 `anon` key）

2. 更新 `.env.local`:

```env
# 添加 Service Role Key（仅服务端使用）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. 创建服务端专用客户端 `src/lib/supabase-server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

4. 在 API 路由中使用 `supabaseServer` 而不是 `supabase`

## 🔒 生产环境方案：配置 RLS 策略

如果要在生产环境使用，需要配置正确的 RLS 策略。

### 选项 A: 使用 Supabase Auth

最简单的方式是使用 Supabase 内置认证：

```typescript
// 注册
const { data, error } = await supabase.auth.signUp({
  email,
  password,
})

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})
```

然后配置 RLS 策略（见 `supabase-rls-policies.sql`）

### 选项 B: 自定义认证 + JWT

如果继续使用 NextAuth，需要：

1. 配置 Supabase 接受自定义 JWT
2. 在 JWT 中包含用户 ID
3. 配置 RLS 策略使用 JWT claims

这比较复杂，建议使用方案 2（Service Role Key）。

## 📝 当前推荐

**开发环境**: 使用方案 2（Service Role Key）
- ✅ 安全（key 不暴露给前端）
- ✅ 简单（无需配置 RLS）
- ✅ 灵活（完全控制权限）

**生产环境**: 
- 如果可以，迁移到 Supabase Auth（选项 A）
- 否则继续使用 Service Role Key + 应用层权限控制

## 🧪 测试步骤

1. 选择一个方案并配置
2. 运行测试：
   ```bash
   npm run supabase:test
   ```
3. 启动应用：
   ```bash
   npm run dev
   ```
4. 测试注册和登录功能

## 💡 提示

- Service Role Key 拥有完全权限，不要暴露给前端
- 只在服务端（API 路由）使用 Service Role Key
- 前端继续使用 Anon Key
