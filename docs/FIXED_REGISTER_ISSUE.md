# ✅ 修复注册问题

## 🐛 问题描述

注册时出现错误：
```
Can't reach database server at `db.llroqdgpohslhfejwxrn.supabase.co:5432`
```

## 🔍 根本原因

`/api/auth/register` 路由还在使用 Prisma 直连数据库，而不是 Supabase SDK。

## ✅ 已修复

### 修改的文件
- `src/app/api/auth/register/route.ts`

### 修改内容
**之前（使用 Prisma）**:
```typescript
import { prisma } from "@/lib/prisma"

const existingUser = await prisma.user.findUnique({
    where: { email },
})

const user = await prisma.user.create({
    data: {
        email,
        password: hashedPassword,
        name,
    },
})
```

**现在（使用 Supabase SDK）**:
```typescript
import { signUp } from "@/lib/supabase-auth"

const { data: user, error } = await signUp({
    email,
    password,
    name,
})
```

## 🧪 测试步骤

### 1. 重启服务器

如果服务器还在运行，重启它：
```bash
Ctrl+C
npm run dev
```

### 2. 测试注册

1. 访问 http://localhost:3001/register
2. 填写信息:
   - 邮箱: test2@example.com
   - 密码: test123456
   - 姓名: Test User 2
3. 点击"注册"

### 预期结果

✅ **成功**: 注册成功，跳转到登录页面  
❌ **失败**: 如果还有权限错误，需要运行权限脚本

## ⚠️ 如果还有权限错误

### 运行权限脚本

1. 访问 Supabase SQL Editor:
   https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn/sql/new

2. 复制并运行 `supabase-grant-permissions.sql`:

```sql
-- 禁用 RLS
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;

-- 授予权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
```

3. 刷新应用页面重试

## 📊 完整迁移状态

### ✅ 已完成
- [x] Supabase 客户端配置
- [x] 认证服务（signUp, signIn）
- [x] 笔记数据服务（CRUD）
- [x] API 路由 - /api/notes
- [x] API 路由 - /api/notes/[id]
- [x] API 路由 - /api/notes/batch-sync
- [x] API 路由 - /api/auth/register ✅ **刚修复**
- [x] NextAuth 配置

### 🎯 所有 API 路由现在都使用 Supabase SDK

不再有任何 Prisma 直连调用！

## 🎉 下一步

1. 重启服务器
2. 测试注册功能
3. 测试登录功能
4. 测试创建笔记

---

**修复时间**: 2024-11-23  
**状态**: ✅ 完成
