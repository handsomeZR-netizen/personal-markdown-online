-- ============================================
-- Supabase RLS (Row Level Security) 策略配置
-- ============================================
-- 在 Supabase Dashboard -> SQL Editor 中运行此脚本

-- 1. 启用 RLS（如果尚未启用）
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User 表策略
-- ============================================

-- 允许任何人注册（插入新用户）
CREATE POLICY "允许注册新用户" ON "User"
  FOR INSERT
  WITH CHECK (true);

-- 允许用户查看自己的信息
CREATE POLICY "用户可以查看自己" ON "User"
  FOR SELECT
  USING (auth.uid()::text = id);

-- 允许用户更新自己的信息
CREATE POLICY "用户可以更新自己" ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- ============================================
-- Note 表策略
-- ============================================

-- 用户可以查看自己的笔记
CREATE POLICY "用户可以查看自己的笔记" ON "Note"
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- 用户可以创建笔记
CREATE POLICY "用户可以创建笔记" ON "Note"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- 用户可以更新自己的笔记
CREATE POLICY "用户可以更新自己的笔记" ON "Note"
  FOR UPDATE
  USING (auth.uid()::text = "userId");

-- 用户可以删除自己的笔记
CREATE POLICY "用户可以删除自己的笔记" ON "Note"
  FOR DELETE
  USING (auth.uid()::text = "userId");

-- ============================================
-- Tag 表策略（所有用户共享标签）
-- ============================================

-- 所有人可以查看标签
CREATE POLICY "所有人可以查看标签" ON "Tag"
  FOR SELECT
  USING (true);

-- 认证用户可以创建标签
CREATE POLICY "认证用户可以创建标签" ON "Tag"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Category 表策略（所有用户共享分类）
-- ============================================

-- 所有人可以查看分类
CREATE POLICY "所有人可以查看分类" ON "Category"
  FOR SELECT
  USING (true);

-- 认证用户可以创建分类
CREATE POLICY "认证用户可以创建分类" ON "Category"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 注意事项
-- ============================================
-- 
-- 1. 这些策略使用 auth.uid() 来验证用户身份
-- 2. 由于我们使用自定义认证（不是 Supabase Auth），
--    需要在应用层面确保用户 ID 正确传递
-- 3. 如果使用 JWT，需要确保 JWT 包含正确的用户 ID
-- 
-- ============================================
-- 临时解决方案：禁用 RLS（仅用于开发）
-- ============================================
-- 
-- 如果你想快速测试，可以临时禁用 RLS：
-- 
-- ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Tag" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;
-- 
-- ⚠️ 警告：生产环境不要禁用 RLS！
-- ============================================
