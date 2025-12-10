# 🧪 无 Service Key 测试方案

## 当前状态

- ✅ Supabase 连接正常
- ⚠️ RLS 阻止了数据访问
- ❓ 需要配置 Service Role Key 或禁用 RLS

## 快速测试方案

### 方案 1: 在 Supabase 禁用 RLS（最快）

1. 访问 Supabase SQL Editor:
   https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn/sql/new

2. 运行以下 SQL:

```sql
-- 临时禁用 RLS（仅用于开发测试）
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;
```

3. 测试应用:
```bash
npm run dev
```

### 方案 2: 配置 Service Role Key（推荐）

1. 获取 Service Role Key:
   - 访问 https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn/settings/api
   - 找到 "Project API keys" 部分
   - 复制 `service_role` key（不是 `anon` key）

2. 添加到 `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxscm9xZGdwb2hzbGhmZWp3eHJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYxNzE2MCwiZXhwIjoyMDc5MTkzMTYwfQ.YOUR_SERVICE_KEY_HERE
```

3. 重启应用:
```bash
npm run dev
```

## 测试步骤

1. 启动应用
2. 访问 http://localhost:3000
3. 测试注册功能
4. 测试登录功能
5. 测试创建笔记

## 预期结果

### 如果成功:
- ✅ 可以注册新用户
- ✅ 可以登录
- ✅ 可以创建/编辑/删除笔记
- ✅ 离线功能正常

### 如果失败:
- ❌ 看到 "permission denied" 错误
- ❌ 无法创建用户或笔记

## 故障排除

### 错误: "permission denied for schema public"
→ 需要禁用 RLS 或配置 Service Role Key

### 错误: "SUPABASE_SERVICE_ROLE_KEY not configured"
→ 检查 .env.local 文件是否包含 Service Role Key

### 应用无法启动
→ 运行 `npm install` 确保依赖已安装

## 下一步

配置完成后，运行完整测试：
```bash
npm run dev
```

然后访问应用测试所有功能。
