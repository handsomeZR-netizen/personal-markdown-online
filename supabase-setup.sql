-- ============================================
-- Supabase 数据库初始化脚本
-- ============================================
-- 在 Supabase SQL Editor 中运行此脚本
-- 路径: Supabase Dashboard → SQL Editor → New Query
-- ============================================

-- 1. 创建 User 表
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建 User 表索引
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);

COMMENT ON TABLE "User" IS '用户表';
COMMENT ON COLUMN "User".id IS '用户 ID (CUID)';
COMMENT ON COLUMN "User".email IS '用户邮箱（唯一）';
COMMENT ON COLUMN "User".password IS '加密后的密码';
COMMENT ON COLUMN "User".name IS '用户名称（可选）';

-- ============================================

-- 2. 创建 Category 表
CREATE TABLE IF NOT EXISTS "Category" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

COMMENT ON TABLE "Category" IS '笔记分类表';
COMMENT ON COLUMN "Category".id IS '分类 ID (CUID)';
COMMENT ON COLUMN "Category".name IS '分类名称（唯一）';

-- ============================================

-- 3. 创建 Tag 表
CREATE TABLE IF NOT EXISTS "Tag" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

COMMENT ON TABLE "Tag" IS '笔记标签表';
COMMENT ON COLUMN "Tag".id IS '标签 ID (CUID)';
COMMENT ON COLUMN "Tag".name IS '标签名称（唯一）';

-- ============================================

-- 4. 创建 Note 表
CREATE TABLE IF NOT EXISTS "Note" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    embedding TEXT,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Note_categoryId_fkey" FOREIGN KEY ("categoryId") 
        REFERENCES "Category"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 创建 Note 表索引
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");
CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt");
CREATE INDEX IF NOT EXISTS "Note_updatedAt_idx" ON "Note"("updatedAt");
CREATE INDEX IF NOT EXISTS "Note_userId_createdAt_idx" ON "Note"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Note_categoryId_idx" ON "Note"("categoryId");

COMMENT ON TABLE "Note" IS '笔记表';
COMMENT ON COLUMN "Note".id IS '笔记 ID (CUID)';
COMMENT ON COLUMN "Note".title IS '笔记标题';
COMMENT ON COLUMN "Note".content IS '笔记内容（Markdown）';
COMMENT ON COLUMN "Note".summary IS '笔记摘要（可选）';
COMMENT ON COLUMN "Note".embedding IS 'AI 向量嵌入（用于语义搜索）';
COMMENT ON COLUMN "Note"."userId" IS '所属用户 ID';
COMMENT ON COLUMN "Note"."categoryId" IS '所属分类 ID（可选）';

-- ============================================

-- 5. 创建 Note-Tag 关联表（多对多）
CREATE TABLE IF NOT EXISTS "_NoteToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_NoteToTag_A_fkey" FOREIGN KEY ("A") 
        REFERENCES "Note"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_NoteToTag_B_fkey" FOREIGN KEY ("B") 
        REFERENCES "Tag"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 创建关联表索引
CREATE UNIQUE INDEX IF NOT EXISTS "_NoteToTag_AB_unique" ON "_NoteToTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_NoteToTag_B_index" ON "_NoteToTag"("B");

COMMENT ON TABLE "_NoteToTag" IS '笔记-标签关联表（多对多）';
COMMENT ON COLUMN "_NoteToTag"."A" IS '笔记 ID';
COMMENT ON COLUMN "_NoteToTag"."B" IS '标签 ID';

-- ============================================

-- 6. 创建自动更新 updatedAt 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS '自动更新 updatedAt 字段的触发器函数';

-- ============================================

-- 7. 为 User 表添加更新触发器
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 8. 为 Note 表添加更新触发器
DROP TRIGGER IF EXISTS update_note_updated_at ON "Note";
CREATE TRIGGER update_note_updated_at
    BEFORE UPDATE ON "Note"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================

-- 9. 验证表创建
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('User', 'Note', 'Tag', 'Category', '_NoteToTag');
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ 所有表创建成功！共 % 个表', table_count;
    ELSE
        RAISE WARNING '⚠️ 只创建了 % 个表，预期 5 个表', table_count;
    END IF;
END $$;

-- ============================================

-- 10. 显示表结构信息
SELECT 
    table_name AS "表名",
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = t.table_name) AS "字段数",
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE schemaname = 'public' AND tablename = t.table_name) AS "索引数"
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('User', 'Note', 'Tag', 'Category', '_NoteToTag')
ORDER BY table_name;

-- ============================================
-- 完成！
-- ============================================
-- 
-- 下一步：
-- 1. 确认所有表都已创建（应该看到 5 个表）
-- 2. 在 Vercel 配置环境变量
-- 3. 重新部署应用
-- 4. 测试注册功能
--
-- ============================================
