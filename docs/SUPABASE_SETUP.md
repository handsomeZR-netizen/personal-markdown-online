# Supabase 设置完成指南

## ✅ 已完成的配置

### 1. 安装依赖
```bash
npm install @supabase/supabase-js
```

### 2. 环境变量配置
已在 `.env.local` 中添加：
```env
NEXT_PUBLIC_SUPABASE_URL=https://llroqdgpohslhfejwxrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 创建的文件

#### `src/lib/supabase.ts`
服务端 Supabase 客户端（用于 API 路由和服务端组件）

#### `src/lib/supabase-browser.ts`
浏览器端 Supabase 客户端（用于客户端组件）

#### `src/lib/supabase-test.ts`
命令行测试脚本

#### `src/app/test-supabase/page.tsx`
可视化测试页面

## 🧪 测试 Supabase 连接

### 方法 1: 使用可视化测试页面（推荐）
1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问测试页面：
   ```
   http://localhost:3000/test-supabase
   ```

3. 查看连接状态和详细信息

### 方法 2: 使用命令行测试
```bash
npx tsx src/lib/supabase-test.ts
```

## 📊 创建数据库表

在 Supabase 控制台 (https://supabase.com/dashboard) 执行以下步骤：

### 1. 打开 SQL Editor
Dashboard → SQL Editor → New Query

### 2. 创建 notes 表
```sql
-- 创建 notes 表
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notes_updated_at 
  BEFORE UPDATE ON notes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. 启用行级安全 (RLS)
```sql
-- 启用行级安全
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的笔记
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：用户只能插入自己的笔记
CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户只能更新自己的笔记
CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建策略：用户只能删除自己的笔记
CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. 创建其他表（可选）
```sql
-- 创建 tags 表
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建 note_tags 关联表
CREATE TABLE note_tags (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- 创建 categories 表
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- 为 notes 表添加 category_id
ALTER TABLE notes ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
```

## 🔐 配置认证

### 1. 启用邮箱认证
Dashboard → Authentication → Providers → Email

### 2. 配置邮件模板（可选）
Dashboard → Authentication → Email Templates

### 3. 配置重定向 URL
Dashboard → Authentication → URL Configuration
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

## 💻 使用示例

### 在客户端组件中使用
```tsx
"use client"

import { supabaseBrowser } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'

export function NotesComponent() {
  const [notes, setNotes] = useState([])

  useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabaseBrowser
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notes:', error)
      } else {
        setNotes(data)
      }
    }

    fetchNotes()
  }, [])

  return (
    <div>
      {notes.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  )
}
```

### 在服务端组件中使用
```tsx
import { supabase } from '@/lib/supabase'

export default async function NotesPage() {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      {notes.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  )
}
```

### 在 API 路由中使用
```tsx
// app/api/notes/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### 实时订阅
```tsx
"use client"

import { supabaseBrowser } from '@/lib/supabase-browser'
import { useEffect } from 'react'

export function RealtimeNotes() {
  useEffect(() => {
    const channel = supabaseBrowser
      .channel('notes-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, (payload) => {
        console.log('Note changed:', payload)
        // 更新 UI
      })
      .subscribe()

    return () => {
      supabaseBrowser.removeChannel(channel)
    }
  }, [])

  return <div>Realtime Notes</div>
}
```

## 🔄 从 Prisma 迁移到 Supabase

如果你想从当前的 Prisma + SQLite 迁移到 Supabase：

1. 导出现有数据
2. 在 Supabase 创建相同的表结构
3. 导入数据
4. 更新应用代码使用 Supabase 客户端

详细迁移步骤请参考 `SUPABASE_MIGRATION.md`

## 📚 常用操作

### 插入数据
```tsx
const { data, error } = await supabaseBrowser
  .from('notes')
  .insert({
    title: '新笔记',
    content: '内容',
    user_id: userId
  })
  .select()
```

### 更新数据
```tsx
const { data, error } = await supabaseBrowser
  .from('notes')
  .update({ title: '更新的标题' })
  .eq('id', noteId)
```

### 删除数据
```tsx
const { error } = await supabaseBrowser
  .from('notes')
  .delete()
  .eq('id', noteId)
```

### 查询数据
```tsx
// 简单查询
const { data } = await supabaseBrowser
  .from('notes')
  .select('*')

// 带条件查询
const { data } = await supabaseBrowser
  .from('notes')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10)

// 关联查询
const { data } = await supabaseBrowser
  .from('notes')
  .select(`
    *,
    category:categories(name),
    tags:note_tags(tag:tags(name))
  `)
```

## 🐛 故障排除

### 连接失败
- 检查环境变量是否正确配置
- 确认 Supabase 项目是否激活
- 检查网络连接

### 权限错误
- 确认已启用 RLS
- 检查策略是否正确配置
- 确认用户已登录

### 表不存在
- 在 Supabase 控制台创建表
- 检查表名是否正确

## 📖 更多资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript)
- [Next.js + Supabase 指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
