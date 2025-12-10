# Supabase 快速开始指南

## 5分钟快速迁移

### 步骤1: 创建Supabase项目 (2分钟)

1. 访问 https://supabase.com 并登录
2. 点击 "New Project"
3. 填写信息：
   - Name: `note-app`
   - Database Password: 设置并**保存**密码
   - Region: 选择 `Singapore` (亚洲用户) 或 `US East` (美国用户)
4. 点击 "Create new project"
5. 等待项目创建完成

### 步骤2: 获取连接信息 (1分钟)

1. 在Supabase项目中，进入 **Settings** → **Database**
2. 找到 **Connection string** 部分
3. 选择 **URI** 模式
4. 复制连接字符串（类似这样）:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. 将 `[YOUR-PASSWORD]` 替换为你刚才设置的密码

### 步骤3: 配置环境变量 (1分钟)

编辑 `.env.local` 文件，替换数据库配置：

```env
# 旧的SQLite配置（删除或注释）
# DATABASE_URL=file:./dev.db

# 新的Supabase配置
DATABASE_URL="postgresql://postgres:你的密码@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:你的密码@db.xxxxx.supabase.co:5432/postgres"

# 其他配置保持不变
AUTH_SECRET=79uuqzzaW1ONaS6GQxBhrieVoKjz8CJBlBV4h1WBTUc=
DEEPSEEK_API_KEY=sk-4e3d7bb175a44822a032aab2a0fa105f
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

### 步骤4: 更新数据库Schema (1分钟)

```bash
# 1. 备份当前schema
cp prisma/schema.prisma prisma/schema.sqlite.backup

# 2. 使用Supabase schema
cp prisma/schema.supabase.prisma prisma/schema.prisma

# 3. 执行迁移
npx prisma migrate dev --name init_supabase

# 4. 生成客户端
npx prisma generate
```

### 步骤5: 测试 (30秒)

```bash
# 启动应用
npm run dev

# 访问 http://localhost:3000
# 注册新用户并测试功能
```

## 完成！🎉

你的应用现在已经连接到Supabase云端数据库了！

## 迁移现有数据（可选）

如果你有现有的SQLite数据需要迁移：

```bash
# 安装tsx（如果还没有）
npm install -D tsx

# 运行迁移脚本
npx tsx scripts/migrate-to-supabase.ts
```

## 常见问题

### Q: 连接失败怎么办？
A: 检查以下几点：
1. 密码是否正确
2. 连接字符串是否完整
3. 是否包含 `?pgbouncer=true`
4. 网络是否正常

### Q: 迁移后数据丢失？
A: 不用担心！
1. SQLite数据库文件 `dev.db` 仍然存在
2. 可以随时回滚到SQLite
3. 重新运行迁移脚本即可

### Q: 如何查看数据？
A: 两种方式：
1. Prisma Studio: `npx prisma studio`
2. Supabase Dashboard: Table Editor

### Q: 免费额度够用吗？
A: 对于个人项目完全够用：
- 500MB 数据库空间
- 2GB 带宽/月
- 50,000 认证用户

## 下一步

- [ ] 配置Row Level Security (RLS)
- [ ] 启用实时订阅
- [ ] 设置自动备份
- [ ] 部署到Vercel

详细信息请查看 `SUPABASE_MIGRATION.md`

## 回滚到SQLite

如果需要回滚：

```bash
# 1. 恢复schema
cp prisma/schema.sqlite.backup prisma/schema.prisma

# 2. 恢复环境变量
# 编辑 .env.local:
DATABASE_URL=file:./dev.db

# 3. 重新迁移
npx prisma migrate dev
```

## 需要帮助？

- 📖 完整文档: `SUPABASE_MIGRATION.md`
- 💬 Supabase Discord: https://discord.supabase.com
- 🐛 报告问题: GitHub Issues
