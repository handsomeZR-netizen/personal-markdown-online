# Vercel + Supabase 部署检查清单

## ✅ 已完成的配置

### 1. 数据库配置
- [x] Supabase PostgreSQL 配置正确
- [x] `DATABASE_URL` 使用连接池 (端口 6543)
- [x] `DIRECT_URL` 用于迁移 (端口 5432)
- [x] Prisma schema 配置正确

### 2. 离线功能兼容性
- [x] **IndexedDB** - 浏览器端存储，与 Vercel 无关 ✅
- [x] **LocalStorage** - 浏览器端存储，与 Vercel 无关 ✅
- [x] **Service Worker** - 可选，未使用 ✅
- [x] 所有离线功能都在客户端运行

### 3. API 路由
- [x] Next.js API Routes 在 Vercel 上作为 Serverless Functions 运行
- [x] 批量同步 API (`/api/notes/batch-sync`)
- [x] 笔记 CRUD API (`/api/notes`, `/api/notes/[id]`)
- [x] AI API (`/api/ai/chat`, `/api/ai/stream`)

### 4. 环境变量配置
需要在 Vercel 项目设置中配置以下环境变量：

```bash
# 认证
AUTH_SECRET=your-secret-here

# Supabase 公共配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase 私密配置
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 数据库连接
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# 数据库凭据
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-db-password

# AI API (可选)
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

## 🚀 部署步骤

### 1. 准备 Supabase 数据库

```bash
# 在本地运行数据库迁移
npm run db:push

# 或者使用迁移文件
npm run db:migrate
```

### 2. 配置 Vercel 环境变量

1. 登录 Vercel Dashboard
2. 选择你的项目
3. 进入 Settings > Environment Variables
4. 添加上述所有环境变量
5. 确保选择正确的环境 (Production, Preview, Development)

### 3. 部署到 Vercel

```bash
# 方式 1: 通过 Git 自动部署
git push origin main

# 方式 2: 使用 Vercel CLI
npm install -g vercel
vercel --prod
```

### 4. 验证部署

部署完成后，检查以下功能：

- [ ] 用户注册/登录
- [ ] 创建/编辑/删除笔记
- [ ] 离线模式（断网后仍可操作）
- [ ] 网络恢复后自动同步
- [ ] AI 摘要生成（如果配置了 API）

## ⚠️ 常见问题

### 1. 数据库连接失败

**问题**: `Error: Can't reach database server`

**解决方案**:
- 检查 Supabase 项目是否处于活动状态
- 验证 `DATABASE_URL` 和 `DIRECT_URL` 是否正确
- 确保使用了正确的端口 (6543 for pooling, 5432 for direct)

### 2. 离线功能不工作

**问题**: 离线时无法创建笔记

**解决方案**:
- 检查浏览器是否支持 IndexedDB
- 打开浏览器开发者工具 > Application > IndexedDB
- 确认 `NoteAppDB` 数据库已创建
- 检查浏览器存储配额

### 3. 同步失败

**问题**: 网络恢复后同步失败

**解决方案**:
- 检查 API 路由是否正常工作
- 查看 Vercel 函数日志
- 验证认证 token 是否有效
- 检查同步队列中的操作

### 4. Vercel 构建失败

**问题**: `Error: Prisma Client could not be generated`

**解决方案**:
```bash
# 确保 postinstall 脚本正确
"postinstall": "prisma generate"

# 或在 build 脚本中添加
"build": "prisma generate && next build"
```

## 📊 性能优化建议

### 1. 数据库查询优化
- ✅ 已添加必要的索引
- ✅ 使用连接池 (pgBouncer)
- ✅ 实现了分页查询

### 2. 离线数据管理
- ✅ 实现了查询缓存 (5分钟 TTL)
- ✅ 自动清理过期数据
- ✅ 批量操作优化

### 3. API 路由优化
- ✅ 批量同步 API
- ✅ 超时处理 (30秒)
- ✅ 错误重试机制

## 🔒 安全检查

- [x] 环境变量不包含在代码中
- [x] 使用 `.env.example` 作为模板
- [x] `AUTH_SECRET` 使用强随机值
- [x] Supabase Service Role Key 仅在服务端使用
- [x] API 路由有适当的认证检查

## 📱 客户端功能

### 离线功能特性
- ✅ 离线创建/编辑笔记
- ✅ 自动保存草稿
- ✅ 网络状态检测
- ✅ 自动同步队列
- ✅ 冲突解决
- ✅ 存储空间管理

### 浏览器兼容性
- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- Mobile browsers: ✅ 完全支持

## 🎯 部署后测试

### 基础功能测试
```bash
# 1. 测试 API 健康检查
curl https://your-app.vercel.app/api/test-db

# 2. 测试笔记创建
curl -X POST https://your-app.vercel.app/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content"}'
```

### 离线功能测试
1. 打开应用
2. 打开浏览器开发者工具 > Network
3. 选择 "Offline" 模式
4. 尝试创建/编辑笔记
5. 恢复网络连接
6. 验证自动同步

## 📚 相关文档

- [Vercel 部署文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)

## ✅ 结论

你的项目配置是**完全兼容** Vercel + Supabase 部署的！

**关键点**:
1. ✅ 离线功能使用浏览器 API (IndexedDB, LocalStorage)
2. ✅ 服务端使用 Supabase PostgreSQL
3. ✅ API 路由作为 Serverless Functions 运行
4. ✅ 没有使用任何与 Vercel 不兼容的技术

**下一步**: 配置环境变量并部署到 Vercel！
