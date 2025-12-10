-- =====================================================
-- 快速修复脚本 - 直接复制粘贴到 Supabase SQL Editor
-- =====================================================

-- 1. 创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 删除旧策略
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;

-- 3. 创建策略 1: 上传
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'note-images');

-- 4. 创建策略 2: 查看
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'note-images');

-- 5. 创建策略 3: 删除
CREATE POLICY "Allow users to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 6. 创建策略 4: 更新
CREATE POLICY "Allow users to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'note-images' AND owner = auth.uid());

-- 7. 验证
SELECT 
  '✅ 配置完成' as status,
  b.id,
  b.name,
  b.public,
  COUNT(p.policyname) as policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'objects' AND p.policyname LIKE '%images%'
WHERE b.id = 'note-images'
GROUP BY b.id, b.name, b.public;
