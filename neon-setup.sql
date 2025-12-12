-- ============================================
-- Neon PostgreSQL 完整数据库初始化脚本
-- 在 Neon SQL Editor 中运行此脚本
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,
    "color" TEXT,
    "webhookUrl" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- 2. 分类表
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");

-- 3. 标签表
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");

-- 4. 文件夹表
CREATE TABLE IF NOT EXISTS "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Folder_parentId_idx" ON "Folder"("parentId");
CREATE INDEX IF NOT EXISTS "Folder_parentId_sortOrder_idx" ON "Folder"("parentId", "sortOrder");
CREATE INDEX IF NOT EXISTS "Folder_userId_idx" ON "Folder"("userId");


-- 5. 笔记表
CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "embedding" TEXT,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'tiptap-json',
    "folderId" TEXT,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "publicSlug" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Note_publicSlug_key" ON "Note"("publicSlug");
CREATE INDEX IF NOT EXISTS "Note_categoryId_idx" ON "Note"("categoryId");
CREATE INDEX IF NOT EXISTS "Note_createdAt_idx" ON "Note"("createdAt");
CREATE INDEX IF NOT EXISTS "Note_folderId_idx" ON "Note"("folderId");
CREATE INDEX IF NOT EXISTS "Note_folderId_sortOrder_idx" ON "Note"("folderId", "sortOrder");
CREATE INDEX IF NOT EXISTS "Note_ownerId_idx" ON "Note"("ownerId");
CREATE INDEX IF NOT EXISTS "Note_publicSlug_idx" ON "Note"("publicSlug");
CREATE INDEX IF NOT EXISTS "Note_updatedAt_idx" ON "Note"("updatedAt");
CREATE INDEX IF NOT EXISTS "Note_userId_createdAt_idx" ON "Note"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Note_userId_idx" ON "Note"("userId");

-- 6. 协作者表
CREATE TABLE IF NOT EXISTS "Collaborator" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Collaborator_noteId_userId_key" ON "Collaborator"("noteId", "userId");
CREATE INDEX IF NOT EXISTS "Collaborator_noteId_idx" ON "Collaborator"("noteId");
CREATE INDEX IF NOT EXISTS "Collaborator_userId_idx" ON "Collaborator"("userId");

-- 7. 笔记版本表
CREATE TABLE IF NOT EXISTS "NoteVersion" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NoteVersion_createdAt_idx" ON "NoteVersion"("createdAt");
CREATE INDEX IF NOT EXISTS "NoteVersion_noteId_idx" ON "NoteVersion"("noteId");

-- 8. 笔记模板表
CREATE TABLE IF NOT EXISTS "NoteTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NoteTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NoteTemplate_userId_idx" ON "NoteTemplate"("userId");

-- 9. 用户偏好表
CREATE TABLE IF NOT EXISTS "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sortBy" TEXT NOT NULL DEFAULT 'updatedAt',
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE INDEX IF NOT EXISTS "UserPreference_userId_idx" ON "UserPreference"("userId");

-- 10. 笔记-标签关联表
CREATE TABLE IF NOT EXISTS "_NoteToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_NoteToTag_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX IF NOT EXISTS "_NoteToTag_B_index" ON "_NoteToTag"("B");


-- 11. AI 对话表
CREATE TABLE IF NOT EXISTS "AIConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIConversation_userId_idx" ON "AIConversation"("userId");
CREATE INDEX IF NOT EXISTS "AIConversation_userId_updatedAt_idx" ON "AIConversation"("userId", "updatedAt");

-- 12. AI 消息表
CREATE TABLE IF NOT EXISTS "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relatedNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

-- 13. AI 搜索历史表
CREATE TABLE IF NOT EXISTS "AISearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "searchType" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AISearchHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AISearchHistory_userId_idx" ON "AISearchHistory"("userId");
CREATE INDEX IF NOT EXISTS "AISearchHistory_userId_searchType_idx" ON "AISearchHistory"("userId", "searchType");
CREATE INDEX IF NOT EXISTS "AISearchHistory_userId_createdAt_idx" ON "AISearchHistory"("userId", "createdAt");

-- ============================================
-- 外键约束
-- ============================================

-- Folder 自引用
ALTER TABLE "Folder" DROP CONSTRAINT IF EXISTS "Folder_parentId_fkey";
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Folder -> User
ALTER TABLE "Folder" DROP CONSTRAINT IF EXISTS "Folder_userId_fkey";
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note -> Category
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_categoryId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Note -> Folder
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_folderId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" 
    FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Note -> User (owner)
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_ownerId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_ownerId_fkey" 
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note -> User (user)
ALTER TABLE "Note" DROP CONSTRAINT IF EXISTS "Note_userId_fkey";
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Collaborator -> Note
ALTER TABLE "Collaborator" DROP CONSTRAINT IF EXISTS "Collaborator_noteId_fkey";
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_noteId_fkey" 
    FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Collaborator -> User
ALTER TABLE "Collaborator" DROP CONSTRAINT IF EXISTS "Collaborator_userId_fkey";
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NoteVersion -> Note
ALTER TABLE "NoteVersion" DROP CONSTRAINT IF EXISTS "NoteVersion_noteId_fkey";
ALTER TABLE "NoteVersion" ADD CONSTRAINT "NoteVersion_noteId_fkey" 
    FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserPreference -> User
ALTER TABLE "UserPreference" DROP CONSTRAINT IF EXISTS "UserPreference_userId_fkey";
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- _NoteToTag -> Note
ALTER TABLE "_NoteToTag" DROP CONSTRAINT IF EXISTS "_NoteToTag_A_fkey";
ALTER TABLE "_NoteToTag" ADD CONSTRAINT "_NoteToTag_A_fkey" 
    FOREIGN KEY ("A") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- _NoteToTag -> Tag
ALTER TABLE "_NoteToTag" DROP CONSTRAINT IF EXISTS "_NoteToTag_B_fkey";
ALTER TABLE "_NoteToTag" ADD CONSTRAINT "_NoteToTag_B_fkey" 
    FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AIMessage -> AIConversation
ALTER TABLE "AIMessage" DROP CONSTRAINT IF EXISTS "AIMessage_conversationId_fkey";
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- 完成！数据库已准备就绪
-- ============================================
