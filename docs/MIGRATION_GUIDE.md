# 迁移指南 - 从 Supabase 到本地数据库
# Migration Guide - From Supabase to Local Database

本指南帮助现有用户从 Supabase 架构迁移到支持本地数据库的新架构。

This guide helps existing users migrate from the Supabase-only architecture to the new architecture that supports local databases.

## 目录 / Table of Contents

1. [迁移概述](#迁移概述--migration-overview)
2. [迁移前准备](#迁移前准备--pre-migration-checklist)
3. [迁移步骤](#迁移步骤--migration-steps)
4. [验证迁移](#验证迁移--verify-migration)
5. [回滚计划](#回滚计划--rollback-plan)
6. [常见问题](#常见问题--faq)

## 迁移概述 / Migration Overview

### 什么改变了? / What Changed?

新架构引入了以下改进:

The new architecture introduces the following improvements:

- ✅ **本地数据库支持**: 开发时使用本地 PostgreSQL,提升性能
- ✅ **灵活的数据库模式**: 通过环境变量在本地和 Supabase 之间切换
- ✅ **更快的开发体验**: 页面加载时间从 15-18 秒降至 3-5 秒
- ✅ **离线开发**: 无需网络连接即可开发
- ✅ **向后兼容**: 完全支持现有的 Supabase 部署

### 谁需要迁移? / Who Needs to Migrate?

**需要迁移的用户:**
- 正在使用旧版本应用的开发者
- 希望使用本地数据库进行开发的用户
- 遇到开发性能问题的用户

**不需要迁移的用户:**
- 仅在生产环境使用 Supabase 的用户(可以继续使用)
- 新用户(直接使用新架构)

### 迁移时间 / Migration Time

- **准备时间**: 10-15 分钟
- **迁移时间**: 5-10 分钟
- **验证时间**: 5-10 分钟
- **总计**: 约 30 分钟

## 迁移前准备 / Pre-Migration Checklist

### 1. 备份现有数据

⚠️ **重要**: 在开始迁移前,务必备份您的数据!

```bash
# 导出 Supabase 数据
npm run db:export -- --output backup-before-migration.json --pretty --validate
```

### 2. 检查系统要求

确保您的系统满足以下要求:

Ensure your system meets the following requirements:

- **Node.js**: 18.0 或更高版本
- **npm**: 9.0 或更高版本
- **Docker Desktop** (推荐) 或 **PostgreSQL 16+** (原生安装)
- **磁盘空间**: 至少 2GB 可用空间

检查版本:
```bash
node --version  # 应该 >= 18.0
npm --version   # 应该 >= 9.0
docker --version  # 如果使用 Docker
```

### 3. 更新代码

拉取最新代码:

```bash
git pull origin main
npm install
```

### 4. 记录当前配置

保存当前的 `.env.local` 文件:

```bash
cp .env.local .env.local.backup
```

## 迁移步骤 / Migration Steps

### 步骤 1: 安装 Docker (推荐)

如果您还没有安装 Docker:

**macOS/Windows:**
1. 下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. 启动 Docker Desktop
3. 验证安装: `docker --version`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**或者使用原生 PostgreSQL:**

如果不想使用 Docker,可以安装原生 PostgreSQL:

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql-16

# Windows
# 从 https://www.postgresql.org/download/windows/ 下载安装程序
```

### 步骤 2: 启动本地数据库

**使用 Docker (推荐):**

```bash
# 从项目根目录
docker-compose up -d

# 验证数据库正在运行
docker-compose ps
```

您应该看到 `noteapp-postgres` 容器状态为 `Up` 和 `healthy`。

**使用原生 PostgreSQL:**

```bash
# 创建数据库
createdb noteapp

# 或使用 psql
psql -U postgres -c "CREATE DATABASE noteapp;"
```

### 步骤 3: 配置环境变量

创建新的 `.env.local` 文件用于本地开发:

```bash
cd note-app
cp .env.local.example .env.local
```

编辑 `.env.local` 并设置以下变量:

```env
# 数据库模式 - 设置为 local
DATABASE_MODE=local

# 本地 PostgreSQL 连接
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/noteapp

# NextAuth 配置
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-key-here

# 本地存储路径
LOCAL_STORAGE_PATH=./uploads

# 协作服务器 (可选)
COLLAB_SERVER_PORT=1234
COLLAB_SERVER_SECRET=local-dev-secret
NEXT_PUBLIC_COLLAB_SERVER_URL=ws://localhost:1234

# AI 功能 (可选)
DEEPSEEK_API_KEY=your-deepseek-api-key
NEXT_PUBLIC_AI_ENABLED=true
```

**生成密钥:**

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 步骤 4: 运行数据库迁移

```bash
# 应用所有迁移到本地数据库
npm run db:migrate

# 或使用 Prisma 直接命令
npx prisma migrate deploy
```

验证迁移成功:
```bash
npx prisma migrate status
```

### 步骤 5: 导入现有数据 (可选)

如果您想将 Supabase 数据导入到本地数据库:

```bash
# 确保您在步骤 1 中已经导出了数据
npm run db:import -- --input backup-before-migration.json --mode replace --validate
```

**或者使用测试数据:**

```bash
# 填充测试数据
npm run db:seed

# 这将创建:
# - 3 个测试用户 (user1@example.com, user2@example.com, user3@example.com)
# - 20 条笔记
# - 8 个文件夹
# 密码: password123
```

### 步骤 6: 启动开发服务器

```bash
npm run dev
```

应用应该在 3-5 秒内启动,而不是之前的 15-18 秒!

### 步骤 7: 验证功能

在浏览器中打开 http://localhost:3000 并测试:

1. ✅ 用户登录
2. ✅ 创建笔记
3. ✅ 编辑笔记
4. ✅ 上传图片
5. ✅ 创建文件夹
6. ✅ 搜索功能

## 验证迁移 / Verify Migration

### 自动验证

运行验证脚本:

```bash
# 验证数据库连接和配置
npm run db:validate

# 运行健康检查
npm run health:check
```

### 手动验证清单

- [ ] 数据库连接成功
- [ ] 所有迁移已应用
- [ ] 用户可以登录
- [ ] 可以创建和编辑笔记
- [ ] 文件上传功能正常
- [ ] 搜索功能正常
- [ ] 文件夹功能正常
- [ ] 页面加载速度明显提升

### 性能对比

测量页面加载时间:

**迁移前 (Supabase):**
- 首次加载: 15-18 秒
- 笔记列表: 2-3 秒

**迁移后 (本地):**
- 首次加载: 3-5 秒
- 笔记列表: 100-200 毫秒

## 保留 Supabase 用于生产环境

### 双模式配置

您可以同时维护本地和 Supabase 配置:

**开发环境 (.env.local):**
```env
DATABASE_MODE=local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noteapp
```

**生产环境 (.env.production):**
```env
DATABASE_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres
```

### 部署到生产环境

当部署到 Vercel 或其他平台时:

1. 在平台环境变量中设置 `DATABASE_MODE=supabase`
2. 添加所有 Supabase 相关的环境变量
3. 应用会自动使用 Supabase 模式

## 回滚计划 / Rollback Plan

如果迁移出现问题,您可以回滚到之前的配置:

### 快速回滚

```bash
# 1. 停止开发服务器 (Ctrl+C)

# 2. 恢复旧的环境变量
cp .env.local.backup .env.local

# 3. 重启开发服务器
npm run dev
```

### 完整回滚

如果需要完全回滚:

```bash
# 1. 停止本地数据库
docker-compose down

# 2. 恢复旧配置
cp .env.local.backup .env.local

# 3. 清除缓存
rm -rf .next

# 4. 重新安装依赖
npm install

# 5. 重启开发服务器
npm run dev
```

### 恢复数据

如果需要恢复备份的数据:

```bash
# 切换回 Supabase 模式
# 编辑 .env.local 设置 DATABASE_MODE=supabase

# 导入备份数据
npm run db:import -- --input backup-before-migration.json --mode replace
```

## 常见问题 / FAQ

### Q1: 迁移后我的 Supabase 数据会丢失吗?

**A**: 不会。迁移只影响您的本地开发环境。Supabase 上的数据保持不变。您可以随时切换回 Supabase 模式。

### Q2: 我可以在本地和 Supabase 之间同步数据吗?

**A**: 可以。使用导出/导入工具:

```bash
# 从 Supabase 导出
DATABASE_MODE=supabase npm run db:export -- --output supabase-data.json

# 导入到本地
DATABASE_MODE=local npm run db:import -- --input supabase-data.json
```

### Q3: 本地模式支持所有功能吗?

**A**: 是的,所有核心功能都支持。一些 Supabase 特定功能(如实时协作)会使用回退实现(轮询)。

### Q4: 我需要修改代码吗?

**A**: 不需要。应用会根据 `DATABASE_MODE` 环境变量自动选择正确的实现。

### Q5: Docker 容器占用多少空间?

**A**: PostgreSQL 容器约 200-300MB,数据卷根据您的数据量而定(通常 < 100MB)。

### Q6: 我可以使用现有的 PostgreSQL 安装吗?

**A**: 可以。只需创建数据库并更新 `DATABASE_URL` 指向您的 PostgreSQL 实例。

### Q7: 如何在团队中共享本地数据库?

**A**: 有几种方式:
1. 导出数据为 JSON 并共享文件
2. 使用 Git 共享数据库种子脚本
3. 使用共享的开发数据库(不推荐用于本地开发)

### Q8: 迁移会影响生产环境吗?

**A**: 不会。迁移只影响开发环境。生产环境继续使用 Supabase。

### Q9: 我可以只迁移部分功能吗?

**A**: 建议完整迁移以获得最佳体验。但您可以选择性导入数据:

```bash
npm run db:import -- --input backup.json --include users,notes
```

### Q10: 如何更新到最新版本?

**A**: 定期拉取最新代码:

```bash
git pull origin main
npm install
npm run db:migrate
```

## 获取帮助 / Getting Help

如果遇到问题:

1. **查看文档**:
   - [本地数据库设置](./LOCAL_DATABASE_SETUP.md)
   - [数据库模式说明](./DATABASE_MODES.md)
   - [故障排除指南](./TROUBLESHOOTING.md)
   - [数据迁移指南](./DATA_MIGRATION.md)

2. **运行诊断**:
   ```bash
   npm run diagnose
   npm run health:check
   ```

3. **查看日志**:
   ```bash
   # 应用日志
   npm run dev
   
   # Docker 日志
   docker-compose logs -f postgres
   ```

4. **提交 Issue**:
   - 包含错误消息
   - 包含环境信息
   - 包含重现步骤

## 迁移后的最佳实践

### 1. 定期备份

```bash
# 每周备份一次
npm run db:export -- --output weekly-backup-$(date +%Y%m%d).json
```

### 2. 保持同步

定期从 Supabase 同步生产数据到本地:

```bash
# 1. 导出生产数据
DATABASE_MODE=supabase npm run db:export -- --output prod-data.json

# 2. 导入到本地
DATABASE_MODE=local npm run db:import -- --input prod-data.json --mode replace
```

### 3. 使用版本控制

提交环境变量模板,但不要提交实际的 `.env.local`:

```bash
# .gitignore 应该包含
.env.local
.env*.local
```

### 4. 文档化自定义配置

如果您修改了默认配置,记录在项目 README 中。

### 5. 监控性能

使用内置的性能监控:

```bash
npm run perf:test
```

## 下一步 / Next Steps

迁移完成后:

1. ✅ 熟悉新的开发工作流
2. ✅ 阅读 [数据库模式文档](./DATABASE_MODES.md)
3. ✅ 了解 [数据迁移工具](./DATA_MIGRATION.md)
4. ✅ 配置 [启动验证](./STARTUP_VALIDATION.md)
5. ✅ 探索性能优化选项

## 总结 / Summary

迁移到新架构后,您将获得:

- ⚡ **3-4 倍的性能提升**
- 🚀 **更快的开发迭代**
- 💰 **降低开发成本**(无需 Supabase 免费层限制)
- 🔒 **完全的数据控制**
- 🌐 **离线开发能力**
- 🔄 **灵活的部署选项**

同时保持:

- ✅ **完整的功能支持**
- ✅ **Supabase 生产部署**
- ✅ **向后兼容性**
- ✅ **数据迁移能力**

欢迎使用新架构!如有问题,请参考文档或提交 Issue。
