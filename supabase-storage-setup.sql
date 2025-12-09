-- ============================================
-- Supabase Storage 配置脚本
-- ============================================
-- 在 Supabase Dashboard → SQL Editor 中运行此脚本
-- 用于创建 note-images 存储桶和配置 RLS 策略
-- ============================================

-- 1. 创建 note-images 存储桶
-- 注意：这需要在 Supabase Dashboard → Storage 中手动创建
-- 或者使用 Supabase CLI/API 创建

-- 检查存储桶是否存在
DO $$
BEGIN
    -- 插入存储桶配置（如果不存在）
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'note-images',
        'note-images',
        true,  -- 公开访问（读取）
        10485760,  -- 10MB 文件大小限制
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Storage bucket "note-images" 已创建或已存在';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ 无法创建存储桶，请在 Supabase Dashboard 手动创建';
END $$;

-- ============================================
-- 2. 配置 RLS 策略
-- ============================================

-- 2.1 允许所有人读取（公开访问）
CREATE POLICY "公开读取图片" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'note-images');

-- 2.2 允许认证用户上传图片
CREATE POLICY "认证用户可以上传图片" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'note-images' 
        AND auth.role() = 'authenticated'
    );

-- 2.3 允许用户更新自己上传的图片
CREATE POLICY "用户可以更新自己的图片" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'note-images' 
        AND auth.uid()::text = owner
    );

-- 2.4 允许用户删除自己上传的图片
CREATE POLICY "用户可以删除自己的图片" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'note-images' 
        AND auth.uid()::text = owner
    );

-- ============================================
-- 3. 验证配置
-- ============================================

-- 检查存储桶配置
SELECT 
    id AS "存储桶ID",
    name AS "名称",
    public AS "公开访问",
    file_size_limit AS "文件大小限制(字节)",
    allowed_mime_types AS "允许的文件类型"
FROM storage.buckets
WHERE id = 'note-images';

-- 检查 RLS 策略
SELECT 
    policyname AS "策略名称",
    cmd AS "操作类型",
    qual AS "条件"
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%图片%';

-- ============================================
-- 完成！
-- ============================================
-- 
-- 下一步：
-- 1. 确认存储桶已创建（在 Storage 页面查看）
-- 2. 测试上传功能
-- 3. 验证公开访问 URL 是否可用
--
-- 测试 URL 格式：
-- https://[PROJECT_REF].supabase.co/storage/v1/object/public/note-images/[FILE_PATH]
--
-- ============================================
