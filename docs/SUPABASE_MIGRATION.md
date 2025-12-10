# Supabase 迁移指南

## 概述
将应用从本地SQLite数据库迁移到Supabase云端PostgreSQL数据库。

## 为什么选择Supabase？

### 优势
- ✅ **云端托管**: 无需管理数据库服务器
- ✅ **PostgreSQL**: 功能强大的关系型数据库
- ✅ **实时功能**: 内置实时订阅
- ✅ **认证系统**: 完整的用户认证方案
- ✅ **存储服务**: 文件上传和管理
- ✅ **免费额度**: 慷慨的免费套餐
- ✅ **自动备份**: 数据安全有保障
- ✅ **全球CDN**: 快速访问

### 对比SQLite
| 特性 | SQLite | Supabase |
|------|--------|----------|
| 部署 | 本地文件 | 云端托管 |
| 并发 | 有限 | 高并发 |
| 扩展性 | 单机 | 可扩展 |
| 实时 | 不支持 | 支持 |
| 备份 | 手动 | 自动 |
| 协作 | 困难 | 简单 |

## 迁移步骤

### 1. 创建Supabase项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - Name: `note-app`
   - Database Password: 设置强密码（保存好！）
   - Region: 选择最近的区域（如 Singapore）
5. 等待项目创建完成（约2分钟）

### 2. 获取数据库连接信息

在Supabase项目中：
1. 进入 Settings → Database
2. 找到 Connection string
3. 选择 "URI" 模式
4. 复制连接字符串，格式如下：
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 3. 更新环境变量

编辑 `.env.local` 文件：

```env
# 数据库连接（替换为你的Supabase连接字符串）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# 认证密钥（保持不变）
AUTH_SECRET=79uuqzzaW1ONaS6GQxBhrieVoKjz8CJBlBV4h1WBTUc=

# AI API配置（保持不变）
DEEPSEEK_API_KEY=sk-4e3d7bb175a44822a032aab2a0fa105f
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Supabase配置（可选，用于实时功能）
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

**注意**:
- `DATABASE_URL`: 用于Prisma连接池
- `DIRECT_URL`: 用于迁移和直接连接
- 替换 `[YOUR-PASSWORD]` 为你的数据库密码
- 替换 `[PROJECT-REF]` 为你的项目引用ID

### 4. 更新Prisma Schema

编辑 `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  notes     Note[]

  @@index([email])
}

model Note {
  id         String    @id @default(cuid())
  title      String
  content    String    @db.Text
  summary    String?   @db.Text
  embedding  String?   @db.Text
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags       Tag[]
  category   Category? @relation(fields: [categoryId], references: [id])
  categoryId String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([userId])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([userId, createdAt])
  @@index([categoryId])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  notes Note[]
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  notes Note[]
}
```

**主要变化**:
- `provider`: `sqlite` → `postgresql`
- 添加 `directUrl` 配置
- 文本字段使用 `@db.Text` 类型

### 5. 执行数据库迁移

```bash
# 1. 生成新的迁移文件
npx prisma migrate dev --name init_supabase

# 2. 生成Prisma客户端
npx prisma generate

# 3. 查看数据库（可选）
npx prisma studio
```

### 6. 数据迁移（如果有现有数据）

如果你有现有的SQLite数据需要迁移：

#### 方案A: 手动导出导入（推荐小数据量）
```bash
# 1. 导出SQLite数据
npx prisma db pull --schema=prisma/schema.old.prisma

# 2. 使用Prisma Studio手动复制数据
npx prisma studio
```

#### 方案B: 使用脚本迁移（推荐大数据量）
创建 `scripts/migrate-to-supabase.ts`:

```typescript
import { PrismaClient as SQLiteClient } from '@prisma/client'
import { PrismaClient as PostgresClient } from '@prisma/client'

const sqlite = new SQLiteClient({
  datasources: { db: { url: 'file:./dev.db' } }
})

const postgres = new PostgresClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

async function migrate() {
  console.log('开始迁移数据...')
  
  // 迁移用户
  const users = await sqlite.user.findMany()
  for (const user of users) {
    await postgres.user.create({ data: user })
  }
  console.log(`✓ 迁移了 ${users.length} 个用户`)
  
  // 迁移分类
  const categories = await sqlite.category.findMany()
  for (const category of categories) {
    await postgres.category.create({ data: category })
  }
  console.log(`✓ 迁移了 ${categories.length} 个分类`)
  
  // 迁移标签
  const tags = await sqlite.tag.findMany()
  for (const tag of tags) {
    await postgres.tag.create({ data: tag })
  }
  console.log(`✓ 迁移了 ${tags.length} 个标签`)
  
  // 迁移笔记
  const notes = await sqlite.note.findMany({ include: { tags: true } })
  for (const note of notes) {
    const { tags, ...noteData } = note
    await postgres.note.create({
      data: {
        ...noteData,
        tags: {
          connect: tags.map(tag => ({ id: tag.id }))
        }
      }
    })
  }
  console.log(`✓ 迁移了 ${notes.length} 条笔记`)
  
  console.log('迁移完成！')
}

migrate()
  .catch(console.error)
  .finally(() => {
    sqlite.$disconnect()
    postgres.$disconnect()
  })
```

运行迁移脚本：
```bash
npx tsx scripts/migrate-to-supabase.ts
```

### 7. 测试应用

```bash
# 启动开发服务器
npm run dev

# 测试功能
# 1. 注册新用户
# 2. 创建笔记
# 3. 添加标签
# 4. 测试搜索
# 5. 测试AI功能
```

### 8. 部署到生产环境

#### Vercel部署
1. 推送代码到GitHub
2. 在Vercel导入项目
3. 配置环境变量：
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_API_URL`
4. 部署

#### 环境变量配置
在Vercel项目设置中添加：
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
AUTH_SECRET=...
DEEPSEEK_API_KEY=...
DEEPSEEK_API_URL=...
```

## 高级功能

### 1. 启用Row Level Security (RLS)

在Supabase SQL编辑器中执行：

```sql
-- 启用RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的笔记
CREATE POLICY "Users can view own notes"
  ON "Note" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own notes"
  ON "Note" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own notes"
  ON "Note" FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own notes"
  ON "Note" FOR DELETE
  USING (auth.uid()::text = "userId");
```

### 2. 实时订阅（可选）

安装Supabase客户端：
```bash
npm install @supabase/supabase-js
```

创建 `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

使用实时订阅：
```typescript
// 监听笔记变化
supabase
  .channel('notes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'Note' },
    (payload) => {
      console.log('笔记更新:', payload)
      // 更新UI
    }
  )
  .subscribe()
```

### 3. 全文搜索

在Supabase中启用全文搜索：

```sql
-- 创建全文搜索索引
CREATE INDEX notes_search_idx ON "Note" 
USING GIN (to_tsvector('chinese', title || ' ' || content));

-- 创建搜索函数
CREATE OR REPLACE FUNCTION search_notes(search_query text, user_id text)
RETURNS SETOF "Note" AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM "Note"
  WHERE "userId" = user_id
    AND to_tsvector('chinese', title || ' ' || content) @@ plainto_tsquery('chinese', search_query)
  ORDER BY ts_rank(to_tsvector('chinese', title || ' ' || content), plainto_tsquery('chinese', search_query)) DESC;
END;
$$ LANGUAGE plpgsql;
```

## 性能优化

### 1. 连接池配置
```env
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

### 2. 索引优化
```sql
-- 为常用查询添加索引
CREATE INDEX idx_notes_user_created ON "Note"("userId", "createdAt" DESC);
CREATE INDEX idx_notes_updated ON "Note"("updatedAt" DESC);
```

### 3. 查询优化
```typescript
// 使用select减少数据传输
const notes = await prisma.note.findMany({
  select: {
    id: true,
    title: true,
    createdAt: true,
    // 不包含content字段
  }
})
```

## 监控和维护

### 1. Supabase Dashboard
- 查看数据库使用情况
- 监控API请求
- 查看日志
- 管理用户

### 2. 备份策略
Supabase自动备份，但建议：
- 定期导出重要数据
- 使用版本控制管理schema
- 测试恢复流程

### 3. 成本控制
免费套餐限制：
- 500MB数据库空间
- 2GB带宽/月
- 50,000次认证用户

超出后升级到Pro套餐（$25/月）

## 故障排除

### 问题1: 连接超时
**解决**: 检查连接字符串，确保包含 `?pgbouncer=true`

### 问题2: 迁移失败
**解决**: 
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### 问题3: 权限错误
**解决**: 检查RLS策略，确保正确配置

### 问题4: 性能慢
**解决**: 
- 添加索引
- 使用连接池
- 优化查询

## 回滚方案

如果需要回滚到SQLite：

1. 恢复 `schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. 恢复 `.env.local`:
```env
DATABASE_URL=file:./dev.db
```

3. 重新迁移:
```bash
npx prisma migrate dev
```

## 检查清单

迁移前：
- [ ] 备份现有数据
- [ ] 创建Supabase项目
- [ ] 获取连接字符串
- [ ] 测试连接

迁移中：
- [ ] 更新schema.prisma
- [ ] 更新环境变量
- [ ] 执行迁移
- [ ] 迁移数据
- [ ] 测试功能

迁移后：
- [ ] 验证所有功能
- [ ] 配置RLS（可选）
- [ ] 设置监控
- [ ] 部署到生产环境
- [ ] 删除旧数据库文件

## 相关资源

- [Supabase文档](https://supabase.com/docs)
- [Prisma文档](https://www.prisma.io/docs)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Next.js部署指南](https://nextjs.org/docs/deployment)

## 支持

遇到问题？
- Supabase Discord: https://discord.supabase.com
- Prisma Discord: https://pris.ly/discord
- GitHub Issues: 在项目仓库提issue

## 更新时间
2024年11月20日
