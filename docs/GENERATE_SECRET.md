# 🔐 生成 NEXTAUTH_SECRET

## 方法 1: 使用脚本（推荐）

在项目目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-secret.ps1
```

## 方法 2: 手动运行命令

### Windows PowerShell

打开 PowerShell 并运行：

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Mac/Linux

打开终端并运行：

```bash
openssl rand -base64 32
```

## 方法 3: 在线生成

访问这些网站生成随机密钥：

- https://generate-secret.vercel.app/32
- https://www.random.org/strings/

## 📋 使用生成的密钥

### 本地开发

添加到 `.env.local`:

```env
NEXTAUTH_SECRET=你生成的密钥
```

### Vercel 部署

在 Vercel Dashboard 添加环境变量：

1. 进入项目设置
2. 点击 "Environment Variables"
3. 添加:
   - Name: `NEXTAUTH_SECRET`
   - Value: `你生成的密钥`
   - Environment: `Production`, `Preview`, `Development`

## ⚠️ 重要提示

1. **不要共享密钥** - 这是敏感信息
2. **不要提交到 Git** - `.env.local` 已在 `.gitignore` 中
3. **生产环境使用不同密钥** - 不要在生产环境使用开发环境的密钥
4. **定期更换** - 建议定期更换密钥以提高安全性

## 🎯 示例

你刚才生成的密钥：

```
MrMXuBXMcydOOuxxC2rE6O+PI04iu6/B67R0khPRbz0=
```

**用于**: Vercel 生产环境

**如果需要本地开发密钥**，再运行一次脚本生成新的。

## 📚 相关文档

- [NextAuth 文档](https://next-auth.js.org/configuration/options#secret)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

---

**安全第一！** 🔒
