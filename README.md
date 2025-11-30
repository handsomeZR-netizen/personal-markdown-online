# Note App

一个基于 Next.js 的现代化笔记应用，支持 Markdown 编辑、标签管理、离线同步等功能。

## 技术栈

- **框架**: Next.js 15 + React 19
- **数据库**: Supabase (PostgreSQL)
- **认证**: NextAuth.js
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI
- **动画**: Framer Motion

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local` 文件并填写必要的配置：

```bash
# 数据库
DATABASE_URL="your-supabase-database-url"

# 认证
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. 初始化数据库

```bash
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 主要功能

- ✅ 用户注册/登录
- ✅ Markdown 笔记编辑
- ✅ 标签管理和筛选
- ✅ 离线同步支持
- ✅ 深色模式
- ✅ 响应式设计
- ✅ AI 辅助功能（标签生成、内容格式化）

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行代码检查
- `npm run test` - 运行测试

## 文档

详细文档请查看 [doc](./doc) 目录：

- [快速开始](./doc/QUICK_START.md)
- [部署指南](./doc/DEPLOYMENT_GUIDE.md)
- [Supabase 配置](./doc/SUPABASE_SETUP.md)
- [AI 功能说明](./doc/AI_FEATURES_README.md)

## 部署

本项目已针对 Vercel 部署进行优化，详见 [部署指南](./doc/VERCEL_DEPLOYMENT_GUIDE.md)。

## License

MIT
