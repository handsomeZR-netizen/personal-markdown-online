# 图片上传失败修复指南

## 🔍 错误信息

```
上传失败: Failed to fetch
```

## 📋 问题原因

图片上传到 Supabase Storage 失败，可能的原因：

1. **存储桶不存在** - `note-images` 存储桶未创建
2. **权限配置错误** - 存储桶的 RLS 策略未正确配置
3. **网络问题** - 无法连接到 Supabase
4. **CORS 配置** - 跨域请求被阻止

## 🔧 解决方案

### 步骤 1: 检查 Supabase Storage 存储桶

1. 访问 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目: `llroqdgpohslhfejwxrn`
3. 进入 **Storage** 页面
4. 检查是否存在 `note-images` 存储桶

### 步骤 2: 创建存储桶（如果不存在）

在 Supabase Dashboard 的 Storage 页面：

1. 点击 **New bucket**
2. 填写信息：
   - **Name**: `note-images`
   - **Public bucket**: ✅ 勾选（允许公开访问）
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/*`

或者使用 SQL 创建：

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true);
```

### 步骤 3: 配置 RLS 策略

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 允许所有认证用户上传图片
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-images');

-- 允许所有人查看图片（公开访问）
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'note-images');

-- 允许用户删除自己上传的图片
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 允许用户更新自己上传的图片
CREATE POLICY "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());
```

### 步骤 4: 验证配置

运行测试脚本：

```bash
cd note-app
npx tsx scripts/test-storage-setup.ts
```

### 步骤 5: 检查网络连接

在浏览器控制台测试：

```javascript
// 测试 Supabase 连接
fetch('https://llroqdgpohslhfejwxrn.supabase.co/storage/v1/bucket/note-images')
  .then(res => res.json())
  .then(data => console.log('存储桶信息:', data))
  .catch(err => console.error('连接失败:', err));
```

## ⚠️ 常见 SQL 错误

### 错误 1: operator does not exist: text = uuid

**原因**: 类型不匹配，`owner` 字段是 `uuid` 类型，不能用 `::text` 转换后比较。

**解决**: 直接比较 UUID 类型
```sql
-- ❌ 错误写法
USING (bucket_id = 'note-images' AND auth.uid()::text = owner)

-- ✅ 正确写法
USING (bucket_id = 'note-images' AND owner = auth.uid())
```

### 错误 2: syntax error at or near "CREATE"

**原因**: SQL 语句缺少分号（`;`）结尾。

**解决**: 确保每个语句都以分号结尾
```sql
-- ❌ 错误写法（缺少分号）
CREATE POLICY "policy1" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'note-images')

-- ✅ 正确写法（有分号）
CREATE POLICY "policy1" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'note-images');
```

## 🚀 快速修复脚本

我已经为你准备了三个脚本：
- **`QUICK_FIX.sql`** - 最简单，直接复制粘贴（推荐）⭐
- `supabase-storage-simple-setup.sql` - 简化版
- `supabase-storage-complete-setup.sql` - 完整版

### 方法 1: 使用 QUICK_FIX.sql（最简单）

直接复制 `QUICK_FIX.sql` 的全部内容，粘贴到 Supabase Dashboard 的 SQL Editor 中执行。

### 方法 2: 手动执行以下 SQL

```sql
-- 完整的存储桶设置脚本
-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;

-- 3. 创建新的策略
-- 允许认证用户上传
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-images');

-- 允许公开查看
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'note-images');

-- 允许用户删除自己的图片
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 允许用户更新自己的图片
CREATE POLICY "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 4. 验证配置
SELECT 
  b.id,
  b.name,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types,
  COUNT(p.id) as policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'objects' AND p.policyname LIKE '%images%'
WHERE b.id = 'note-images'
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types;
```

## 🔍 调试步骤

### 1. 检查浏览器控制台

按 F12 打开开发者工具，查看：
- **Console** 标签：查看详细错误信息
- **Network** 标签：查看上传请求的状态

### 2. 检查请求详情

在 Network 标签中找到失败的请求：
- **Request URL**: 应该是 `https://llroqdgpohslhfejwxrn.supabase.co/storage/v1/object/note-images/...`
- **Status Code**: 查看状态码（400, 401, 403, 404, 500 等）
- **Response**: 查看错误响应内容

### 3. 常见错误码

| 状态码 | 原因 | 解决方案 |
|--------|------|----------|
| 400 | 请求格式错误 | 检查文件格式和大小 |
| 401 | 未认证 | 确保用户已登录 |
| 403 | 权限不足 | 检查 RLS 策略 |
| 404 | 存储桶不存在 | 创建 note-images 存储桶 |
| 413 | 文件太大 | 文件超过 10MB 限制 |
| 500 | 服务器错误 | 检查 Supabase 服务状态 |

## 📝 临时解决方案

如果 Supabase Storage 暂时无法使用，可以使用本地存储：

### 方案 1: 使用 Base64 编码（小图片）

```typescript
// 将图片转换为 Base64 并直接存储在笔记内容中
const reader = new FileReader();
reader.onload = (e) => {
  const base64 = e.target?.result as string;
  // 插入到编辑器: ![image](base64...)
};
reader.readAsDataURL(file);
```

### 方案 2: 使用 Next.js API Route

创建本地上传接口：

```typescript
// src/app/api/upload/route.ts
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const path = `./public/uploads/${Date.now()}-${file.name}`;
  await writeFile(path, buffer);
  
  return NextResponse.json({ url: `/uploads/${file.name}` });
}
```

## ✅ 验证修复

修复后，测试上传功能：

1. 访问 http://localhost:3000/notes/new
2. 拖拽一张图片到编辑器
3. 查看是否显示上传进度
4. 确认图片成功插入到编辑器

## 📞 需要帮助？

如果问题仍然存在，请提供：

1. **浏览器控制台的完整错误信息**
2. **Network 标签中失败请求的详情**
3. **Supabase Dashboard 中存储桶的截图**
4. **是否能访问 Supabase Dashboard**

---

**最后更新**: 2024-12-09
**状态**: 待修复
