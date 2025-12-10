-- =====================================================
-- Supabase Storage 完整设置脚本
-- 用于笔记应用的图片存储
-- =====================================================

-- 1. 创建 note-images 存储桶
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  true, -- 公开访问
  10485760, -- 10MB 文件大小限制
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 删除旧的 RLS 策略（如果存在）
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- 3. 创建新的 RLS 策略
-- =====================================================

-- 策略 1: 允许所有认证用户上传图片
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-images');

-- 策略 2: 允许所有人查看图片（公开访问）
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'note-images');

-- 策略 3: 允许用户删除自己上传的图片
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 策略 4: 允许用户更新自己上传的图片
CREATE POLICY "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 4. 验证配置
-- =====================================================
SELECT 
  '✅ 存储桶配置' as status,
  b.id as bucket_id,
  b.name as bucket_name,
  b.public as is_public,
  b.file_size_limit as max_file_size,
  b.allowed_mime_types as allowed_types
FROM storage.buckets b
WHERE b.id = 'note-images';

-- 查看 RLS 策略
SELECT 
  '✅ RLS 策略' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%images%'
ORDER BY policyname;

-- 5. 测试查询
-- =====================================================
-- 检查存储桶是否可访问
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'note-images') 
    THEN '✅ note-images 存储桶已创建'
    ELSE '❌ note-images 存储桶不存在'
  END as bucket_status;

-- 检查 RLS 策略数量
SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 
    THEN '✅ RLS 策略已配置'
    ELSE '⚠️ RLS 策略不完整'
  END as policy_status
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%images%';

-- 6. 清理测试数据（可选）
-- =====================================================
-- 如果需要清理所有测试图片，取消注释以下代码：
-- DELETE FROM storage.objects WHERE bucket_id = 'note-images';

-- 7. 使用说明
-- =====================================================
/*
执行此脚本后，你的应用应该能够：

1. ✅ 上传图片到 note-images 存储桶
2. ✅ 公开访问所有图片
3. ✅ 用户只能删除/更新自己的图片
4. ✅ 文件大小限制为 10MB
5. ✅ 只允许图片格式

测试步骤：
1. 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
2. 访问 http://localhost:3000/notes/new
3. 拖拽一张图片到编辑器
4. 确认图片成功上传并显示

如果仍然失败，请检查：
- Supabase 项目是否正常运行
- 环境变量 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 是否正确
- 浏览器控制台是否有 CORS 错误
- 用户是否已登录（认证状态）
*/
