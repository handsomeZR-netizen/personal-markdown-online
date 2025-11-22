# 🚀 快速启动指南

## 1️⃣ 测试 Supabase 连接

```bash
npm run supabase:test
```

应该看到：
```
✅ 数据库连接成功
✅ 找到 X 个用户
✅ 找到 X 条笔记
🎉 所有测试通过！
```

## 2️⃣ 启动开发服务器

```bash
npm run dev
```

## 3️⃣ 访问应用

打开浏览器访问: http://localhost:3000

## 4️⃣ 测试功能

### 注册新用户
1. 访问 `/register`
2. 填写邮箱、密码、姓名
3. 点击注册

### 登录
1. 访问 `/login`
2. 输入邮箱和密码
3. 点击登录

### 创建笔记
1. 登录后访问 `/dashboard`
2. 点击"新建笔记"
3. 输入标题和内容
4. 保存

### 编辑笔记
1. 在笔记列表点击笔记
2. 修改内容
3. 自动保存

### 离线功能
1. 断开网络
2. 继续编辑笔记
3. 重新连接后自动同步

## ✅ 优势

- ✅ **无需本地数据库** - 不需要安装 PostgreSQL
- ✅ **绕过端口阻断** - 不依赖 5432 端口
- ✅ **即开即用** - 只需环境变量即可运行
- ✅ **完整功能** - 所有功能正常工作

## 🔧 故障排除

### 连接失败

检查 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=https://llroqdgpohslhfejwxrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 认证失败

确保 Supabase 数据库中有 User 表，并且表结构正确。

### 笔记无法保存

1. 检查网络连接
2. 查看浏览器控制台错误
3. 运行 `npm run supabase:test` 测试连接

## 📚 更多信息

- [Supabase 迁移指南](./SUPABASE_MIGRATION_GUIDE.md)
- [Supabase 文档](https://supabase.com/docs)
