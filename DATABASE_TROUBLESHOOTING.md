# 数据库连接故障排除指南

## 快速诊断

运行以下命令测试数据库连接：

```bash
cd note-app
npm run db:test
```

## 当前状态

❌ **数据库无法连接**

错误信息：
```
Can't reach database server at `db.llroqdgpohslhfejwxrn.supabase.co:6543`
```

## 最可能的原因

### 1. Supabase 数据库已暂停 ⭐ (最常见)

**Supabase 免费版**会在 **7 天不活动**后自动暂停数据库以节省资源。

**解决步骤**：

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择项目：`llroqdgpohslhfejwxrn`
4. 查看项目状态：
   - 如果显示 **"Paused"** 或 **"Inactive"**
   - 点击 **"Resume"** 或 **"Restore"** 按钮
5. 等待 **1-2 分钟**让数据库完全启动
6. 重新测试：`npm run db:test`

### 2. Supabase 正在维护

根据 Supabase 状态页面，可能正在进行维护。

**检查维护状态**：
- 访问 [Supabase Status](https://status.supabase.com/)
- 查看是否有正在进行的维护

**维护期间**：
- 数据库可能暂时无法访问
- 等待维护完成后重试

### 3. 网络连接问题（IPv6 问题）⭐

**症状**：
- Supabase Dashboard 显示数据库健康
- 但本地无法连接
- Ping 测试失败或超时

**测试网络连接**：

```powershell
# Windows - 测试连接
Test-NetConnection -ComputerName db.llroqdgpohslhfejwxrn.supabase.co -Port 6543

# Ping 测试
ping db.llroqdgpohslhfejwxrn.supabase.co
```

**如果显示 IPv6 地址但连接失败**：

```
警告: TCP connect to (2406:da1c:...) failed
TcpTestSucceeded : False
```

这是 **IPv6 连接问题**！

**解决方案**：使用 IPv4 兼容的 Pooler 地址

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入 **Settings** > **Database**
3. 找到 **Connection pooling** 部分
4. 复制 IPv4 兼容的连接字符串（格式如下）：

```env
# 新格式（推荐）
DATABASE_URL="postgresql://postgres.llroqdgpohslhfejwxrn:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

5. 更新 `note-app/.env` 文件
6. 重新测试：`npm run db:test`

**详细步骤**：查看 `FIX_IPV6_CONNECTION.md` 文件

**可能的网络问题**：
- ⭐ **IPv6 不可用**（最常见）
- 防火墙阻止连接
- VPN 或代理问题
- ISP 限制

### 4. 数据库凭据错误

**检查 .env 文件**：

```bash
# 查看配置（Windows）
type .env | findstr DATABASE_URL

# 查看配置（Linux/Mac）
cat .env | grep DATABASE_URL
```

**正确的格式**：

```env
# 连接池（端口 6543）- 用于应用查询
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true"

# 直连（端口 5432）- 用于迁移
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.llroqdgpohslhfejwxrn.supabase.co:5432/postgres"
```

**获取正确的凭据**：
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目
3. 进入 **Settings** > **Database**
4. 复制 **Connection string** 并更新 `.env`

## 验证修复

运行以下命令验证连接：

```bash
# 测试连接
npm run db:test

# 如果连接成功，尝试打开 Prisma Studio
npm run db:studio

# 推送 schema 到数据库
npm run db:push
```

## 成功的输出示例

```
🔍 开始测试数据库连接...

📋 环境变量检查:
DATABASE_URL: ✅ 已设置
DIRECT_URL: ✅ 已设置

🔗 连接字符串: postgresql://postgres:****@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true

⏳ 尝试连接数据库...
✅ 数据库连接成功！

⏳ 测试查询...
✅ 查询成功！
📊 数据统计:
   - 用户数: 5
   - 笔记数: 23

🎉 数据库连接测试通过！
```

## 预防措施

### 避免数据库自动暂停

1. **定期访问应用**：每周至少访问一次
2. **升级到 Pro 版**：Supabase Pro ($25/月) 不会自动暂停
3. **设置健康检查**：
   - 使用 GitHub Actions 定时 ping 数据库
   - 使用 Vercel Cron Jobs 定期查询

### 示例：GitHub Actions 健康检查

创建 `.github/workflows/db-keepalive.yml`：

```yaml
name: Database Keep-Alive

on:
  schedule:
    # 每天运行一次（UTC 时间）
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  ping-database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd note-app
          npm install
      
      - name: Test database connection
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
        run: |
          cd note-app
          npm run db:test
```

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. `npm run db:test` 的完整输出
2. Supabase 项目状态截图
3. `.env` 文件内容（**隐藏密码**）
4. 网络测试结果

## 相关资源

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Status](https://status.supabase.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)

---

**最后更新**: 2024-11-22
