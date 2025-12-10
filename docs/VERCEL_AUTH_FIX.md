# Vercel 注册权限错误修复

## 问题描述

错误：`permission denied for schema public`

这是因为在 Vercel 部署时，没有配置 `SUPABASE_SERVICE_ROLE_KEY`，导致使用普通的 anon key，而普通 key 受 RLS（Row Level Security）限制，无法直接插入 User 表。

## 快速修复方案

### 方案 1：在 Vercel 配置 Service Role Key（推荐）

1. **获取 Service Role Key**
   - 登录 Supabase Dashboard
   - 进入你的项目
   - 点击左侧 Settings -> API
   - 找到 "Project API keys" 部分
   - 复制 `service_role` key（⚠️ 这是敏感密钥，不要泄露）

2. **在 Vercel 添加环境变量**
   - 登录 Vercel Dashboard
   - 进入你的项目
   - 点击 Settings -> Environment Variables
   - 添加新变量：
     - Name: `SUPABASE_SERVICE_ROLE_KEY`
     - Value: 粘贴你复制的 service_role key
     - Environment: 选择 Production, Preview, Development

3. **重新部署**
   - 保存环境变量后，Vercel 会自动触发重新部署
   - 或者手动触发：Deployments -> 点击最新部署 -> Redeploy

### 方案 2：修改 RLS 策略（临时方案，不推荐生产环境）

如果你想快速测试，可以临时允许匿名用户注册：

1. **在 Supabase SQL Editor 执行**：

```sql
-- 允许匿名用户插入 User 表（仅用于注册）
CREATE POLICY "Allow anonymous user registration"
ON "User"
FOR INSERT
TO anon
WITH CHECK (true);
```

2. **注意**：这个策略允许任何人插入 User 表，存在安全风险。生产环境请使用方案 1。

## 推荐方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Service Role Key | 安全，完全控制 | 需要妥善保管密钥 | ✅ 生产环境 |
| RLS 策略修改 | 快速简单 | 存在安全风险 | ⚠️ 仅测试环境 |

## 验证修复

修复后，尝试注册新用户：

```bash
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

应该返回成功响应（状态码 201）。

## 当前状态

- ✅ SSR 错误已修复
- ✅ TypeScript 编译错误已修复
- ✅ 代码已推送到 GitHub
- ⏳ 需要配置 SUPABASE_SERVICE_ROLE_KEY
- ⏳ 配置后重新部署

## 下一步

1. 按照方案 1 配置 Service Role Key
2. 等待 Vercel 重新部署
3. 测试注册功能
4. 测试登录和其他功能
