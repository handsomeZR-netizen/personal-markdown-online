# Personal Markdown Online

<!-- PORTFOLIO-SNAPSHOT:START -->
<p align="left">
  <img src="https://img.shields.io/badge/category-Frontend%20or%20full--stack%20web%20project-blue" alt="Category" />
  <img src="https://img.shields.io/badge/status-Public%20portfolio%20artifact-2ea44f" alt="Status" />
</p>

> AI-assisted Markdown knowledge base with Next.js, authentication, database integrations, deployment scripts, and collaboration notes.

## Project Snapshot

- Category: Frontend or full-stack web project
- Stack: TypeScript, ai, fullstack, knowledge-base, markdown, nextjs
- Status: Public portfolio artifact

## What This Demonstrates

- Presents the project with a clear purpose, technology stack, and review path.
- Shows applied AI workflow design in a concrete product or learning scenario.
- Demonstrates frontend delivery, deployment awareness, and user-facing product structure.

## Quick Start

```bash
npm install && npm run build
```

<!-- PORTFOLIO-SNAPSHOT:END -->

## Original Documentation

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.19.0-2D3748?style=flat-square&logo=prisma)
![Neon](https://img.shields.io/badge/Neon-Serverless_Postgres-00E599?style=flat-square&logo=postgresql)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)

一个功能完整、体验优雅的现代化在线笔记管理平台

[🚀 在线演示](https://xzr5.top) · [功能特性](#-核心功能) · [快速开始](#-快速开始) · [技术架构](#-技术架构)

</div>

---

## 📖 项目简介

这是一个基于 **Next.js 15** 和 **React 19** 构建的全栈笔记管理应用，提供从内容创建、编辑到智能检索的完整解决方案。项目采用现代化的技术栈，注重用户体验和性能优化，支持 Markdown 编辑、AI 智能辅助、实时预览、离线编辑等丰富功能。

### ✨ 项目亮点

- 🎨 **现代化 UI 设计** - 基于 shadcn/ui 和 Tailwind CSS，支持深色/浅色主题切换
- 🤖 **AI 智能辅助** - 集成 DeepSeek API，提供智能标签建议、内容格式化、语义搜索
- 📱 **响应式设计** - 完美适配桌面端、平板和移动设备
- ⚡ **性能优化** - 懒加载、代码分割、图片优化、首屏加载优化
- 💾 **离线支持** - 本地缓存、自动保存、网络恢复后自动同步
- 🔐 **安全可靠** - NextAuth.js 认证、Prisma ORM、Supabase 数据库
- 🎯 **用户体验** - 快捷键支持、实时预览、拖拽排序、下拉刷新

---

## 🎯 核心功能

### 1️⃣ 用户认证系统

- ✅ 用户注册与登录
- ✅ 基于 NextAuth.js 的会话管理
- ✅ 密码加密存储（bcrypt）
- ✅ 自动登录状态保持
- ✅ 安全的路由保护

### 2️⃣ 笔记管理

#### 基础功能
- ✅ 创建、编辑、删除、查看笔记
- ✅ Markdown 编辑器与实时预览
- ✅ 自动保存草稿（防止数据丢失）
- ✅ 笔记摘要自动生成
- ✅ 笔记统计（字数、创建时间、更新时间）

#### 高级功能
- ✅ 分类管理（Category）
- ✅ 标签系统（Tag）- 支持多标签
- ✅ AI 智能标签建议
- ✅ AI 内容格式化
- ✅ 富文本编辑工具栏
- ✅ 代码高亮支持

### 3️⃣ 搜索与筛选

- ✅ 全文搜索（标题、内容）
- ✅ 标签筛选（多选）
- ✅ 分类筛选
- ✅ 排序功能（创建时间、更新时间）
- ✅ 实时搜索结果更新
- ✅ 搜索历史记录

### 4️⃣ AI 智能功能

- ✅ **AI 标签建议** - 根据笔记内容智能推荐标签
- ✅ **内容格式化** - 自动优化 Markdown 格式
- ✅ **智能摘要** - 自动生成笔记摘要
- ✅ **语义搜索** - 基于内容语义的智能检索（规划中）
- ✅ **AI 配置管理** - 支持自定义 API 密钥和端点

### 5️⃣ 用户体验优化

#### 交互优化
- ✅ 快捷键支持（Ctrl+S 保存、Ctrl+K 搜索等）
- ✅ 深色/浅色主题切换
- ✅ 响应式布局（移动端优化）
- ✅ 下拉刷新（移动端）
- ✅ 无限滚动加载
- ✅ 骨架屏加载状态
- ✅ Toast 消息提示

#### 性能优化
- ✅ 组件懒加载（React.lazy）
- ✅ 图片懒加载
- ✅ 代码分割
- ✅ 防抖搜索
- ✅ 缓存策略优化
- ✅ 首屏加载优化

### 6️⃣ 离线编辑支持

- ✅ 本地缓存笔记内容
- ✅ 离线状态下可创建和编辑
- ✅ 网络恢复后自动同步
- ✅ 冲突检测与处理
- ✅ 缓存清理机制

### 7️⃣ 数据可视化

- ✅ 仪表盘统计
  - 笔记总数
  - 标签数量
  - 分类数量
  - 最近活动
- ✅ 笔记卡片展示
- ✅ 时间线视图
- ✅ 标签云（规划中）

---


## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 15.1.6 | React 全栈框架，提供 SSR、SSG、API Routes |
| **React** | 19.2.0 | UI 组件库 |
| **TypeScript** | 5.0 | 类型安全的 JavaScript 超集 |
| **Tailwind CSS** | 4.0 | 原子化 CSS 框架 |
| **shadcn/ui** | Latest | 高质量 React 组件库 |
| **Radix UI** | Latest | 无障碍的 UI 原语组件 |
| **Framer Motion** | 12.23.24 | 动画库 |
| **React Hook Form** | 7.66.1 | 表单管理 |
| **Zod** | 4.1.12 | 数据验证 |
| **React Markdown** | 10.1.0 | Markdown 渲染 |
| **Lucide React** | 0.554.0 | 图标库 |
| **next-themes** | 0.4.6 | 主题管理 |
| **Sonner** | 2.0.7 | Toast 通知 |
| **date-fns** | 4.1.0 | 日期处理 |
| **use-debounce** | 10.0.6 | 防抖 Hook |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js API Routes** | 15.1.6 | RESTful API 接口 |
| **NextAuth.js** | 5.0.0-beta.30 | 身份认证 |
| **Prisma** | 6.19.0 | ORM 数据库工具 |
| **Supabase** | 2.83.0 | PostgreSQL 数据库服务 |
| **bcryptjs** | 3.0.3 | 密码加密 |

### 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **ESLint** | 9.0 | 代码检查 |
| **Vitest** | 4.0.10 | 单元测试 |
| **Testing Library** | 16.3.0 | React 组件测试 |
| **Prisma Studio** | - | 数据库可视化管理 |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 登录注册  │  │ 仪表盘   │  │ 笔记编辑  │  │ AI 搜索  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        组件层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ UI 组件  │  │ 业务组件  │  │ 布局组件  │  │ 工具组件  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        状态管理层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ React    │  │ 本地缓存  │  │ 会话状态  │  │ 主题状态  │   │
│  │ Context  │  │ Storage  │  │ NextAuth │  │ Theme    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        API 路由层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ /api/auth│  │ /api/notes│ │ /api/ai  │  │ /api/tags│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        数据访问层                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Prisma   │  │ Supabase │  │ DeepSeek │  │ 本地缓存  │   │
│  │ Client   │  │ Client   │  │ API      │  │ IndexedDB│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        数据存储层                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  PostgreSQL      │  │  AI API Service  │                │
│  │  (Supabase)      │  │  (DeepSeek)      │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 数据库设计

```prisma
// 用户表
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  notes     Note[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 笔记表
model Note {
  id         String    @id @default(cuid())
  title      String
  content    String
  summary    String?
  embedding  String?   // AI 向量嵌入（用于语义搜索）
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  tags       Tag[]
  category   Category?
  categoryId String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

// 标签表
model Tag {
  id    String @id @default(cuid())
  name  String @unique
  notes Note[]
}

// 分类表
model Category {
  id    String @id @default(cuid())
  name  String @unique
  notes Note[]
}
```

### 项目目录结构

```
note-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API 路由
│   │   │   ├── auth/            # 认证相关 API
│   │   │   ├── notes/           # 笔记 CRUD API
│   │   │   ├── ai/              # AI 功能 API
│   │   │   └── quote/           # 每日一言 API
│   │   ├── dashboard/           # 仪表盘页面
│   │   ├── notes/               # 笔记管理页面
│   │   ├── ai/                  # AI 搜索页面
│   │   ├── settings/            # 设置页面
│   │   ├── login/               # 登录页面
│   │   ├── register/            # 注册页面
│   │   ├── layout.tsx           # 根布局
│   │   └── page.tsx             # 首页
│   ├── components/              # React 组件
│   │   ├── auth/                # 认证组件
│   │   ├── notes/               # 笔记相关组件
│   │   ├── dashboard/           # 仪表盘组件
│   │   ├── filters/             # 筛选组件
│   │   ├── settings/            # 设置组件
│   │   └── ui/                  # UI 基础组件
│   ├── lib/                     # 工具库
│   │   ├── ai/                  # AI 相关工具
│   │   ├── prisma.ts            # Prisma 客户端
│   │   ├── supabase.ts          # Supabase 客户端
│   │   ├── auth.ts              # NextAuth 配置
│   │   └── cache-utils.ts       # 缓存工具
│   └── types/                   # TypeScript 类型定义
├── prisma/
│   ├── schema.prisma            # Prisma 数据模型
│   └── schema.supabase.prisma   # Supabase 数据模型
├── scripts/
│   └── migrate-to-supabase.ts   # 数据迁移脚本
├── public/                      # 静态资源
├── docs/                        # 项目文档
│   ├── VERCEL_DEPLOYMENT_GUIDE.md
│   ├── SUPABASE_SETUP.md
│   └── AI_CONFIG_GUIDE.md
├── .env.local                   # 环境变量（本地）
├── .env.supabase.example        # 环境变量示例
├── next.config.ts               # Next.js 配置
├── tailwind.config.ts           # Tailwind CSS 配置
├── tsconfig.json                # TypeScript 配置
├── vercel.json                  # Vercel 部署配置
└── package.json                 # 项目依赖
```

---


## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn 或 pnpm
- PostgreSQL 数据库（推荐使用 Supabase）

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/handsomeZR-netizen/personal-markdown-online.git
cd personal-markdown-online/note-app
```

#### 2. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

#### 3. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.supabase.example .env.local
```

编辑 `.env.local` 文件，填入你的配置：

```env
# 数据库配置（Supabase）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# 认证密钥（生成方法：openssl rand -base64 32）
AUTH_SECRET="your-auth-secret-here"

# AI API 配置（可选）
DEEPSEEK_API_KEY="sk-your-deepseek-api-key"
DEEPSEEK_API_URL="https://api.deepseek.com/v1"

# Supabase 公开配置（可选）
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

#### 4. 设置数据库

##### 使用 Supabase（推荐）

1. 访问 [Supabase](https://supabase.com) 创建项目
2. 获取数据库连接字符串
3. 运行数据库迁移：

```bash
# 使用 Supabase schema
npm run supabase:setup

# 或手动迁移
npx prisma migrate dev --name init
npx prisma generate
```

##### 使用本地 SQLite（开发测试）

```bash
# 修改 .env.local
DATABASE_URL="file:./dev.db"

# 运行迁移
npm run db:migrate
npm run db:generate
```

#### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

#### 6. 构建生产版本

```bash
npm run build
npm run start
```

### 数据库管理

```bash
# 打开 Prisma Studio（可视化数据库管理）
npm run db:studio

# 创建新的数据库迁移
npm run db:migrate

# 生成 Prisma Client
npm run db:generate

# 推送 schema 到数据库（不创建迁移）
npm run db:push
```

### 测试

```bash
# 运行测试
npm run test

# 监听模式运行测试
npm run test:watch

# 打开测试 UI
npm run test:ui
```

---

## 📦 部署指南

### 🚨 重要：部署前必读

**常见部署问题快速修复**：

| 问题 | 文档 | 解决时间 |
|------|------|---------|
| 🔥 Vercel 环境变量未配置 | [紧急修复-Vercel环境变量.md](./紧急修复-Vercel环境变量.md) | 5 分钟 |
| 🚨 MissingSecret 错误 | [紧急修复-AUTH_SECRET.md](./紧急修复-AUTH_SECRET.md) | 5 分钟 |
| 🚨 注册/登录 500 错误 | [修复-注册500错误.md](./修复-注册500错误.md) | 10 分钟 |
| 📦 组件空白 | [QUICK_FIX.md](./QUICK_FIX.md) | 10 分钟 |
| 📘 完整部署教程 | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | 30 分钟 |
| 🔧 问题诊断 | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 按需 |
| 📚 所有文档 | [文档导航.md](./文档导航.md) | - |

### 部署前检查

```bash
# 1. 检查环境变量配置
npm run check:env

# 2. 测试生产构建
npm run build
npm start
```

### 部署到 Vercel（推荐）

#### 方法一：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/new)
2. 导入 GitHub 仓库
3. 设置根目录为 `note-app`
4. **重要**：配置环境变量（参考 [QUICK_FIX.md](./QUICK_FIX.md)）
5. 点击 Deploy

#### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd note-app
vercel

# 部署到生产环境
vercel --prod
```

### 📚 部署相关文档

- **[QUICK_FIX.md](./QUICK_FIX.md)** - 快速修复组件空白问题
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - 完整部署指南
- **[check-deployment.md](./check-deployment.md)** - 部署后检查清单
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Vercel 技术细节
- **[修复总结.md](./修复总结.md)** - 水合不匹配问题详解

### 🐳 Docker 部署

> 📖 **完整文档**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

#### 快速开始（5 分钟部署）

```bash
# 1. 复制环境变量配置文件
cp .env.docker.example .env.docker

# 2. 编辑 .env.docker，修改以下必填项：
#    - POSTGRES_PASSWORD (数据库密码)
#    - NEXTAUTH_SECRET (认证密钥，使用 openssl rand -base64 32 生成)
#    - AUTH_SECRET (与 NEXTAUTH_SECRET 相同)

# 3. 启动服务
docker-compose --env-file .env.docker up -d

# 4. 等待服务启动（约 30 秒），然后运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 5. 访问应用
# 打开浏览器访问 http://localhost:3000
```

#### ⚠️ 重要提示

1. **首次部署必须运行数据库迁移**，否则应用无法正常工作
2. **生产环境请使用强密码**，至少 32 位随机字符串
3. **健康检查端点**: `http://localhost:3000/api/health`

#### 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `POSTGRES_PASSWORD` | ✅ | 数据库密码，请使用强密码 |
| `NEXTAUTH_SECRET` | ✅ | 认证密钥，使用 `openssl rand -base64 32` 生成 |
| `AUTH_SECRET` | ✅ | Auth 密钥，与 NEXTAUTH_SECRET 相同 |
| `NEXTAUTH_URL` | ✅ | 应用访问地址，如 `http://localhost:3000` |
| `APP_PORT` | ❌ | 应用端口，默认 3000 |
| `POSTGRES_PORT` | ❌ | 数据库端口，默认 5432 |
| `DATABASE_MODE` | ❌ | 数据库模式，默认 `local` |
| `DEEPSEEK_API_KEY` | ❌ | AI 功能 API 密钥（可选） |

#### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务（保留数据）
docker-compose down

# 停止服务并删除数据（危险！）
docker-compose down -v

# 重新构建并启动
docker-compose --env-file .env.docker up -d --build
```

#### 数据备份与恢复

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres noteapp > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres noteapp < backup.sql
```

#### 单独构建镜像

```bash
# 构建镜像
docker build -t note-app .

# 运行容器
docker run -p 3000:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  -e AUTH_SECRET="your-secret" \
  note-app
```

### 部署到其他平台

项目支持部署到任何支持 Node.js 的平台：

- **Netlify**: 支持 Next.js
- **Railway**: 支持 Docker 部署
- **自托管**: 使用 Docker 或 PM2

---

## 🎨 功能演示

### 1. 用户认证

<details>
<summary>点击展开</summary>

- 注册新用户
- 登录验证
- 会话管理
- 自动跳转

</details>

### 2. 笔记编辑

<details>
<summary>点击展开</summary>

- Markdown 实时预览
- 自动保存草稿
- 富文本工具栏
- 代码高亮
- 标签和分类管理

</details>

### 3. AI 智能功能

<details>
<summary>点击展开</summary>

- **智能标签建议**: 根据笔记内容自动推荐相关标签
- **内容格式化**: 优化 Markdown 格式，提升可读性
- **智能摘要**: 自动生成笔记摘要
- **语义搜索**: 基于内容理解的智能检索（开发中）

</details>

### 4. 搜索与筛选

<details>
<summary>点击展开</summary>

- 全文搜索
- 标签筛选（多选）
- 分类筛选
- 排序功能
- 实时结果更新

</details>

### 5. 响应式设计

<details>
<summary>点击展开</summary>

- 桌面端优化布局
- 平板适配
- 移动端优化
- 触摸手势支持
- 下拉刷新

</details>

---

## ⚙️ 配置说明

### AI 功能配置

项目支持自定义 AI API 配置：

1. 访问设置页面 `/settings`
2. 配置 API 密钥和端点
3. 测试连接状态
4. 保存配置

支持的 AI 服务：
- DeepSeek API
- OpenAI API（兼容）
- 其他兼容 OpenAI 格式的 API

### 主题配置

支持深色/浅色主题切换：

```typescript
// 在任何组件中使用
import { useTheme } from 'next-themes'

const { theme, setTheme } = useTheme()
setTheme('dark') // 或 'light'
```

### 快捷键配置

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + S` | 保存笔记 |
| `Ctrl/Cmd + K` | 打开搜索 |
| `Ctrl/Cmd + N` | 新建笔记 |
| `Ctrl/Cmd + /` | 显示快捷键帮助 |
| `Esc` | 关闭对话框 |

---
