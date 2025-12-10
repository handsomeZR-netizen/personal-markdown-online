# Note App

一个基于 Next.js 的现代化笔记应用，支持 Markdown 编辑、标签管理、离线同步等功能。

## 技术栈

- **框架**: Next.js 15 + React 19
- **数据库**: PostgreSQL (本地) / Supabase (生产)
- **ORM**: Prisma
- **认证**: NextAuth.js / Supabase Auth
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI
- **动画**: Framer Motion

## 快速开始

本应用支持两种数据库模式：**本地模式**（推荐用于开发）和 **Supabase 模式**（推荐用于生产）。

### 本地开发（推荐）

使用本地 PostgreSQL 数据库进行开发，享受更快的开发体验（页面加载 < 5 秒）。

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动本地数据库

使用 Docker（推荐）：

```bash
# 从项目根目录启动
docker-compose up -d

# 检查状态
docker-compose ps
```

或者安装原生 PostgreSQL（参见 [本地数据库设置指南](./docs/LOCAL_DATABASE_SETUP.md)）。

#### 3. 配置环境变量

```bash
# 复制本地开发配置
cp .env.local.example .env.local
```

默认配置已经适用于本地开发：

```env
DATABASE_MODE=local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/noteapp
```

生成认证密钥：

```bash
# 生成 AUTH_SECRET
openssl rand -base64 32
```

将生成的密钥添加到 `.env.local`：

```env
AUTH_SECRET=your-generated-secret
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=http://localhost:3000
```

#### 4. 初始化数据库

```bash
# 运行数据库迁移
npm run db:migrate

# (可选) 填充测试数据
npm run db:seed
```

测试账号：
- Email: `user1@example.com`, `user2@example.com`, `user3@example.com`
- Password: `password123`

#### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 使用 Supabase（生产环境）

如果您想使用 Supabase 进行开发或部署到生产环境：

#### 1. 创建 Supabase 项目

访问 [supabase.com](https://supabase.com) 创建新项目。

#### 2. 配置环境变量

```bash
# 复制生产配置模板
cp .env.production.example .env.local
```

填写 Supabase 凭证：

```env
DATABASE_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

#### 3. 运行迁移和设置存储

```bash
# 运行数据库迁移
npm run db:migrate

# 创建存储桶
npm run storage:create
```

详细的 Supabase 设置说明请参阅 [Supabase 配置指南](./doc/SUPABASE_SETUP.md)。

## 数据库模式对比

| 特性 | 本地模式 | Supabase 模式 |
|-----|---------|--------------|
| 开发速度 | ⚡ 非常快 (< 5s) | 🐢 较慢 (8-12s) |
| 成本 | 💰 免费 | 💰 免费层/付费 |
| 网络依赖 | ✅ 完全离线 | ❌ 需要网络 |
| 实时功能 | ⚠️ 轮询 | ✅ WebSocket |
| 文件存储 | 📁 本地文件系统 | ☁️ Supabase Storage |
| 适用场景 | 开发、测试 | 生产、协作 |

详细对比请参阅 [数据库模式文档](./docs/DATABASE_MODES.md)。

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 主要功能

### 核心功能
- ✅ 用户注册/登录
- ✅ Markdown 笔记编辑
- ✅ 标签管理和筛选
- ✅ 文件夹组织
- ✅ 图片上传
- ✅ 全文搜索
- ✅ 深色模式
- ✅ 响应式设计

### 高级功能
- ✅ AI 辅助功能（标签生成、内容格式化）
- ✅ 离线同步支持
- ✅ 实时协作（Supabase 模式）
- ✅ 版本历史
- ✅ 公开分享
- ✅ 导出功能（Markdown, PDF, HTML）

## 可用脚本

### 开发
- `npm run dev` - 启动开发服务器
- `npm run dev -- --turbo` - 使用 Turbopack 启动（更快）
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行代码检查
- `npm run test` - 运行测试

### 数据库
- `npm run db:migrate` - 运行数据库迁移
- `npm run db:push` - 推送架构更改
- `npm run db:seed` - 填充测试数据
- `npm run db:seed:reset` - 重置并填充数据
- `npm run db:studio` - 打开 Prisma Studio

### 工具
- `npm run diagnose` - 运行系统诊断
- `npm run health:check` - 检查数据库健康状态
- `npm run storage:create` - 创建 Supabase 存储桶

## 迁移完成 / Migration Complete

✅ **本地数据库迁移已完成!** 查看 [迁移完成总结](./MIGRATION_COMPLETE.md) 了解详情。

✅ **Local database migration is complete!** See [Migration Complete Summary](./MIGRATION_COMPLETE.md) for details.

## 文档

### 数据库和设置
- 📖 [本地数据库设置指南](./docs/LOCAL_DATABASE_SETUP.md) - 如何设置本地 PostgreSQL
- 📖 [数据库模式文档](./docs/DATABASE_MODES.md) - 本地 vs Supabase 模式对比
- 📖 [迁移指南](./docs/MIGRATION_GUIDE.md) - 从 Supabase 迁移到本地数据库
- 📖 [数据迁移工具](./docs/DATA_MIGRATION.md) - 导出和导入数据
- 📖 [Prisma 配置说明](./docs/PRISMA_CONFIGURATION.md) - Prisma ORM 配置详解
- 📖 [数据库验证](./docs/DATABASE_VALIDATION.md) - 数据库健康检查和验证
- 📖 [启动验证](./docs/STARTUP_VALIDATION.md) - 应用启动时的自动验证
- 📖 [故障排除指南](./docs/TROUBLESHOOTING.md) - 常见问题解决方案

### 功能文档
- 📖 [快速开始](./doc/QUICK_START.md) - 快速上手指南
- 📖 [用户指南](./USER_GUIDE.md) - 完整功能使用说明
- 📖 [AI 功能说明](./doc/AI_FEATURES_README.md) - AI 辅助功能详解
- 📖 [协作功能](./doc/USER_GUIDE_COLLABORATION.md) - 实时协作使用指南
- 📖 [离线同步](./doc/离线同步功能验证指南.md) - 离线功能说明

### 部署和配置
- 📖 [Supabase 配置](./doc/SUPABASE_SETUP.md) - Supabase 设置指南
- 📖 [Vercel 部署指南](./doc/VERCEL_DEPLOYMENT_GUIDE.md) - 部署到 Vercel
- 📖 [环境变量配置](./doc/DEPLOYMENT_GUIDE.md) - 环境变量说明

## 性能优化

本应用已进行多项性能优化：

- ✅ **Turbopack**: 使用 Next.js 15 的 Turbopack 实现快速编译
- ✅ **包导入优化**: 优化 lucide-react、@radix-ui 等大型库的导入
- ✅ **本地数据库**: 开发环境使用本地 PostgreSQL，消除网络延迟
- ✅ **连接池**: 优化数据库连接管理
- ✅ **代码分割**: 动态导入和懒加载组件

**性能指标**（本地模式）：
- 首次页面加载: < 5 秒
- 增量编译: < 3 秒
- API 响应: < 200ms

## 故障排除

遇到问题？查看我们的 [故障排除指南](./docs/TROUBLESHOOTING.md)，其中包含：

- 数据库连接问题
- 环境变量配置
- Docker 相关问题
- 迁移失败处理
- 性能优化建议
- 常见错误代码

或运行诊断脚本：

```bash
# 验证启动配置
npm run startup:validate

# 检查数据库健康
npm run db:health

# 验证数据库连接
npm run db:validate
```

## 部署

### Vercel（推荐）

本项目已针对 Vercel 部署进行优化。

**使用本地数据库部署**：
1. 准备一个可访问的 PostgreSQL 实例
2. 在 Vercel 配置环境变量
3. 部署项目

**使用 Supabase 部署**：
1. 创建 Supabase 项目
2. 在 Vercel 配置 Supabase 凭证
3. 部署项目

详见 [Vercel 部署指南](./doc/VERCEL_DEPLOYMENT_GUIDE.md)。

### 其他平台

应用可以部署到任何支持 Node.js 的平台：
- Railway
- Render
- DigitalOcean App Platform
- 自托管服务器

确保配置正确的环境变量和数据库连接。

## License

MIT
