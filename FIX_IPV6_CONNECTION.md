# 修复 IPv6 连接问题

## 问题诊断

你的网络环境无法访问 Supabase 的 IPv6 地址，导致数据库连接失败。

```
❌ Ping db.llroqdgpohslhfejwxrn.supabase.co 失败
❌ 无法连接到端口 5432 和 6543
```

## 解决方案：使用 IPv4 兼容的连接池地址

Supabase 提供了 IPv4 兼容的连接池地址（Supavisor Pooler）。

### 步骤 1：获取正确的连接字符串

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`llroqdgpohslhfejwxrn`
3. 进入 **Settings** > **Database**
4. 向下滚动到 **Connection string** 部分
5. 选择 **Connection pooling** 标签页
6. 复制 **Transaction mode** 或 **Session mode** 的连接字符串

### 步骤 2：识别正确的格式

正确的 IPv4 兼容连接字符串应该是以下格式之一：

**格式 1：新版 Pooler（推荐）**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**格式 2：旧版格式**
```
postgresql://postgres:[PASSWORD]@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true
```

### 步骤 3：更新 .env 文件

根据你从 Supabase Dashboard 获取的连接字符串，更新 `note-app/.env` 文件：

```env
# 连接池 (Pooler) - 用于应用查询
# 使用 IPv4 兼容的 pooler 地址
DATABASE_URL="postgresql://postgres.llroqdgpohslhfejwxrn:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# 直连 (Direct) - 用于迁移
# 如果直连也无法访问，可以暂时使用 pooler 地址
DIRECT_URL="postgresql://postgres.llroqdgpohslhfejwxrn:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**重要提示**：
- 将 `[YOUR_PASSWORD]` 替换为你的实际密码：`151692483515156555878`
- 将 `[REGION]` 替换为你的实际区域（如 `ap-southeast-1`、`us-east-1` 等）
- 从 Supabase Dashboard 复制完整的连接字符串最安全

### 步骤 4：测试连接

更新 `.env` 后，运行测试：

```bash
cd note-app
npm run db:test
```

如果成功，你应该看到：

```
✅ 数据库连接成功！
✅ 查询成功！
📊 数据统计:
   - 用户数: X
   - 笔记数: Y
```

## 替代方案

### 方案 A：启用 IPv6

如果你想使用原始的 IPv6 地址：

**Windows 10/11**：
1. 打开 **设置** > **网络和 Internet** > **以太网** 或 **Wi-Fi**
2. 点击你的网络连接
3. 点击 **编辑** IP 设置
4. 确保 IPv6 已启用

**路由器设置**：
1. 登录路由器管理界面
2. 查找 IPv6 设置
3. 启用 IPv6（如果你的 ISP 支持）

### 方案 B：使用 VPN 或代理

某些 VPN 服务支持 IPv6，可以帮助你访问 Supabase。

### 方案 C：使用 Cloudflare WARP

Cloudflare WARP 提供 IPv6 支持：

1. 下载 [Cloudflare WARP](https://1.1.1.1/)
2. 安装并启用
3. 重新测试连接

## 验证修复

### 测试 1：网络连接

```powershell
# 测试新的 pooler 地址
Test-NetConnection -ComputerName aws-0-ap-southeast-1.pooler.supabase.com -Port 6543
```

应该显示：
```
TcpTestSucceeded : True
```

### 测试 2：数据库连接

```bash
npm run db:test
```

### 测试 3：Prisma Studio

```bash
npm run db:studio
```

## 常见问题

**Q: 我不知道我的 Supabase 区域是什么？**

A: 在 Supabase Dashboard 的 **Settings** > **General** 中查看 **Region**。常见区域：
- `ap-southeast-1` - 新加坡
- `us-east-1` - 美国东部
- `eu-west-1` - 欧洲西部

**Q: 更新后还是无法连接？**

A: 
1. 确保从 Supabase Dashboard 复制了正确的连接字符串
2. 检查密码是否正确
3. 尝试重启开发服务器
4. 检查防火墙设置

**Q: 为什么会有 IPv6 问题？**

A: Supabase 的某些服务器只提供 IPv6 地址，但许多家庭网络和企业网络还不支持 IPv6。使用 Pooler 地址可以解决这个问题。

## 需要帮助？

如果以上步骤都无法解决问题，请提供：

1. Supabase Dashboard 中的完整连接字符串（隐藏密码）
2. 你的 Supabase 项目区域
3. `Test-NetConnection` 的完整输出
4. `npm run db:test` 的完整输出

---

**最后更新**: 2024-11-22
