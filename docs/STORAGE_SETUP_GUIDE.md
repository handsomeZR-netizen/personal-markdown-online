# Supabase Storage Setup Guide

本指南介绍如何设置 Supabase Storage 用于存储笔记图片。

## 概述

我们使用 Supabase Storage 的 `note-images` 存储桶来存储用户上传的图片。配置包括：

- **公开读取**: 所有人都可以访问图片 URL
- **认证写入**: 只有登录用户可以上传图片
- **文件大小限制**: 10MB
- **支持的格式**: JPEG, PNG, GIF, WebP, SVG

## 设置步骤

### 1. 创建存储桶

#### 方法 A: 通过 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击左侧菜单的 **Storage**
4. 点击 **New bucket** 按钮
5. 配置存储桶：
   - **Name**: `note-images`
   - **Public bucket**: ✅ 启用（允许公开读取）
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `image/svg+xml`
6. 点击 **Create bucket**

#### 方法 B: 通过 SQL 脚本

1. 打开 Supabase Dashboard → **SQL Editor**
2. 点击 **New query**
3. 复制并运行 `supabase-storage-setup.sql` 文件内容
4. 检查输出确认创建成功

### 2. 配置 RLS 策略

存储桶的 RLS（Row Level Security）策略控制谁可以访问文件。

#### 通过 SQL 配置（推荐）

运行 `supabase-storage-setup.sql` 脚本会自动创建以下策略：

1. **公开读取图片**: 允许所有人读取
2. **认证用户可以上传图片**: 只有登录用户可以上传
3. **用户可以更新自己的图片**: 用户只能更新自己上传的图片
4. **用户可以删除自己的图片**: 用户只能删除自己上传的图片

#### 手动配置 RLS

如果需要手动配置，在 SQL Editor 中运行：

```sql
-- 允许所有人读取
CREATE POLICY "公开读取图片" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'note-images');

-- 允许认证用户上传
CREATE POLICY "认证用户可以上传图片" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'note-images' 
        AND auth.role() = 'authenticated'
    );

-- 允许用户更新自己的图片
CREATE POLICY "用户可以更新自己的图片" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'note-images' 
        AND auth.uid()::text = owner
    );

-- 允许用户删除自己的图片
CREATE POLICY "用户可以删除自己的图片" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'note-images' 
        AND auth.uid()::text = owner
    );
```

### 3. 验证设置

运行测试脚本验证配置：

```bash
cd note-app
npm run test:storage
```

或者手动运行：

```bash
npx tsx scripts/test-storage-setup.ts
```

测试脚本会检查：
- ✅ 存储桶是否存在
- ✅ 存储桶是否可访问
- ✅ 公开 URL 是否可以生成
- ✅ 上传功能是否正常（需要认证）

### 4. 环境变量

确保 `.env.local` 包含以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 使用方法

### 在代码中上传图片

```typescript
import { uploadImage } from '@/lib/storage/image-upload';

// 上传单个图片
const result = await uploadImage(file, noteId);
console.log('Image URL:', result.url);

// 上传多个图片
import { uploadImages } from '@/lib/storage/image-upload';
const results = await uploadImages(files, noteId);
```

### 删除图片

```typescript
import { deleteImage } from '@/lib/storage/image-upload';

await deleteImage(imageUrl);
```

### 获取公开 URL

```typescript
import { getPublicUrl } from '@/lib/storage/image-upload';

const url = getPublicUrl('note-id/image.jpg');
```

## 文件组织结构

图片按笔记 ID 组织：

```
note-images/
├── note-id-1/
│   ├── 1234567890-abc123.jpg
│   └── 1234567891-def456.png
├── note-id-2/
│   └── 1234567892-ghi789.jpg
└── ...
```

每个文件名格式：`{timestamp}-{random}.{ext}`

## 故障排除

### 问题 1: 存储桶不存在

**错误**: `Bucket "note-images" not found`

**解决方案**:
1. 检查 Supabase Dashboard → Storage
2. 确认存储桶名称为 `note-images`
3. 如果不存在，按照上述步骤创建

### 问题 2: 无法访问存储桶

**错误**: `Error accessing bucket: new row violates row-level security policy`

**解决方案**:
1. 运行 `supabase-storage-setup.sql` 配置 RLS 策略
2. 确认策略已创建：Supabase Dashboard → Storage → Policies

### 问题 3: 上传失败

**错误**: `Upload failed: JWT expired` 或 `Not authenticated`

**解决方案**:
1. 确保用户已登录
2. 检查 JWT token 是否有效
3. 验证 RLS 策略是否正确配置

### 问题 4: 图片无法访问

**错误**: 图片 URL 返回 404

**解决方案**:
1. 确认存储桶设置为 **Public**
2. 检查 RLS 策略是否允许公开读取
3. 验证文件路径是否正确

## 安全考虑

1. **文件大小限制**: 限制为 10MB 防止滥用
2. **文件类型限制**: 只允许图片格式
3. **认证要求**: 只有登录用户可以上传
4. **所有权验证**: 用户只能删除自己上传的图片
5. **公开读取**: 图片 URL 可以被任何人访问（适合分享）

## 性能优化

1. **CDN 加速**: Supabase Storage 自动使用 CDN
2. **缓存控制**: 设置 `Cache-Control: 3600` (1小时)
3. **图片压缩**: 建议在上传前压缩图片
4. **懒加载**: 在前端使用懒加载优化性能

## 相关文件

- `supabase-storage-setup.sql` - SQL 配置脚本
- `src/lib/storage/image-upload.ts` - 图片上传管理器
- `scripts/test-storage-setup.ts` - 测试脚本
- `doc/STORAGE_SETUP_GUIDE.md` - 本文档

## 下一步

设置完成后，你可以：

1. ✅ 在 Tiptap 编辑器中集成图片上传
2. ✅ 实现图片粘贴上传功能
3. ✅ 实现图片拖拽上传功能
4. ✅ 添加图片灯箱预览

参考 `tasks.md` 中的任务 5 和 6。
