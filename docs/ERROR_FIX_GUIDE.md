# 解构错误修复指南

## 错误信息
```
TypeError: Cannot destructure property 'data' of '(0 , r.wV)(...)' as it is undefined
at n (.next/server/chunks/1062.js:1:9166) {digest: '147385291'}
```

## 问题原因

这个错误通常由以下原因引起：

1. **缓存问题**: `.next` 构建缓存包含旧代码
2. **解构 undefined**: 尝试解构一个 undefined 的对象
3. **异步数据获取失败**: Promise 返回 undefined

## 已实施的修复

### 1. 修复 `notes/page.tsx`

```typescript
// 安全解构，提供默认值
const { 
    notes = [], 
    totalCount = 0, 
    totalPages = 0, 
    currentPage = 1 
} = notesData || {}

const tags = (tagsResult?.success ? tagsResult.data : []) as Array<{ id: string; name: string }>
const categories = (categoriesResult?.success ? categoriesResult.data : []) as Array<{ id: string; name: string }>
```

### 2. 确保所有 Action 返回正确的类型

所有 server actions 都返回 `ActionResult` 类型：
```typescript
type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> }
```

## 本地修复步骤

如果在本地开发环境遇到此错误：

### 步骤 1: 清理缓存
```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# Linux/Mac
rm -rf .next
rm -rf node_modules/.cache
```

### 步骤 2: 重新安装依赖（可选）
```bash
npm install
```

### 步骤 3: 重新启动开发服务器
```bash
npm run dev
```

## Vercel 部署修复步骤

如果在 Vercel 上遇到此错误：

### 方法 1: 触发重新部署
1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击 "Deployments" 标签
4. 点击最新部署旁边的 "..." 菜单
5. 选择 "Redeploy"
6. 勾选 "Use existing Build Cache" 的选项（取消勾选以强制重新构建）

### 方法 2: 清除构建缓存
1. 进入项目设置 (Settings)
2. 找到 "Build & Development Settings"
3. 点击 "Clear Build Cache"
4. 重新部署

### 方法 3: 推送新的提交
```bash
# 创建一个空提交来触发重新部署
git commit --allow-empty -m "chore: trigger rebuild"
git push origin main
```

## 验证修复

### 本地验证
1. 访问 `http://localhost:3000/notes`
2. 检查浏览器控制台是否有错误
3. 检查终端是否有服务器错误

### Vercel 验证
1. 访问你的 Vercel 部署 URL
2. 导航到 `/notes` 页面
3. 检查 Vercel 函数日志（Deployments > Functions）

## 预防措施

### 1. 始终使用安全解构
```typescript
// ❌ 不安全
const { data } = await someFunction()

// ✅ 安全
const result = await someFunction()
const { data = [] } = result || {}
```

### 2. 使用可选链
```typescript
// ❌ 不安全
const value = result.success ? result.data : []

// ✅ 安全
const value = result?.success ? result.data : []
```

### 3. 添加错误边界
```typescript
try {
    const data = await fetchData()
    return data
} catch (error) {
    console.error('Error fetching data:', error)
    return { notes: [], totalCount: 0, totalPages: 0, currentPage: 1 }
}
```

## 相关文件

- `src/app/notes/page.tsx` - 笔记列表页面
- `src/lib/actions/notes.ts` - 笔记相关 actions
- `src/lib/actions/tags.ts` - 标签相关 actions
- `src/lib/actions/categories.ts` - 分类相关 actions

## 如果问题仍然存在

1. **检查环境变量**: 确保所有必需的环境变量都已设置
   ```bash
   # 本地
   cat .env.local
   
   # Vercel
   # 在 Settings > Environment Variables 中检查
   ```

2. **检查数据库连接**: 确保 Prisma 能连接到数据库
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **查看完整错误日志**:
   - 本地: 检查终端输出
   - Vercel: 查看 Functions 日志

4. **联系支持**: 如果以上都不行，提供以下信息：
   - 完整错误堆栈
   - 浏览器控制台日志
   - Vercel 函数日志
   - 环境变量配置（隐藏敏感信息）

## 更新日志

- **2024-11-22**: 初始修复 - 添加安全解构和默认值
- **2024-11-22**: 清理 .next 缓存


---

## 数据库连接错误

### 错误信息
```
Error: Invalid `prisma.note.findMany()` invocation:
Can't reach database server at `db.llroqdgpohslhfejwxrn.supabase.co:5432`
Please make sure your database server is running at `db.llroqdgpohslhfejwxrn.supabase.co:5432`
```

### 原因分析
1. **Supabase 免费版数据库自动暂停**：超过 7 天不活动会自动暂停
2. **网络连接问题**：防火墙或网络限制
3. **数据库配置错误**：连接字符串配置不正确
4. **Prisma Client 缓存问题**：使用了旧的连接配置

### 解决方案

#### 方案 1：唤醒 Supabase 数据库（最常见）⭐

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`llroqdgpohslhfejwxrn`
3. 如果看到 "Database paused" 或 "Inactive" 提示：
   - 点击 **"Resume"** 或 **"Restore"** 按钮
   - 或者点击 **"Unpause"** 按钮
4. 等待 1-2 分钟让数据库完全启动
5. 刷新页面，重新运行应用

**提示**：Supabase 免费版在 7 天不活动后会自动暂停数据库以节省资源。

#### 方案 2：测试数据库连接

在项目根目录运行：

```bash
cd note-app
npx prisma db pull
```

如果成功，说明数据库连接正常。如果失败，检查错误信息。

#### 方案 3：检查环境变量配置

确保 `.env` 文件中的配置正确：

```env
# 连接池 (用于应用查询) - 端口 6543 ✅
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true"

# 直连 (用于迁移) - 端口 5432 ✅
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.llroqdgpohslhfejwxrn.supabase.co:5432/postgres"
```

**重要提示**：
- `DATABASE_URL` 使用端口 **6543**（连接池，用于应用查询）
- `DIRECT_URL` 使用端口 **5432**（直连，用于数据库迁移）
- 确保密码正确（从 Supabase 项目设置中获取）

#### 方案 4：重新生成 Prisma Client

如果遇到 Windows 文件锁定问题：

1. **关闭所有终端和开发服务器**（Ctrl+C）
2. **关闭 VS Code 或其他编辑器**
3. 重新打开终端，运行：

```bash
cd note-app
npx prisma generate
```

如果仍然失败，尝试：

```bash
# 删除 Prisma Client 缓存
Remove-Item -Recurse -Force node_modules\.prisma
Remove-Item -Recurse -Force node_modules\@prisma

# 重新安装
npm install
npx prisma generate
```

#### 方案 5：使用 Prisma Studio 测试

```bash
cd note-app
npm run db:studio
```

如果能打开 Prisma Studio（浏览器会自动打开 http://localhost:5556），说明数据库连接正常。

**注意**：如果遇到 "Environment variable not found: DATABASE_URL" 错误，确保：
1. `.env` 文件存在于 `note-app` 目录
2. 使用 `npm run db:studio` 而不是直接运行 `npx prisma studio`
3. 已安装 `dotenv-cli`：`npm install -D dotenv-cli`

#### 方案 6：检查 Supabase 项目状态

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 检查项目状态：
   - **Active** ✅ - 正常运行
   - **Paused** ⚠️ - 需要恢复
   - **Inactive** ⚠️ - 需要重新激活
3. 检查数据库连接信息：
   - 进入 **Settings** > **Database**
   - 复制 **Connection string** 并更新 `.env` 文件

#### 方案 7：运行数据库迁移

如果数据库表不存在：

```bash
cd note-app
npx prisma db push
```

这会根据 `schema.prisma` 创建所有必需的表。

### 预防措施

1. **定期访问应用**：每周至少访问一次，避免数据库自动暂停
2. **升级到付费版**：Supabase Pro 版不会自动暂停（$25/月）
3. **设置健康检查**：创建定时任务定期 ping 数据库
4. **监控数据库状态**：在 Supabase Dashboard 中启用通知

### 常见问题

**Q: 为什么错误显示端口 5432，但我配置的是 6543？**

A: Prisma 在某些情况下会使用 `DIRECT_URL`（端口 5432）而不是 `DATABASE_URL`（端口 6543）。确保两个 URL 都正确配置。

**Q: 数据库恢复后还是连接失败？**

A: 等待 2-3 分钟，Supabase 数据库完全启动需要时间。然后重启开发服务器。

**Q: 如何避免数据库自动暂停？**

A: 
- 升级到 Supabase Pro 版
- 或者设置定时任务（如 GitHub Actions）每天访问一次数据库

### 相关文档

- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma Connection Management](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management)

---

## Next-Auth Session 错误

### 错误信息
```
Error: [next-auth]: `useSession` must be wrapped in a <SessionProvider />
```

### 原因分析

在 Next.js App Router 中，客户端组件使用 `useSession()` 钩子必须被 `<SessionProvider>` 包裹。

### 解决方案

**不要使用 `useSession()`**，改为从服务端传递 session 数据：

#### 错误示例 ❌

```typescript
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session } = useSession(); // ❌ 需要 SessionProvider
  // ...
}
```

#### 正确示例 ✅

```typescript
// 客户端组件
'use client';

interface MyComponentProps {
  userId?: string;
}

export function MyComponent({ userId }: MyComponentProps) {
  // 使用传递的 userId
  // ...
}
```

```typescript
// 服务端组件（layout.tsx 或 page.tsx）
import { auth } from '@/auth';
import { MyComponent } from './my-component';

export default async function Page() {
  const session = await auth();
  
  return <MyComponent userId={session?.user?.id} />;
}
```

### 最佳实践

1. **在服务端组件中使用 `auth()`**
2. **通过 props 传递数据给客户端组件**
3. **避免在 App Router 中使用 `SessionProvider`**（除非必要）

### 相关文件

- `src/components/offline/data-recovery.tsx` - 已修复
- `src/components/offline/unload-warning.tsx` - 已修复
- `src/app/layout.tsx` - 服务端 session 获取

---

## Prisma 环境变量错误

### 错误信息
```
error: Environment variable not found: DATABASE_URL.
  -->  schema.prisma:9
   |
 8 |   provider  = "postgresql"
 9 |   url       = env("DATABASE_URL")
   |
```

### 原因分析

Prisma CLI 工具（如 `prisma studio`、`prisma migrate`）在单独的进程中运行，不会自动加载 `.env` 文件中的环境变量。

### 解决方案

#### 方法 1：使用 npm scripts（推荐）✅

项目已配置好 npm scripts，直接使用：

```bash
cd note-app

# 打开 Prisma Studio
npm run db:studio

# 运行数据库迁移
npm run db:migrate

# 推送 schema 到数据库
npm run db:push

# 生成 Prisma Client
npm run db:generate
```

#### 方法 2：使用 dotenv-cli

如果需要手动运行 Prisma 命令：

```bash
# 安装 dotenv-cli（如果还没安装）
npm install -D dotenv-cli

# 使用 dotenv-cli 运行 Prisma 命令
npx dotenv -e .env -- npx prisma studio
npx dotenv -e .env -- npx prisma migrate dev
npx dotenv -e .env -- npx prisma db push
```

#### 方法 3：临时设置环境变量（Windows）

```powershell
# PowerShell
$env:DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
npx prisma studio
```

```cmd
# CMD
set DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true
npx prisma studio
```

#### 方法 4：检查 .env 文件

确保 `.env` 文件存在且包含正确的配置：

```bash
# 检查文件是否存在
cd note-app
dir .env  # Windows
ls -la .env  # Linux/Mac

# 查看内容（Windows）
type .env

# 查看内容（Linux/Mac）
cat .env
```

`.env` 文件应该包含：

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.llroqdgpohslhfejwxrn.supabase.co:5432/postgres"
```

### 常见问题

**Q: 为什么 Next.js 开发服务器能读取 .env，但 Prisma CLI 不能？**

A: Next.js 内置了 `.env` 文件加载功能，但 Prisma CLI 需要显式指定。使用 `dotenv-cli` 或 npm scripts 可以解决这个问题。

**Q: 我已经有 .env 文件，为什么还是找不到？**

A: 确保：
1. 文件名是 `.env`（不是 `.env.local` 或其他）
2. 文件在 `note-app` 目录下（不是项目根目录）
3. 使用正确的命令运行（`npm run db:studio` 而不是 `npx prisma studio`）

**Q: 可以使用 .env.local 吗？**

A: 可以，但需要显式指定：
```bash
npx dotenv -e .env.local -- npx prisma studio
```

### 相关文档

- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [dotenv-cli Documentation](https://github.com/entropitor/dotenv-cli)

---

## 更新日志

- **2024-11-22**: 添加数据库连接错误修复指南
- **2024-11-22**: 添加 Next-Auth Session 错误修复指南
- **2024-11-22**: 初始修复 - 添加安全解构和默认值
- **2024-11-22**: 清理 .next 缓存
