# 安全实现文档

本文档描述了笔记管理平台中实现的安全功能和最佳实践。

## 1. 数据验证 (Data Validation)

### 1.1 客户端验证
- 使用 Zod schema 在客户端验证所有表单输入
- 使用 react-hook-form 与 Zod 集成
- 实时显示验证错误消息

### 1.2 服务端验证
- 所有 server actions 都包含服务端验证
- 使用相同的 Zod schemas 确保一致性
- 详细的错误消息和字段级错误

### 1.3 验证 Schemas
创建的验证 schemas：
- `auth.ts` - 登录和注册验证
- `notes.ts` - 笔记 CRUD 操作验证
- `tags.ts` - 标签操作验证
- `categories.ts` - 分类操作验证
- `ai.ts` - AI 功能验证

### 1.4 验证工具
- `validateData()` - 统一的验证函数
- `sanitizeString()` - 清理字符串输入
- `isValidCuid()` - 验证 CUID 格式
- `isValidEmail()` - 验证邮箱格式
- `validateIds()` - 批量验证 ID

## 2. 权限检查 (Authorization)

### 2.1 认证中间件
- 使用 NextAuth 进行用户认证
- 保护所有需要登录的路由
- 自动重定向未认证用户

### 2.2 路由保护
受保护的路由：
- `/dashboard` - 仪表板
- `/notes` - 笔记管理
- `/ai` - AI 功能

### 2.3 资源级权限
- 用户只能访问自己的笔记
- 所有 CRUD 操作都验证所有权
- 防止未授权的数据访问

### 2.4 授权工具函数
- `getCurrentUser()` - 获取当前用户
- `canAccessNote()` - 验证笔记访问权限
- `canModifyNote()` - 验证笔记修改权限
- `canDeleteNote()` - 验证笔记删除权限
- `requireAuth()` - 要求用户已认证
- `requireNoteAccess()` - 要求笔记访问权限

## 3. XSS 防护 (XSS Prevention)

### 3.1 Markdown 渲染安全
- 使用 `react-markdown` 安全渲染 Markdown
- 禁用危险的 HTML 元素（script, iframe, object, embed）
- 清理 Markdown 内容
- 安全处理链接（只允许 http/https）

### 3.2 内容清理
- `sanitizeHtml()` - 清理 HTML 内容
- `escapeHtml()` - 转义 HTML 特殊字符
- `sanitizeMarkdown()` - 清理 Markdown 内容
- `isSafeMarkdown()` - 验证 Markdown 安全性

### 3.3 URL 安全
- `isSafeUrl()` - 验证 URL 安全性
- 只允许 http 和 https 协议
- 检测危险的 URL 模式

## 4. 注入攻击防护 (Injection Prevention)

### 4.1 SQL 注入防护
- 使用 Prisma ORM 的参数化查询
- 不使用原始 SQL 查询
- 所有数据库操作都通过 Prisma Client

### 4.2 输入清理
- `sanitizeInput()` - 清理用户输入
- 移除特殊字符和控制字符
- 转义潜在的危险字符

## 5. 安全响应头 (Security Headers)

在中间件中设置的安全响应头：

### 5.1 Content Security Policy (CSP)
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

### 5.2 其他安全头
- `X-Frame-Options: DENY` - 防止点击劫持
- `X-Content-Type-Options: nosniff` - 防止 MIME 类型嗅探
- `X-XSS-Protection: 1; mode=block` - 启用浏览器 XSS 过滤
- `Referrer-Policy: strict-origin-when-cross-origin` - 控制 Referrer 信息
- `Permissions-Policy` - 控制浏览器功能
- `Strict-Transport-Security` - 强制 HTTPS（生产环境）

## 6. 其他安全功能

### 6.1 密码安全
- 使用 bcrypt 加密密码
- 密码强度要求：至少 6 个字符，包含大小写字母和数字
- 安全的密码比较

### 6.2 会话管理
- 使用 JWT 策略
- 会话有效期：30 天
- 安全的会话存储

### 6.3 频率限制
- `RateLimiter` 类用于限制请求频率
- 防止暴力攻击和 DoS 攻击

### 6.4 文件安全
- `isSafeFilename()` - 验证文件名安全性
- 防止路径遍历攻击
- 检测危险字符

### 6.5 随机令牌生成
- `generateSecureToken()` - 生成安全的随机字符串
- 使用 crypto API 生成加密安全的随机数

## 7. 安全最佳实践

### 7.1 输入验证
✅ 所有用户输入都经过验证
✅ 客户端和服务端双重验证
✅ 使用类型安全的验证库（Zod）

### 7.2 输出编码
✅ 使用安全的渲染库（react-markdown）
✅ 自动转义 HTML 特殊字符
✅ 清理危险内容

### 7.3 认证和授权
✅ 使用成熟的认证库（NextAuth）
✅ 实施细粒度的权限控制
✅ 验证所有资源访问

### 7.4 数据保护
✅ 使用 HTTPS（生产环境）
✅ 加密敏感数据（密码）
✅ 安全的会话管理

### 7.5 错误处理
✅ 不泄露敏感信息
✅ 记录安全相关错误
✅ 友好的错误消息

## 8. 安全检查清单

- [x] 实现完整的表单验证（客户端和服务端）
- [x] 在所有 server actions 中验证用户身份
- [x] 确保用户只能访问自己的笔记
- [x] 实现中间件路由保护
- [x] 确保 Markdown 渲染安全
- [x] 验证所有用户输入
- [x] 使用 Prisma 参数化查询
- [x] 添加安全响应头
- [x] 实现密码加密
- [x] 实现会话管理

## 9. 未来改进建议

1. **增强的频率限制**
   - 集成 Redis 实现分布式频率限制
   - 针对不同操作设置不同的限制

2. **审计日志**
   - 记录所有安全相关事件
   - 实现日志分析和告警

3. **双因素认证 (2FA)**
   - 添加 TOTP 支持
   - 短信验证码

4. **更严格的 CSP**
   - 移除 unsafe-inline 和 unsafe-eval
   - 使用 nonce 或 hash

5. **安全扫描**
   - 定期进行安全审计
   - 使用自动化安全扫描工具

6. **API 速率限制**
   - 实现更细粒度的 API 限制
   - 防止 API 滥用

## 10. 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [Zod Documentation](https://zod.dev/)
