# 数据库模式文档
# Database Modes Documentation

本文档解释了笔记应用支持的两种数据库模式:本地模式和 Supabase 模式。

This document explains the two database modes supported by the note application: Local mode and Supabase mode.

## 目录 / Table of Contents

1. [概述](#概述--overview)
2. [本地模式](#本地模式--local-mode)
3. [Supabase 模式](#supabase-模式--supabase-mode)
4. [模式对比](#模式对比--mode-comparison)
5. [切换模式](#切换模式--switching-modes)
6. [功能可用性](#功能可用性--feature-availability)

## 概述 / Overview

笔记应用支持两种数据库模式,通过环境变量 `DATABASE_MODE` 控制:

- **local**: 本地 PostgreSQL 数据库(推荐用于开发)
- **supabase**: Supabase 托管数据库(推荐用于生产)

The note application supports two database modes, controlled by the `DATABASE_MODE` environment variable:

- **local**: Local PostgreSQL database (recommended for development)
- **supabase**: Supabase hosted database (recommended for production)

## 本地模式 / Local Mode

### 特点 / Features

- ✅ 快速开发迭代(无网络延迟)
- ✅ 完全离线工作
- ✅ 免费使用
- ✅ 完全控制数据
- ✅ 简单的备份和恢复
- ⚠️ 需要本地 PostgreSQL 安装
- ⚠️ 文件存储使用本地文件系统
- ⚠️ 认证使用 NextAuth

### 适用场景 / Use Cases

- 本地开发和测试
- 离线工作环境
- 学习和实验
- 不需要云服务的小型部署

### 配置 / Configuration

```env
DATABASE_MODE=local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/noteapp
NEXTAUTH_SECRET=your-secret-key
AUTH_SECRET=your-secret-key
LOCAL_STORAGE_PATH=./uploads
```

### 启动步骤 / Setup Steps

1. 启动 Docker 数据库:
   ```bash
   docker-compose up -d
   ```

2. 配置环境变量:
   ```bash
   cp .env.local.example .env.local
   # 编辑 .env.local
   ```

3. 运行迁移:
   ```bash
   npm run db:migrate
   ```

4. 启动应用:
   ```bash
   npm run dev
   ```

## Supabase 模式 / Supabase Mode

### 特点 / Features

- ✅ 托管数据库(无需维护)
- ✅ 内置认证系统
- ✅ 文件存储服务
- ✅ 实时功能
- ✅ 自动备份
- ✅ 全球 CDN
- ⚠️ 需要网络连接
- ⚠️ 免费层有限制
- ⚠️ 依赖第三方服务

### 适用场景 / Use Cases

- 生产环境部署
- 需要实时协作功能
- 多用户应用
- 需要全球访问
- 需要托管服务

### 配置 / Configuration

```env
DATABASE_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 启动步骤 / Setup Steps

1. 创建 Supabase 项目:
   - 访问 [supabase.com](https://supabase.com)
   - 创建新项目
   - 获取 API 密钥和数据库连接字符串

2. 配置环境变量:
   ```bash
   cp .env.production.example .env.local
   # 编辑 .env.local 填入 Supabase 凭证
   ```

3. 运行迁移:
   ```bash
   npm run db:migrate
   ```

4. 设置存储桶:
   ```bash
   npm run storage:create
   ```

5. 启动应用:
   ```bash
   npm run dev
   ```

## 模式对比 / Mode Comparison

| 特性 / Feature | 本地模式 / Local | Supabase 模式 / Supabase |
|---------------|-----------------|-------------------------|
| 开发速度 / Dev Speed | ⚡ 非常快 | 🐢 较慢(网络延迟) |
| 成本 / Cost | 💰 免费 | 💰 免费层/付费 |
| 设置复杂度 / Setup | 🔧 简单 | 🔧 中等 |
| 维护 / Maintenance | 👤 自己维护 | ☁️ 托管服务 |
| 实时功能 / Realtime | ⚠️ 轮询 | ✅ WebSocket |
| 文件存储 / Storage | 📁 本地文件系统 | ☁️ Supabase Storage |
| 认证 / Auth | 🔐 NextAuth | 🔐 Supabase Auth |
| 备份 / Backup | 📦 手动 | 📦 自动 |
| 扩展性 / Scalability | 📊 有限 | 📊 高 |
| 离线工作 / Offline | ✅ 完全支持 | ❌ 需要网络 |

## 切换模式 / Switching Modes

### 从本地切换到 Supabase

1. 导出本地数据:
   ```bash
   npm run export:data
   ```

2. 更新环境变量:
   ```env
   DATABASE_MODE=supabase
   # 添加 Supabase 配置
   ```

3. 导入数据到 Supabase:
   ```bash
   npm run import:data
   ```

4. 重启应用:
   ```bash
   npm run dev
   ```

### 从 Supabase 切换到本地

1. 导出 Supabase 数据:
   ```bash
   npm run export:data
   ```

2. 启动本地数据库:
   ```bash
   docker-compose up -d
   ```

3. 更新环境变量:
   ```env
   DATABASE_MODE=local
   # 添加本地配置
   ```

4. 导入数据到本地:
   ```bash
   npm run import:data
   ```

5. 重启应用:
   ```bash
   npm run dev
   ```

## 功能可用性 / Feature Availability

### 核心功能 / Core Features

所有核心功能在两种模式下都可用:

All core features are available in both modes:

- ✅ 笔记创建和编辑
- ✅ 文件夹管理
- ✅ 标签系统
- ✅ 搜索功能
- ✅ 用户认证
- ✅ 文件上传

### 模式特定功能 / Mode-Specific Features

#### 仅 Supabase 模式 / Supabase Only

- 🔄 实时协作(WebSocket)
- 🌐 全球 CDN 文件访问
- 📧 邮件认证(Magic Link)
- 🔐 社交登录(OAuth)

#### 本地模式回退 / Local Mode Fallbacks

当 Supabase 功能不可用时,系统会自动降级:

When Supabase features are unavailable, the system automatically degrades:

- 实时协作 → 轮询更新
- Supabase Storage → 本地文件系统
- Supabase Auth → NextAuth 凭证认证

## 推荐配置 / Recommended Configuration

### 开发环境 / Development

```env
DATABASE_MODE=local
```

**原因 / Reasons:**
- 快速迭代
- 无网络依赖
- 免费使用
- 完全控制

### 生产环境 / Production

```env
DATABASE_MODE=supabase
```

**原因 / Reasons:**
- 托管服务
- 自动备份
- 高可用性
- 全球访问

### 混合方案 / Hybrid Approach

- 开发: 本地模式
- 预发布: Supabase 测试项目
- 生产: Supabase 生产项目

## 性能对比 / Performance Comparison

### 页面加载时间 / Page Load Time

| 操作 / Operation | 本地 / Local | Supabase |
|-----------------|-------------|----------|
| 首次加载 / Initial Load | ~3-5s | ~8-12s |
| 笔记列表 / Note List | ~100ms | ~300-500ms |
| 创建笔记 / Create Note | ~50ms | ~200-400ms |
| 文件上传 / File Upload | ~100ms | ~500-1000ms |

*注意: 实际性能取决于网络条件和服务器位置*

*Note: Actual performance depends on network conditions and server location*

## 故障排除 / Troubleshooting

### 本地模式问题 / Local Mode Issues

1. **数据库连接失败**
   ```bash
   # 检查 Docker 容器
   docker-compose ps
   
   # 查看日志
   docker-compose logs postgres
   ```

2. **端口冲突**
   ```bash
   # 修改 docker-compose.yml 端口
   ports:
     - "5433:5432"
   ```

### Supabase 模式问题 / Supabase Mode Issues

1. **连接超时**
   - 检查网络连接
   - 验证 Supabase URL 和密钥
   - 检查防火墙设置

2. **认证失败**
   - 验证 API 密钥
   - 检查 RLS 策略
   - 确认用户权限

## 下一步 / Next Steps

- 阅读 [本地数据库设置指南](./LOCAL_DATABASE_SETUP.md)
- 查看 [故障排除指南](./TROUBLESHOOTING.md)
- 了解 [数据迁移工具](./DATA_MIGRATION.md)
