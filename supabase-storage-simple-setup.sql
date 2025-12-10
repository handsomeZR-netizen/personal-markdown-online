-- =====================================================
-- Supabase Storage 简化设置脚本
-- 修复类型匹配问题
-- =====================================================

-- 1. 创建 note-images 存储桶
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  true, -- 公开访问
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 删除所有旧策略
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- 3. 创建新策略（修复类型匹配）
-- =====================================================

-- 策略 1: 允许认证用户上传图片
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

-- 策略 3: 允许用户删除自己的图片（修复：直接比较 UUID）
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 策略 4: 允许用户更新自己的图片（修复：直接比较 UUID）
CREATE POLICY "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 4. 验证配置
-- =====================================================
SELECT 
  '✅ 存储桶配置' as status,
  b.id,
  b.name,
  b.public,
  b.file_size_limit,
  array_length(b.allowed_mime_types, 1) as mime_types_count
FROM storage.buckets b
WHERE b.id = 'note-images';

-- 5. 查看策略
-- =====================================================
SELECT 
  '✅ RLS 策略' as status,
  policyname,
  cmd as operation,
  CASE 
    WHEN roles = '{authenticated}' THEN '认证用户'
    WHEN roles = '{public}' THEN '公开'
    ELSE roles::text
  END as who_can_access
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%images%'
ORDER BY policyname;

-- 6. 测试查询
-- =====================================================
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'note-images') 
    THEN '✅ note-images 存储桶已创建'
    ELSE '❌ note-images 存储桶不存在'
  END as result;

SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 
    THEN '✅ RLS 策略已配置完成'
    ELSE '⚠️ RLS 策略不完整，应该有 4 个策略'
  END as result
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%images%';

-- 7. 使用说明
-- =====================================================
/*
✅ 修复说明：
- 移除了 ::text 类型转换
- 直接比较 UUID 类型：owner = auth.uid()
- 简化了策略，移除了文件夹路径检查

执行此脚本后：
1. note-images 存储桶已创建
2. 4 个 RLS 策略已配置
3. 认证用户可以上传图片
4. 所有人可以查看图片
5. 用户可以删除/更新自己的图片

测试步骤：
1. 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
2. 访问 http://localhost:3000/test-storage 测试配置
3. 访问 http://localhost:3000/notes/new 测试上传

如果仍然失败：
- 检查用户是否已登录
- 查看浏览器控制台的详细错误
- 确认 Supabase 项目没有暂停
*/
