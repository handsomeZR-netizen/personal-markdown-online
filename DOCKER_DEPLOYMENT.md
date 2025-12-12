# 🐳 Docker 部署指南
# Docker Deployment Guide

本指南将帮助您使用 Docker 部署笔记应用。

This guide will help you deploy the note application using Docker.

## 目录 / Table of Contents

1. [前置要求](#前置要求--prerequisites)
2. [快速部署](#快速部署--quick-deployment)
3. [配置说明](#配置说明--configuration)
4. [数据库迁移](#数据库迁移--database-migration)
5. [生产环境部署](#生产环境部署--production-deployment)
6. [常用命令](#常用命令--common-commands)
7. [故障排除](#故障排除--troubleshooting)

---

## 前置要求 / Prerequisites

- Docker 20.10+ 
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

### 检查 Docker 版本

```bash
docker --version
docker-compose --version
```

---

## 快速部署 / Quick Deployment

### 步骤 1: 克隆项目

```bash
git clone https://github.com/your-username/note-app.git
cd note-app
```

### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.docker.example .env.docker

# 编辑配置文件
# Windows
notepad .env.docker

# macOS/Linux
nano .env.docker
```

**必须修改的配置项：**

```env
# 数据库密码 - 请使用强密码！
POSTGRES_PASSWORD=your-strong-password-here

# 认证密钥 - 使用以下命令生成：
# openssl rand -base64 32
NEXTAUTH_SECRET=your-random-secret-here
AUTH_SECRET=your-random-secret-here

# 应用访问地址
NEXTAUTH_URL=http://localhost:3000
```

### 步骤 3: 启动服务

```bash
# 启动所有服务（后台运行）
docker-compose --env-file .env.docker up -d

# 查看启动日志
docker-compose logs -f
```

### 步骤 4: 运行数据库迁移

```bash
# 等待数据库完全启动（约 10-30 秒）
# 然后运行迁移
docker-compose exec app npx prisma migrate deploy
```

### 步骤 5: 访问应用

打开浏览器访问: http://localhost:3000

---

## 配置说明 / Configuration

### 环境变量详解

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `POSTGRES_USER` | ❌ | postgres | 数据库用户名 |
| `POSTGRES_PASSWORD` | ✅ | - | 数据库密码，请使用强密码 |
| `POSTGRES_DB` | ❌ | noteapp | 数据库名称 |
| `POSTGRES_PORT` | ❌ | 5432 | 数据库端口 |
| `APP_PORT` | ❌ | 3000 | 应用访问端口 |
| `DATABASE_MODE` | ❌ | local | 数据库模式 (local/supabase) |
| `NEXTAUTH_SECRET` | ✅ | - | NextAuth 认证密钥 |
| `AUTH_SECRET` | ✅ | - | Auth 密钥（与 NEXTAUTH_SECRET 相同） |
| `NEXTAUTH_URL` | ✅ | - | 应用完整 URL |
| `DEEPSEEK_API_KEY` | ❌ | - | AI 功能 API 密钥 |

### 生成安全密钥

```bash
# Linux/macOS
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# 或使用在线工具
# https://generate-secret.vercel.app/32
```

---

## 数据库迁移 / Database Migration

### 首次部署

```bash
# 运行所有迁移
docker-compose exec app npx prisma migrate deploy

# 生成 Prisma Client（通常构建时已完成）
docker-compose exec app npx prisma generate
```

### 填充测试数据（可选）

```bash
# 填充默认测试数据
docker-compose exec app npx prisma db seed
```

测试账号：
- 邮箱: `user1@example.com`
- 密码: `password123`

### 查看数据库

```bash
# 使用 psql 连接
docker-compose exec postgres psql -U postgres -d noteapp

# 常用 SQL 命令
\dt          # 列出所有表
\d+ users    # 查看 users 表结构
SELECT * FROM "User" LIMIT 5;  # 查询用户
\q           # 退出
```

---

## 生产环境部署 / Production Deployment

### 1. 安全配置

```env
# .env.docker 生产环境配置

# 使用强密码
POSTGRES_PASSWORD=<32位以上随机字符串>
NEXTAUTH_SECRET=<32位以上随机字符串>
AUTH_SECRET=<32位以上随机字符串>

# 使用实际域名
NEXTAUTH_URL=https://your-domain.com
```

### 2. 反向代理配置 (Nginx)

创建 `nginx.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 数据备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres noteapp > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres noteapp < backup_20241212.sql
```

### 4. 自动重启

docker-compose.yml 已配置 `restart: unless-stopped`，服务会在崩溃或服务器重启后自动恢复。

---

## 常用命令 / Common Commands

### 服务管理

```bash
# 启动服务
docker-compose --env-file .env.docker up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 只查看应用日志
docker-compose logs -f app

# 只查看数据库日志
docker-compose logs -f postgres
```

### 镜像管理

```bash
# 重新构建镜像
docker-compose build --no-cache

# 更新并重启
docker-compose --env-file .env.docker up -d --build

# 清理未使用的镜像
docker image prune -f
```

### 数据管理

```bash
# 进入应用容器
docker-compose exec app sh

# 进入数据库容器
docker-compose exec postgres bash

# 查看数据卷
docker volume ls

# 删除所有数据（危险！）
docker-compose down -v
```

### 健康检查

```bash
# 检查服务健康状态
docker-compose ps

# 手动测试健康端点
curl http://localhost:3000/api/health

# 检查数据库连接
docker-compose exec postgres pg_isready -U postgres
```

---

## 故障排除 / Troubleshooting

### 问题 1: 容器启动失败

**症状**: `docker-compose up` 后容器立即退出

**解决方案**:
```bash
# 查看详细日志
docker-compose logs app

# 常见原因：
# 1. 环境变量未配置 - 检查 .env.docker
# 2. 端口被占用 - 修改 APP_PORT
# 3. 内存不足 - 增加 Docker 内存限制
```

### 问题 2: 数据库连接失败

**症状**: 应用报错 `Connection refused` 或 `ECONNREFUSED`

**解决方案**:
```bash
# 1. 确认数据库容器正在运行
docker-compose ps

# 2. 等待数据库完全启动
docker-compose logs postgres | grep "ready to accept connections"

# 3. 检查网络连接
docker-compose exec app ping postgres
```

### 问题 3: 迁移失败

**症状**: `prisma migrate deploy` 报错

**解决方案**:
```bash
# 1. 确认数据库已启动
docker-compose exec postgres pg_isready -U postgres

# 2. 重置数据库（会删除数据！）
docker-compose exec app npx prisma migrate reset --force

# 3. 检查 schema 是否有效
docker-compose exec app npx prisma validate
```

### 问题 4: 端口冲突

**症状**: `bind: address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
# Windows
netstat -ano | findstr :3000

# Linux/macOS
lsof -i :3000

# 修改 .env.docker 使用其他端口
APP_PORT=3001
POSTGRES_PORT=5433
```

### 问题 5: 磁盘空间不足

**症状**: 构建失败或容器无法启动

**解决方案**:
```bash
# 清理 Docker 缓存
docker system prune -a

# 清理未使用的卷
docker volume prune

# 查看磁盘使用
docker system df
```

---

## 架构说明 / Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Docker Network                    │
│                  (noteapp-network)                   │
│                                                      │
│  ┌──────────────────┐    ┌──────────────────┐      │
│  │                  │    │                  │      │
│  │   Note App       │───▶│   PostgreSQL     │      │
│  │   (Next.js)      │    │   (pgvector)     │      │
│  │                  │    │                  │      │
│  │   Port: 8080     │    │   Port: 5432     │      │
│  │   (内部)         │    │   (内部)         │      │
│  │                  │    │                  │      │
│  └────────┬─────────┘    └────────┬─────────┘      │
│           │                       │                 │
└───────────┼───────────────────────┼─────────────────┘
            │                       │
            ▼                       ▼
      ┌─────────┐            ┌─────────┐
      │ :3000   │            │ :5432   │
      │ (外部)  │            │ (外部)  │
      └─────────┘            └─────────┘
            │                       │
            ▼                       ▼
       用户浏览器              数据库工具
```

### 数据持久化

- `postgres_data`: PostgreSQL 数据文件
- `uploads_data`: 用户上传的文件

这些卷在 `docker-compose down` 后仍然保留，只有 `docker-compose down -v` 才会删除。

---

## 更新应用 / Updating

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建并启动
docker-compose --env-file .env.docker up -d --build

# 3. 运行新的迁移（如果有）
docker-compose exec app npx prisma migrate deploy
```

---

## 相关文档 / Related Documentation

- [本地数据库设置](./LOCAL_DATABASE_SETUP.md)
- [数据库模式说明](./DATABASE_MODES.md)
- [Vercel 部署指南](./DEPLOYMENT_GUIDE.md)
- [Google Cloud 部署](./GOOGLE_CLOUD_DEPLOYMENT.md)
