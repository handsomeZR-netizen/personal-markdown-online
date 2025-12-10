# Vercel 部署指南

## 问题诊断

如果你在 Vercel 部署后看到组件空白，通常是以下原因：

### 1. 水合不匹配（Hydration Mismatch）
- **原因**：服务端渲染的 HTML 与客户端初始渲染不一致
- **症状**：组件在本地正常，部署后空白或闪烁
- **已修复**：添加了 `mounted` 状态来避免水合不匹配

### 2. 环境变量未配置
- **原因**：`.env` 文件不会自动上传到 Vercel
- **症状**：API 调用失败，数据库连接失败
- **解决方案**：在 Vercel 控制台手动配置

## 必须在 Vercel 配置的环境变量

登录 Vercel → 选择项目 → Settings → Environment Variables，添加以下变量：

### 认证相关
```
AUTH_SECRET=TPa9haEef5cCxxfX5Lm+aZEwY3r1q4gh+3eBvsB+Dvs=
```

### Supabase 配置（公开变量）
```
NEXT_PUBLIC_SUPABASE_URL=https://llroqdgpohslhfejwxrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase 私密配置
```
SUPABASE_JWT_SECRET=ED+YLxLQJiDyejzNiFwQgCqjilGD1RLj6hVTceIEoLJVlQSFhk0+vEp2DpOdMHJpAnlMAJs1RE311txVW/V/jQ==
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 数据库连接
```
DATABASE_URL=postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:151692483515156555878@db.llroqdgpohslhfejwxrn.supabase.co:5432/postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=151692483515156555878
```

### AI API（可选）
```
DEEPSEEK_API_KEY=sk-4e3d7bb175a44822a032aab2a0fa105f
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

## 部署检查清单

- [ ] 所有环境变量已在 Vercel 配置
- [ ] 数据库迁移已执行（如果需要）
- [ ] 检查 Vercel 构建日志是否有错误
- [ ] 检查浏览器控制台是否有 JavaScript 错误
- [ ] 检查网络请求是否失败（F12 → Network）

## 常见问题

### Q: 组件显示空白但没有错误
**A**: 检查浏览器控制台是否有 "Hydration failed" 错误。已通过添加 `mounted` 状态修复。

### Q: API 调用返回 500 错误
**A**: 检查环境变量是否正确配置，特别是数据库连接字符串。

### Q: 样式丢失或错乱
**A**: 确保 Tailwind CSS 配置正确，检查 `postcss.config.mjs` 和 `tailwind.config.ts`。

### Q: 图片无法加载
**A**: 检查 `next.config.ts` 中的图片域名配置。

## 调试步骤

1. **查看 Vercel 构建日志**
   - 登录 Vercel → 选择部署 → 查看 Build Logs

2. **查看运行时日志**
   - Vercel → Deployments → 选择部署 → Functions 标签

3. **本地测试生产构建**
   ```bash
   npm run build
   npm start
   ```

4. **检查环境变量**
   ```bash
   # 在 Vercel CLI 中
   vercel env pull
   ```

## 性能优化建议

1. **启用 ISR（增量静态再生成）**
   - 对于不经常变化的页面使用 `revalidate`

2. **图片优化**
   - 使用 Next.js Image 组件
   - 配置适当的图片尺寸

3. **代码分割**
   - 使用动态导入 `next/dynamic`
   - 懒加载非关键组件

4. **缓存策略**
   - 配置适当的 Cache-Control 头
   - 使用 Vercel Edge Network

## 安全注意事项

⚠️ **重要**：不要将 `.env` 文件提交到 Git！

- 确保 `.env` 在 `.gitignore` 中
- 使用 Vercel 环境变量管理敏感信息
- 定期轮换 API 密钥和数据库密码
- 使用不同的密钥用于开发和生产环境
