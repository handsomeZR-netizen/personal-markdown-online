# 本地数据库设置指南
# Local Database Setup Guide

本指南将帮助您设置本地 PostgreSQL 数据库用于开发。

This guide will help you set up a local PostgreSQL database for development.

## 目录 / Table of Contents

1. [前置要求](#前置要求--prerequisites)
2. [快速开始](#快速开始--quick-start)
3. [Docker 方式](#docker-方式--docker-method)
4. [原生安装方式](#原生安装方式--native-installation)
5. [数据库健康检查](#数据库健康检查--database-health-check)
6. [故障排除](#故障排除--troubleshooting)

## 前置要求 / Prerequisites

### Docker 方式 (推荐)

- Docker Desktop 或 Docker Engine
- Docker Compose (通常包含在 Docker Desktop 中)

### 原生安装方式

- PostgreSQL 16 或更高版本

## 快速开始 / Quick Start

### 1. 使用 Docker (推荐)

```bash
# 从项目根目录启动数据库
# Start database from project root
docker-compose up -d

# 检查数据库状态
# Check database status
docker-compose ps

# 查看日志
# View logs
docker-compose logs postgres
```

### 2. 配置环境变量

```bash
# 复制示例配置文件
# Copy example configuration
cd note-app
cp .env.local.example .env.local

# 编辑 .env.local 并确保以下配置正确:
# Edit .env.local and ensure these settings are correct:
# DATABASE_MODE=local
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
```

### 3. 运行数据库迁移

```bash
# 在 note-app 目录中
# In note-app directory
npm run prisma:migrate

# 或者
# Or
npx prisma migrate deploy
```

### 4. (可选) 填充测试数据

```bash
# 填充数据库 (3 users, 20 notes, 8 folders)
# Seed database (3 users, 20 notes, 8 folders)
npm run db:seed

# 或重置并填充
# Or reset and seed
npm run db:seed:reset

# 自定义数据量
# Custom data amounts
npx tsx prisma/seed.ts --users=5 --notes=50 --folders=15
```

详细的填充选项请参阅 [Seed README](../prisma/SEED_README.md)

For detailed seeding options, see [Seed README](../prisma/SEED_README.md)

**测试账号 / Test Credentials:**
- Email: `user1@example.com`, `user2@example.com`, etc.
- Password: `password123`

### 5. 启动开发服务器

```bash
npm run dev
```

## Docker 方式 / Docker Method

### 启动数据库

```bash
# 从项目根目录
# From project root
docker-compose up -d
```

这将:
- 拉取 PostgreSQL 16 Alpine 镜像
- 创建名为 `noteapp-postgres` 的容器
- 在端口 5432 上暴露数据库
- 创建持久化卷 `postgres_data`
- 配置健康检查

This will:
- Pull PostgreSQL 16 Alpine image
- Create container named `noteapp-postgres`
- Expose database on port 5432
- Create persistent volume `postgres_data`
- Configure health checks

### 停止数据库

```bash
# 停止但保留数据
# Stop but keep data
docker-compose stop

# 停止并删除容器(数据保留在卷中)
# Stop and remove container (data remains in volume)
docker-compose down

# 停止并删除所有数据
# Stop and remove all data
docker-compose down -v
```

### 查看数据库日志

```bash
docker-compose logs -f postgres
```

### 连接到数据库

```bash
# 使用 psql
# Using psql
docker-compose exec postgres psql -U postgres -d noteapp

# 或使用任何 PostgreSQL 客户端
# Or use any PostgreSQL client
# Host: localhost
# Port: 5432
# User: postgres
# Password: postgres
# Database: noteapp
```

## 原生安装方式 / Native Installation

如果您不想使用 Docker,可以直接安装 PostgreSQL。

If you don't want to use Docker, you can install PostgreSQL directly.

### macOS

```bash
# 使用 Homebrew
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16

# 创建数据库
# Create database
createdb noteapp
```

### Windows

1. 从 [PostgreSQL 官网](https://www.postgresql.org/download/windows/) 下载安装程序
2. 运行安装程序并按照向导操作
3. 使用 pgAdmin 或命令行创建数据库 `noteapp`

### Linux (Ubuntu/Debian)

```bash
# 安装 PostgreSQL
# Install PostgreSQL
sudo apt update
sudo apt install postgresql-16

# 启动服务
# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库
# Create database
sudo -u postgres createdb noteapp
```

### 配置连接

原生安装后,更新 `.env.local`:

After native installation, update `.env.local`:

```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/noteapp
DIRECT_URL=postgresql://postgres:your-password@localhost:5432/noteapp
```

## 数据库健康检查 / Database Health Check

Docker Compose 配置包含自动健康检查:

The Docker Compose configuration includes automatic health checks:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### 检查健康状态

```bash
# 查看容器健康状态
# Check container health status
docker-compose ps

# 详细健康检查信息
# Detailed health check info
docker inspect noteapp-postgres --format='{{.State.Health.Status}}'
```

健康状态:
- `starting`: 容器正在启动
- `healthy`: 数据库正常运行
- `unhealthy`: 数据库有问题

Health statuses:
- `starting`: Container is starting up
- `healthy`: Database is running normally
- `unhealthy`: Database has issues

### 手动健康检查

```bash
# 测试数据库连接
# Test database connection
docker-compose exec postgres pg_isready -U postgres

# 或从应用测试
# Or test from application
npm run test:db
```

## 故障排除 / Troubleshooting

### 端口已被占用

**问题**: `Error: bind: address already in use`

**解决方案**:

```bash
# 查找占用端口 5432 的进程
# Find process using port 5432

# macOS/Linux
lsof -i :5432

# Windows
netstat -ano | findstr :5432

# 停止占用端口的进程或更改 Docker 端口映射
# Stop the process or change Docker port mapping
```

修改 `docker-compose.yml` 使用不同端口:

Modify `docker-compose.yml` to use different port:

```yaml
ports:
  - "5433:5432"  # 使用 5433 而不是 5432
```

然后更新 `.env.local`:

Then update `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/noteapp
```

### 容器无法启动

**问题**: 容器启动失败

**解决方案**:

```bash
# 查看详细日志
# View detailed logs
docker-compose logs postgres

# 删除旧容器和卷
# Remove old container and volumes
docker-compose down -v

# 重新启动
# Restart
docker-compose up -d
```

### 连接被拒绝

**问题**: `Connection refused` 或 `ECONNREFUSED`

**检查清单**:

1. 确认数据库正在运行:
   ```bash
   docker-compose ps
   ```

2. 检查健康状态:
   ```bash
   docker inspect noteapp-postgres --format='{{.State.Health.Status}}'
   ```

3. 验证环境变量:
   ```bash
   cat note-app/.env.local | grep DATABASE_URL
   ```

4. 测试连接:
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

### 迁移失败

**问题**: Prisma 迁移失败

**解决方案**:

```bash
# 重置数据库(⚠️ 会删除所有数据)
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# 或手动运行迁移
# Or manually run migrations
npx prisma migrate deploy

# 检查迁移状态
# Check migration status
npx prisma migrate status
```

### 权限问题

**问题**: 权限被拒绝

**解决方案**:

```bash
# 确保 Docker 有足够权限
# Ensure Docker has sufficient permissions

# macOS/Linux
sudo chown -R $USER:$USER postgres_data

# 或重新创建卷
# Or recreate volume
docker-compose down -v
docker-compose up -d
```

## 数据持久化 / Data Persistence

数据存储在 Docker 卷中,即使容器被删除也会保留。

Data is stored in a Docker volume and persists even if the container is removed.

### 备份数据

```bash
# 导出数据库
# Export database
docker-compose exec postgres pg_dump -U postgres noteapp > backup.sql

# 或使用 Prisma
# Or use Prisma
npm run export:data
```

### 恢复数据

```bash
# 导入数据库
# Import database
docker-compose exec -T postgres psql -U postgres noteapp < backup.sql

# 或使用 Prisma
# Or use Prisma
npm run import:data
```

## 性能优化 / Performance Optimization

### 连接池配置

在 `.env.local` 中添加连接池参数:

Add connection pooling parameters in `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp?connection_limit=10&pool_timeout=20
```

### 监控性能

```bash
# 查看活动连接
# View active connections
docker-compose exec postgres psql -U postgres -d noteapp -c "SELECT * FROM pg_stat_activity;"

# 查看数据库大小
# View database size
docker-compose exec postgres psql -U postgres -d noteapp -c "SELECT pg_size_pretty(pg_database_size('noteapp'));"
```

## 下一步 / Next Steps

- 阅读 [数据库模式文档](./DATABASE_MODES.md) 了解本地和 Supabase 模式的区别
- 查看 [数据库填充指南](../prisma/SEED_README.md) 了解如何填充测试数据
- 运行 `npm run db:seed` 填充测试数据
- 使用 `npm run db:studio` 在 Prisma Studio 中查看数据

- Read [Database Modes Documentation](./DATABASE_MODES.md) to understand local vs Supabase modes
- Check [Database Seeding Guide](../prisma/SEED_README.md) to learn about populating test data
- Run `npm run db:seed` to populate test data
- Use `npm run db:studio` to view data in Prisma Studio
