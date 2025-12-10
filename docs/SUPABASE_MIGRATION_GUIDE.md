# Supabase SDK 迁移指南

## ✅ 已完成的迁移

项目已从 Prisma 直连迁移到 Supabase JS SDK，完全绕过本地 5432 端口问题。

### 1. 核心文件

- ✅ `src/lib/supabaseClient.ts` - Supabase 客户端配置
- ✅ `src/lib/supabase-auth.ts` - 认证服务
- ✅ `src/lib/supabase-notes.ts` - 笔记数据服务

### 2. API 路由迁移

- ✅ `src/app/api/notes/route.ts` - 创建和获取笔记
- ✅ `src/app/api/notes/[id]/route.ts` - 单个笔记操作
- ✅ `src/app/api/notes/batch-sync/route.ts` - 批量同步

### 3. 认证迁移

- ✅ `src/auth.ts` - NextAuth 配置
- ✅ `src/lib/actions/auth.ts` - 注册和登录 actions

## 🔧 环境变量

确保 `.env.local` 包含：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://llroqdgpohslhfejwxrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth
NEXTAUTH_SECRET=local-dev-secret
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 优势

1. **绕过端口阻断** - 不再需要本地 5432 端口
2. **简化连接** - 通过 HTTPS API 直接访问数据库
3. **更好的性能** - 使用 Supabase 的连接池
4. **保持兼容** - 现有功能完全保留

## 📝 使用示例

### 获取笔记

```typescript
import { getUserNotes } from '@/lib/supabase-notes'

const { data: notes, error } = await getUserNotes(userId)
```

### 创建笔记

```typescript
import { createNote } from '@/lib/supabase-notes'

const { data: note, error } = await createNote({
  title: '标题',
  content: '内容',
  userId: 'user-id',
})
```

### 更新笔记

```typescript
import { updateNote } from '@/lib/supabase-notes'

const { data: note, error } = await updateNote(noteId, userId, {
  title: '新标题',
  content: '新内容',
})
```

### 删除笔记

```typescript
import { deleteNote } from '@/lib/supabase-notes'

const { error } = await deleteNote(noteId, userId)
```

## ⚠️ 注意事项

1. **Prisma 保留** - Prisma schema 和 migrations 保留用于数据库结构管理
2. **标签功能** - 当前版本暂未迁移标签关联，后续可以添加
3. **类型安全** - 使用 TypeScript 类型定义确保类型安全

## 🔄 后续优化

如果需要完全移除 Prisma：

1. 删除 `@prisma/client` 和 `prisma` 依赖
2. 删除 `prisma/` 目录
3. 更新 `package.json` scripts
4. 使用 Supabase CLI 管理数据库迁移

## 🧪 测试

启动开发服务器测试：

```bash
npm run dev
```

访问 http://localhost:3000 验证：
- ✅ 用户注册
- ✅ 用户登录
- ✅ 创建笔记
- ✅ 编辑笔记
- ✅ 删除笔记
- ✅ 离线同步
