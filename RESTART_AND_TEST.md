# 🔄 重启并测试

## ✅ 问题已修复

注册 API 路由已从 Prisma 迁移到 Supabase SDK。

---

## 🚀 立即测试（3 步）

### 步骤 1: 重启服务器

在终端按 `Ctrl+C` 停止当前服务器，然后运行：

```bash
npm run dev
```

等待服务器启动（约 3-5 秒）。

### 步骤 2: 测试注册

1. 打开浏览器访问: http://localhost:3001/register
2. 填写信息:
   ```
   邮箱: test2@example.com
   密码: test123456
   姓名: Test User 2
   ```
3. 点击"注册"

### 步骤 3: 测试登录和创建笔记

1. 登录刚注册的账号
2. 创建一个测试笔记
3. 编辑笔记
4. 删除笔记

---

## 📊 预期结果

### ✅ 成功场景

```
1. 注册 → 成功，跳转到登录页
2. 登录 → 成功，进入 Dashboard
3. 创建笔记 → 成功，笔记出现在列表
4. 编辑笔记 → 成功，修改保存
5. 删除笔记 → 成功，笔记消失
```

### ⚠️ 如果遇到权限错误

**症状**:
```
permission denied for schema public
```

**解决方案**:

1. 访问 Supabase SQL Editor:
   https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn/sql/new

2. 运行以下 SQL（完整版在 `supabase-grant-permissions.sql`）:

```sql
-- 禁用 RLS（开发环境）
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;

-- 授予 anon 角色权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 授予 authenticated 角色权限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
```

3. 刷新应用页面重试

---

## 🎯 测试检查清单

完成以下测试：

### 基础功能
- [ ] 注册新用户
- [ ] 登录
- [ ] 查看 Dashboard
- [ ] 登出

### 笔记管理
- [ ] 创建笔记
- [ ] 查看笔记列表
- [ ] 编辑笔记
- [ ] 删除笔记

### 高级功能（可选）
- [ ] 离线创建笔记
- [ ] 离线编辑
- [ ] 重新连接后同步
- [ ] AI 自动摘要

---

## 💡 提示

### 1. 端口变化
服务器可能在 3001 端口（如果 3000 被占用）

### 2. 首次注册
如果是第一次注册，可能需要运行权限脚本

### 3. 数据持久化
所有数据保存在 Supabase 云数据库，刷新不会丢失

### 4. 浏览器控制台
如果遇到问题，按 F12 查看控制台错误信息

---

## 🆘 常见问题

### Q: 注册后无法登录？
A: 检查密码是否正确，或重新注册一个新账号

### Q: 创建笔记失败？
A: 运行权限脚本（见上方"权限错误解决方案"）

### Q: 服务器无法启动？
A: 运行 `npm install` 确保依赖已安装

### Q: 还是看到 Prisma 错误？
A: 确保已重启服务器（Ctrl+C 然后 npm run dev）

---

## 🎉 成功标准

如果以下功能都正常，说明迁移完全成功：

✅ 可以注册新用户  
✅ 可以登录  
✅ 可以创建笔记  
✅ 可以编辑笔记  
✅ 可以删除笔记  
✅ 数据持久化正常  

---

## 📚 相关文档

- [修复说明](./FIXED_REGISTER_ISSUE.md)
- [手动测试指南](./MANUAL_TEST_GUIDE.md)
- [权限配置](./supabase-grant-permissions.sql)
- [完整迁移指南](./SUPABASE_MIGRATION_GUIDE.md)

---

**准备好了吗？重启服务器开始测试！** 🚀

```bash
# 停止当前服务器
Ctrl+C

# 重新启动
npm run dev

# 访问应用
http://localhost:3001
```
