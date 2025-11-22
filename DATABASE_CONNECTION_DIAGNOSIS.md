# 数据库连接错误诊断报告

## 错误信息
```
Error: Invalid `prisma.note.findMany()` invocation:
Can't reach database server at `db.llroqdgpohslhfejwxrn.supabase.co:5432`
Please make sure your database server is running at `db.llroqdgpohslhfejwxrn.supabase.co:5432`.
```

## 根本原因分析

### 1. **Supabase 免费版数据库自动暂停机制**
这是最可能的原因。根据 Supabase 官方文档和测试结果：

- ✅ **免费版项目在 7 天无活动后会自动暂停**
- ✅ 暂停的数据库无法通过任何端口（5432 或 6543）连接
- ✅ 你的项目 ID: `llroqdgpohslhfejwxrn`

### 2. 测试结果
我们测试了两个连接端口，都无法连接：
- ❌ 端口 6543 (Connection Pooler): 无法连接
- ❌ 端口 5432 (Direct Connection): 无法连接

这强烈表明数据库处于暂停状态，而不是配置问题。

### 3. 配置检查
你的配置是正确的：
```env
# 连接池配置 (正确)
DATABASE_URL="postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true"

# 直连配置 (正确)
DIRECT_URL="postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:5432/postgres"
```

## 解决方案

### 步骤 1: 检查并恢复数据库（必须）

1. **访问 Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn
   ```

2. **检查项目状态**
   - 在项目页面顶部查看状态
   - 如果显示 "Paused" 或 "Inactive"，点击 **"Resume"** 或 **"Restore"** 按钮

3. **等待数据库启动**
   - 恢复过程通常需要 1-2 分钟
   - 等待状态变为 "Active" 或 "Healthy"

### 步骤 2: 验证连接

恢复数据库后，运行测试：
```bash
cd note-app
npm run db:test
```

### 步骤 3: 如果仍然无法连接

#### 选项 A: 检查 IPv4/IPv6 兼容性
Supabase 默认使用 IPv6，某些环境可能不支持。

**解决方法：使用连接池（推荐）**
```env
# 使用端口 6543 的连接池，它支持 IPv4
DATABASE_URL="postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true"
```

#### 选项 B: 添加连接超时参数
```env
DATABASE_URL="postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true&connect_timeout=30&pool_timeout=30"
```

#### 选项 C: 检查防火墙/网络
- 确保你的网络允许访问 Supabase 的端口（5432 和 6543）
- 尝试使用 VPN 或不同的网络环境

### 步骤 4: 防止未来自动暂停

**方法 1: 定期访问（简单）**
- 每周至少访问一次你的应用
- 或者每周运行一次 `npm run db:test`

**方法 2: 设置健康检查（推荐）**
创建一个简单的 cron job 或使用 Vercel Cron Jobs：

```typescript
// app/api/cron/keep-alive/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok' });
  } catch (error) {
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
```

然后在 `vercel.json` 中配置：
```json
{
  "crons": [{
    "path": "/api/cron/keep-alive",
    "schedule": "0 0 * * *"
  }]
}
```

**方法 3: 升级到付费计划**
- Supabase Pro 计划不会自动暂停
- 价格: $25/月

## 其他可能的原因（概率较低）

### 1. Supabase 维护中
- 访问 https://status.supabase.com/ 检查服务状态

### 2. 密码错误
- 在 Supabase Dashboard 中重置数据库密码
- 更新 `.env` 文件中的密码

### 3. 项目被删除
- 免费项目在暂停 90 天后会被永久删除
- 检查你的 Supabase Dashboard 是否还能看到这个项目

## 快速诊断命令

```bash
# 测试数据库连接
cd note-app
npm run db:test

# 如果上面失败，尝试 ping 服务器
ping db.llroqdgpohslhfejwxrn.supabase.co

# 测试端口连接（Windows PowerShell）
Test-NetConnection -ComputerName db.llroqdgpohslhfejwxrn.supabase.co -Port 5432
Test-NetConnection -ComputerName db.llroqdgpohslhfejwxrn.supabase.co -Port 6543
```

## 总结

**最可能的原因**: Supabase 免费版数据库因 7 天无活动而自动暂停

**立即行动**:
1. 访问 https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn
2. 点击 "Resume" 恢复数据库
3. 等待 1-2 分钟
4. 运行 `npm run db:test` 验证连接

**长期解决方案**:
- 设置定期健康检查（推荐）
- 或升级到付费计划
