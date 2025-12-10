# 🔧 Vercel 部署故障排除指南

## 快速诊断流程

```
部署到 Vercel 后出现问题？
         ↓
    打开浏览器 F12
         ↓
    查看 Console 标签
         ↓
┌────────────────────────────────┐
│  看到什么错误？                  │
└────────────────────────────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌──────────────────┐
│组件空白  │ │ MissingSecret    │
│或闪烁    │ │ 错误             │
└─────────┘ └──────────────────┘
    ↓              ↓
    ↓         📖 紧急修复-AUTH_SECRET.md
    ↓              ↓
    ↓         1. 生成 AUTH_SECRET
    ↓         2. 在 Vercel 配置
    ↓         3. 重新部署
    ↓              ↓
    ↓         ✅ 问题解决
    ↓
📖 QUICK_FIX.md
    ↓
1. 提交代码
2. 配置环境变量
3. 重新部署
    ↓
✅ 问题解决
```

---

## 🚨 错误类型速查表

| 错误信息 | 原因 | 解决方案 | 文档 |
|---------|------|---------|------|
| `MissingSecret: Please define a secret` | 缺少 AUTH_SECRET | 在 Vercel 配置 AUTH_SECRET | [紧急修复-AUTH_SECRET.md](./紧急修复-AUTH_SECRET.md) |
| `Hydration failed` | 服务端/客户端渲染不一致 | 已修复，重新部署 | [修复总结.md](./修复总结.md) |
| 组件空白 | 水合不匹配 | 已修复，重新部署 | [QUICK_FIX.md](./QUICK_FIX.md) |
| `Failed to fetch` | API 路由错误 | 检查环境变量 | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| `Unauthorized` | 认证失败 | 检查 AUTH_SECRET | [VERCEL_AUTH_FIX.md](./VERCEL_AUTH_FIX.md) |
| `Database connection failed` | 数据库连接错误 | 检查 DATABASE_URL | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |
| 500 Internal Server Error | 服务端错误 | 查看 Vercel 日志 | 见下方 |
| 样式丢失 | CSS 未加载 | 检查 Tailwind 配置 | 见下方 |

---

## 📋 按错误类型排查

### 1️⃣ MissingSecret 错误

**症状**：
```
[auth][error] MissingSecret: Please define a `secret`
```

**快速修复**：
1. 生成密钥：`openssl rand -base64 32`
2. Vercel → Settings → Environment Variables
3. 添加 `AUTH_SECRET`
4. 重新部署

**详细文档**：[紧急修复-AUTH_SECRET.md](./紧急修复-AUTH_SECRET.md)

---

### 2️⃣ 组件空白或闪烁

**症状**：
- 页面加载后组件消失
- 组件闪烁后变空白
- 控制台显示 "Hydration failed"

**原因**：
服务端渲染和客户端渲染不一致（水合不匹配）

**解决方案**：
已在代码中修复，只需重新部署：
```bash
git push
```

**详细文档**：
- [QUICK_FIX.md](./QUICK_FIX.md)
- [修复总结.md](./修复总结.md)

---

### 3️⃣ API 调用失败

**症状**：
- Network 标签显示 500 错误
- 数据无法加载
- 控制台显示 "Failed to fetch"

**检查步骤**：

1. **检查环境变量**
   ```bash
   npm run check:env
   ```

2. **验证 Vercel 环境变量**
   - Vercel → Settings → Environment Variables
   - 确认所有必需变量已配置

3. **查看 Vercel 日志**
   - Vercel → Deployments → Functions
   - 查找具体错误信息

4. **测试本地生产构建**
   ```bash
   npm run build
   npm start
   ```

**常见原因**：
- ❌ DATABASE_URL 未配置
- ❌ SUPABASE_SERVICE_ROLE_KEY 错误
- ❌ 数据库连接字符串格式错误

---

### 4️⃣ 数据库连接失败

**症状**：
```
Error: Can't reach database server
PrismaClientInitializationError
```

**检查清单**：

1. **DATABASE_URL 格式**
   ```bash
   # 正确格式（注意端口 6543 和 pgbouncer=true）
   postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:6543/postgres?pgbouncer=true
   ```

2. **DIRECT_URL 格式**
   ```bash
   # 正确格式（注意端口 5432）
   postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
   ```

3. **Supabase 项目状态**
   - 访问 https://supabase.com/dashboard
   - 确认项目正常运行
   - 检查数据库是否暂停

4. **密码正确性**
   - 确认 POSTGRES_PASSWORD 正确
   - 密码中的特殊字符需要 URL 编码

---

### 5️⃣ 认证功能不工作

**症状**：
- 无法登录/注册
- 会话状态丢失
- 重定向循环

**检查步骤**：

1. **AUTH_SECRET 配置**
   ```bash
   # 在 Vercel 检查
   Settings → Environment Variables → AUTH_SECRET
   ```

2. **NextAuth 配置**
   - 检查 `src/auth.ts`
   - 确认 Prisma Adapter 配置正确

3. **数据库表**
   ```bash
   # 确认数据库迁移已执行
   npm run db:push
   ```

4. **Cookie 设置**
   - 检查浏览器是否阻止 Cookie
   - 确认域名配置正确

---

### 6️⃣ 样式丢失或错乱

**症状**：
- 页面显示但没有样式
- 布局混乱
- 颜色/字体不正确

**检查步骤**：

1. **Tailwind 配置**
   ```typescript
   // tailwind.config.ts
   content: [
     './src/**/*.{js,ts,jsx,tsx,mdx}',
   ]
   ```

2. **PostCSS 配置**
   ```javascript
   // postcss.config.mjs
   export default {
     plugins: {
       tailwindcss: {},
     },
   }
   ```

3. **全局样式**
   ```typescript
   // src/app/layout.tsx
   import "./globals.css"
   ```

4. **构建输出**
   ```bash
   npm run build
   # 检查是否有 CSS 相关错误
   ```

---

### 7️⃣ 图片无法加载

**症状**：
- 图片显示为破损图标
- 控制台显示 403 或 404

**解决方案**：

1. **Next.js Image 配置**
   ```typescript
   // next.config.ts
   images: {
     domains: ['your-domain.com'],
   }
   ```

2. **使用正确的路径**
   ```tsx
   // 静态图片
   import Image from 'next/image'
   import logo from '@/public/logo.png'
   
   <Image src={logo} alt="Logo" />
   ```

3. **外部图片**
   ```tsx
   <Image 
     src="https://example.com/image.jpg"
     alt="External"
     width={500}
     height={300}
   />
   ```

---

## 🔍 调试工具和技巧

### 1. 查看 Vercel 构建日志

```
Vercel Dashboard
  → Deployments
  → 选择部署
  → Build Logs
```

查找：
- ❌ 红色错误信息
- ⚠️ 黄色警告
- 📦 依赖安装问题
- 🔨 构建失败原因

### 2. 查看 Vercel 运行时日志

```
Vercel Dashboard
  → Deployments
  → 选择部署
  → Functions
```

查找：
- 🔴 API 路由错误
- 🔴 数据库查询失败
- 🔴 认证错误
- 🔴 未捕获的异常

### 3. 本地测试生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 访问 http://localhost:3000
```

这能发现很多只在生产环境出现的问题。

### 4. 检查环境变量

```bash
# 使用我们的检查脚本
npm run check:env

# 或手动检查
node -e "console.log(process.env.AUTH_SECRET ? '✅' : '❌', 'AUTH_SECRET')"
```

### 5. 浏览器开发者工具

**Console 标签**：
- JavaScript 错误
- 警告信息
- 日志输出

**Network 标签**：
- API 请求状态
- 响应内容
- 加载时间

**Application 标签**：
- Cookie 设置
- LocalStorage
- Session Storage

---

## 📞 获取帮助

### 自助资源

1. **项目文档**
   - [QUICK_FIX.md](./QUICK_FIX.md) - 快速修复
   - [紧急修复-AUTH_SECRET.md](./紧急修复-AUTH_SECRET.md) - AUTH_SECRET 问题
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
   - [修复总结.md](./修复总结.md) - 技术细节

2. **官方文档**
   - [Next.js 文档](https://nextjs.org/docs)
   - [Vercel 文档](https://vercel.com/docs)
   - [NextAuth.js 文档](https://authjs.dev)
   - [Prisma 文档](https://www.prisma.io/docs)

3. **社区支持**
   - [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
   - [Vercel Community](https://vercel.com/community)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

### 提问时提供的信息

为了更快获得帮助，请提供：

1. **错误信息**
   - 完整的错误堆栈
   - 浏览器控制台截图
   - Vercel 日志截图

2. **环境信息**
   - Node.js 版本：`node -v`
   - npm 版本：`npm -v`
   - Next.js 版本：查看 `package.json`

3. **重现步骤**
   - 如何触发错误
   - 预期行为
   - 实际行为

4. **已尝试的解决方案**
   - 列出已经尝试的步骤
   - 每个步骤的结果

---

## ✅ 部署成功检查清单

部署完成后，确认以下所有项目：

- [ ] 网站可以正常访问
- [ ] 所有页面正常显示（无空白）
- [ ] 用户可以注册和登录
- [ ] 笔记可以创建、编辑、删除
- [ ] 搜索功能正常
- [ ] 标签和分类功能正常
- [ ] AI 功能正常（如果配置了）
- [ ] 主题切换正常
- [ ] 响应式布局正常（测试移动端）
- [ ] 浏览器控制台无错误
- [ ] Network 标签无失败请求
- [ ] 页面加载速度正常（< 3 秒）

---

## 🎯 预防性维护

### 定期检查

1. **每周**
   - 检查 Vercel 使用量
   - 查看错误日志
   - 监控性能指标

2. **每月**
   - 更新依赖包
   - 检查安全漏洞
   - 备份数据库

3. **每季度**
   - 轮换 API 密钥
   - 审查环境变量
   - 性能优化

### 监控设置

1. **Vercel Analytics**
   - 启用 Speed Insights
   - 启用 Web Vitals
   - 设置告警

2. **错误追踪**
   - 集成 Sentry
   - 配置错误通知
   - 定期查看报告

3. **正常运行时间监控**
   - 使用 UptimeRobot
   - 设置健康检查
   - 配置告警通知

---

**记住**：大多数部署问题都是环境变量配置不正确导致的。遇到问题时，首先检查环境变量！
