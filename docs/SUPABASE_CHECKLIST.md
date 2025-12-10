# Supabase 迁移检查清单

## 迁移前准备

### 1. 备份现有数据
- [ ] 复制 `dev.db` 文件到安全位置
- [ ] 导出重要数据（可选）
- [ ] 备份 `.env.local` 文件
- [ ] 备份 `prisma/schema.prisma` 文件

### 2. 创建Supabase账号和项目
- [ ] 注册Supabase账号
- [ ] 创建新项目
- [ ] 设置数据库密码（并保存！）
- [ ] 选择合适的区域
- [ ] 等待项目创建完成

### 3. 获取连接信息
- [ ] 进入 Settings → Database
- [ ] 复制 Connection string (URI模式)
- [ ] 记录项目引用ID
- [ ] 获取 Anon Key（可选，用于实时功能）

## 配置更新

### 4. 环境变量配置
- [ ] 创建 `.env.local.backup` 备份
- [ ] 更新 `DATABASE_URL`
- [ ] 添加 `DIRECT_URL`
- [ ] 验证其他环境变量完整
- [ ] 检查密码是否正确替换

### 5. Schema更新
- [ ] 备份当前schema: `cp prisma/schema.prisma prisma/schema.sqlite.backup`
- [ ] 复制Supabase schema: `cp prisma/schema.supabase.prisma prisma/schema.prisma`
- [ ] 检查schema文件内容
- [ ] 确认 provider 改为 `postgresql`
- [ ] 确认添加了 `directUrl`

## 执行迁移

### 6. 数据库迁移
- [ ] 运行: `npm run supabase:setup`
  - 或手动执行:
    - [ ] `npx prisma migrate dev --name init_supabase`
    - [ ] `npx prisma generate`
- [ ] 检查迁移是否成功
- [ ] 查看Supabase Dashboard确认表已创建

### 7. 数据迁移（如有现有数据）
- [ ] 安装tsx: `npm install -D tsx`
- [ ] 运行迁移脚本: `npm run db:migrate:supabase`
- [ ] 检查迁移日志
- [ ] 验证数据完整性

## 测试验证

### 8. 功能测试
- [ ] 启动开发服务器: `npm run dev`
- [ ] 测试用户注册
- [ ] 测试用户登录
- [ ] 测试创建笔记
- [ ] 测试编辑笔记
- [ ] 测试删除笔记
- [ ] 测试标签功能
- [ ] 测试分类功能
- [ ] 测试搜索功能
- [ ] 测试AI功能

### 9. 数据验证
- [ ] 打开Prisma Studio: `npm run db:studio`
- [ ] 检查用户数据
- [ ] 检查笔记数据
- [ ] 检查标签数据
- [ ] 检查分类数据
- [ ] 验证关联关系

### 10. 性能测试
- [ ] 测试页面加载速度
- [ ] 测试搜索响应时间
- [ ] 测试大量数据加载
- [ ] 检查网络请求

## 生产部署

### 11. Vercel配置
- [ ] 推送代码到GitHub
- [ ] 在Vercel导入项目
- [ ] 配置环境变量:
  - [ ] `DATABASE_URL`
  - [ ] `DIRECT_URL`
  - [ ] `AUTH_SECRET`
  - [ ] `DEEPSEEK_API_KEY`
  - [ ] `DEEPSEEK_API_URL`
- [ ] 触发部署
- [ ] 测试生产环境

### 12. 安全配置（可选但推荐）
- [ ] 启用Row Level Security (RLS)
- [ ] 配置访问策略
- [ ] 设置API限流
- [ ] 启用SSL连接
- [ ] 配置备份策略

## 后续优化

### 13. 性能优化
- [ ] 添加数据库索引
- [ ] 配置连接池
- [ ] 启用查询缓存
- [ ] 优化慢查询

### 14. 监控设置
- [ ] 设置Supabase监控
- [ ] 配置错误追踪
- [ ] 设置性能监控
- [ ] 配置告警通知

### 15. 高级功能（可选）
- [ ] 启用实时订阅
- [ ] 配置全文搜索
- [ ] 设置定时任务
- [ ] 集成文件存储

## 清理工作

### 16. 清理旧文件
- [ ] 删除 `dev.db` 文件（确认迁移成功后）
- [ ] 删除 `dev.db-journal` 文件
- [ ] 删除 `prisma/migrations` 中的SQLite迁移
- [ ] 更新 `.gitignore`

### 17. 文档更新
- [ ] 更新 README.md
- [ ] 更新部署文档
- [ ] 记录迁移经验
- [ ] 更新团队文档

## 验收标准

### 最终检查
- [ ] 所有功能正常工作
- [ ] 数据完整无丢失
- [ ] 性能满足要求
- [ ] 生产环境稳定运行
- [ ] 团队成员已培训
- [ ] 文档已更新

## 回滚计划

### 如果需要回滚
- [ ] 停止应用
- [ ] 恢复 `schema.prisma` 备份
- [ ] 恢复 `.env.local` 备份
- [ ] 运行 `npx prisma migrate dev`
- [ ] 重启应用
- [ ] 验证功能

## 时间估算

- **准备阶段**: 30分钟
- **配置阶段**: 15分钟
- **迁移阶段**: 30分钟
- **测试阶段**: 1小时
- **部署阶段**: 30分钟
- **总计**: 约3小时

## 注意事项

⚠️ **重要提醒**:
1. 在生产环境迁移前，先在开发环境完整测试
2. 选择低峰时段进行生产迁移
3. 准备好回滚方案
4. 通知用户可能的短暂停机
5. 保留SQLite备份至少一周

## 支持资源

- 📖 详细文档: `SUPABASE_MIGRATION.md`
- 🚀 快速开始: `SUPABASE_QUICKSTART.md`
- 💬 Supabase Discord: https://discord.supabase.com
- 📚 Prisma文档: https://www.prisma.io/docs
- 🐛 问题反馈: GitHub Issues

## 完成标记

迁移完成日期: _______________
迁移负责人: _______________
验收人: _______________

签名: _______________
