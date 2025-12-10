# 图片上传最终修复指南

## 🎯 问题

图片上传失败，错误信息：
```
上传失败: Failed to fetch
```

## ✅ 解决方案（3 步完成）

### 步骤 1: 打开 Supabase Dashboard

1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**

### 步骤 2: 执行 SQL 脚本

复制 `QUICK_FIX.sql` 的全部内容，粘贴到 SQL Editor，点击 **Run**。

或者直接复制以下代码：

```sql
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
```

### 步骤 3: 测试上传

1. 访问 http://localhost:3000/test-storage
2. 点击"开始测试"按钮
3. 确认所有测试通过 ✅

或者直接测试上传：
1. 访问 http://localhost:3000/notes/new
2. 拖拽一张图片到编辑器
3. 确认图片成功上传并显示

## 🔍 常见问题

### Q1: 执行 SQL 时出现 "syntax error"

**A**: 确保每个 SQL 语句都以分号（`;`）结尾。直接复制上面的完整脚本。

### Q2: 执行 SQL 时出现 "operator does not exist: text = uuid"

**A**: 不要使用 `::text` 转换。正确写法：
```sql
USING (bucket_id = 'note-images' AND owner = auth.uid())
```

### Q3: 上传时提示 "未认证"

**A**: 确保用户已登录。访问 http://localhost:3000/login 登录。

### Q4: 上传时提示 "存储桶不存在"

**A**: 重新执行步骤 2 的 SQL 脚本。

### Q5: 如何查看是否配置成功？

**A**: 在 Supabase Dashboard:
1. 进入 **Storage** 页面
2. 应该看到 `note-images` 存储桶
3. 点击存储桶，查看 **Policies** 标签
4. 应该有 4 个策略

## 📊 验证清单

执行完成后，检查以下项目：

- [ ] Supabase Dashboard -> Storage 中存在 `note-images` 存储桶
- [ ] 存储桶设置为 Public（公开）
- [ ] 存储桶有 4 个 RLS 策略
- [ ] http://localhost:3000/test-storage 所有测试通过
- [ ] 可以成功上传图片

## 🎉 完成

如果所有步骤都完成，图片上传功能应该正常工作了！

## 📞 仍然有问题？

如果问题仍然存在，请提供：
1. Supabase SQL Editor 的执行结果截图
2. http://localhost:3000/test-storage 的测试结果
3. 浏览器控制台的错误信息
4. Network 标签中失败请求的详情

---

**创建时间**: 2024-12-09
**预计完成时间**: 5 分钟
**难度**: ⭐ 简单
