# 图片上传问题修复总结

## 🔍 问题

```
上传失败: Failed to fetch
```

图片上传到 Supabase Storage 时失败。

## 🎯 根本原因

Supabase Storage 的 `note-images` 存储桶可能：
1. 不存在
2. RLS 策略未正确配置
3. 权限设置不正确

## ✅ 解决方案

### 方案 1: 使用 SQL 脚本（推荐）

1. 访问 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **SQL Editor**
4. 执行 `supabase-storage-complete-setup.sql` 脚本

### 方案 2: 手动配置

#### 步骤 1: 创建存储桶

在 Supabase Dashboard -> Storage:
- 点击 "New bucket"
- Name: `note-images`
- Public: ✅ 勾选
- File size limit: 10 MB
- Allowed MIME types: `image/*`

#### 步骤 2: 配置 RLS 策略

在 SQL Editor 中执行：

```sql
-- 允许认证用户上传
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'note-images');

-- 允许公开查看
CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'note-images');

-- 允许用户删除自己的图片
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'note-images' AND auth.uid()::text = owner);
```

## 🧪 测试

### 方法 1: 使用诊断页面

访问: http://localhost:3000/test-storage

这个页面会自动测试：
- ✅ 环境变量配置
- ✅ Supabase 连接
- ✅ 存储桶存在性
- ✅ 用户认证状态
- ✅ 文件上传功能

### 方法 2: 手动测试

1. 访问 http://localhost:3000/notes/new
2. 拖拽一张图片到编辑器
3. 查看上传进度
4. 确认图片成功插入

## 📝 已完成的改进

### 1. 改进错误提示

```typescript
// 之前
throw new Error(`上传失败: ${error.message}`);

// 现在
throw new Error(`上传失败: ${error.message || 'Failed to fetch'}. 
请检查: 
1) note-images 存储桶是否存在 
2) RLS 策略是否正确配置 
3) 网络连接是否正常`);
```

### 2. 创建完整的 SQL 设置脚本

文件: `supabase-storage-complete-setup.sql`
- 自动创建存储桶
- 配置所有必要的 RLS 策略
- 包含验证查询
- 提供详细注释

### 3. 创建诊断工具

文件: `src/app/test-storage/page.tsx`
- 自动化测试所有配置
- 可视化测试结果
- 提供修复建议

### 4. 创建修复文档

文件: `IMAGE_UPLOAD_FIX.md`
- 详细的问题诊断步骤
- 多种解决方案
- 常见错误码说明
- 临时降级方案

## 🚀 快速修复步骤

1. **执行 SQL 脚本**
   ```bash
   # 在 Supabase Dashboard 的 SQL Editor 中
   # 复制并执行 supabase-storage-complete-setup.sql
   ```

2. **测试配置**
   ```bash
   # 访问诊断页面
   http://localhost:3000/test-storage
   ```

3. **验证上传**
   ```bash
   # 访问笔记编辑器
   http://localhost:3000/notes/new
   # 拖拽图片测试
   ```

## 📊 配置检查清单

- [ ] Supabase 项目正常运行
- [ ] `note-images` 存储桶已创建
- [ ] 存储桶设置为公开访问
- [ ] RLS 策略已配置（至少 4 个）
- [ ] 环境变量正确配置
- [ ] 用户已登录
- [ ] 浏览器无 CORS 错误

## 🔗 相关文件

| 文件 | 用途 |
|------|------|
| `IMAGE_UPLOAD_FIX.md` | 详细修复指南 |
| `supabase-storage-complete-setup.sql` | 自动化设置脚本 |
| `src/app/test-storage/page.tsx` | 诊断工具页面 |
| `src/lib/storage/image-upload.ts` | 图片上传管理器 |

## 💡 提示

- 如果仍然失败，检查浏览器控制台的详细错误
- 确保 Supabase 项目没有暂停（免费版会自动暂停）
- 检查 Network 标签查看实际的请求和响应
- 尝试在 Supabase Dashboard 手动上传文件测试

## 📞 需要帮助？

如果问题仍然存在，请提供：
1. 诊断页面的测试结果截图
2. 浏览器控制台的错误信息
3. Network 标签中失败请求的详情
4. Supabase Dashboard 中存储桶的配置截图

---

**创建时间**: 2024-12-09
**状态**: ✅ 已提供完整解决方案
**下一步**: 执行 SQL 脚本并测试
