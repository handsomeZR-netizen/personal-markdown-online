# Google Cloud 部署指南

本文档介绍如何将 Note App 部署到 Google Cloud Platform (GCP)。

## 部署方案选择

| 方案 | 适用场景 | 成本 | 复杂度 |
|------|----------|------|--------|
| Cloud Run | 推荐，自动扩缩容 | 按使用付费 | ⭐⭐ |
| App Engine | 简单部署 | 按使用付费 | ⭐ |
| GKE (Kubernetes) | 大规模生产 | 较高 | ⭐⭐⭐⭐ |
| Compute Engine | 完全控制 | 固定费用 | ⭐⭐⭐ |

本指南主要介绍 **Cloud Run** 方案（推荐）。

---

## 前置准备

### 1. 安装 Google Cloud CLI

```bash
# Windows (PowerShell)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
```

### 2. 初始化 gcloud

```bash
gcloud init
gcloud auth login
```

### 3. 创建 GCP 项目

```bash
# 创建项目
gcloud projects create note-app-prod --name="Note App Production"

# 设置当前项目
gcloud config set project note-app-prod

# 启用计费（需要在控制台完成）
# https://console.cloud.google.com/billing
```

### 4. 启用必要的 API

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com
```

---

## 方案一：Cloud Run 部署（推荐）

### 步骤 1：创建 Dockerfile

在 `note-app/` 目录下创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 步骤 2：更新 next.config.ts

添加 `output: 'standalone'` 配置：

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // 添加这行
  // ... 其他配置
};
```

### 步骤 3：创建 .dockerignore

```
node_modules
.next
.git
*.md
.env*
!.env.production.example
```

### 步骤 4：设置 Cloud SQL (PostgreSQL)

```bash
# 创建 Cloud SQL 实例
gcloud sql instances create note-app-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-east1 \
  --root-password=YOUR_SECURE_PASSWORD

# 创建数据库
gcloud sql databases create noteapp --instance=note-app-db

# 创建用户
gcloud sql users create noteapp_user \
  --instance=note-app-db \
  --password=YOUR_USER_PASSWORD
```

### 步骤 5：配置 Secret Manager

```bash
# 创建密钥
echo -n "your-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "your-auth-secret" | gcloud secrets create AUTH_SECRET --data-file=-
echo -n "postgresql://noteapp_user:PASSWORD@/noteapp?host=/cloudsql/PROJECT:REGION:INSTANCE" | \
  gcloud secrets create DATABASE_URL --data-file=-
```

### 步骤 6：构建并推送镜像

```bash
# 配置 Docker 认证
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 创建 Artifact Registry 仓库
gcloud artifacts repositories create note-app \
  --repository-format=docker \
  --location=asia-east1

# 构建镜像
docker build -t asia-east1-docker.pkg.dev/note-app-prod/note-app/web:latest .

# 推送镜像
docker push asia-east1-docker.pkg.dev/note-app-prod/note-app/web:latest
```

或使用 Cloud Build：

```bash
gcloud builds submit --tag asia-east1-docker.pkg.dev/note-app-prod/note-app/web:latest
```

### 步骤 7：部署到 Cloud Run

```bash
gcloud run deploy note-app \
  --image=asia-east1-docker.pkg.dev/note-app-prod/note-app/web:latest \
  --platform=managed \
  --region=asia-east1 \
  --allow-unauthenticated \
  --add-cloudsql-instances=note-app-prod:asia-east1:note-app-db \
  --set-env-vars="DATABASE_MODE=local,NEXTAUTH_URL=https://YOUR_CLOUD_RUN_URL" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,AUTH_SECRET=AUTH_SECRET:latest" \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10
```

### 步骤 8：运行数据库迁移

```bash
# 使用 Cloud Run Jobs 运行迁移
gcloud run jobs create db-migrate \
  --image=asia-east1-docker.pkg.dev/note-app-prod/note-app/web:latest \
  --region=asia-east1 \
  --add-cloudsql-instances=note-app-prod:asia-east1:note-app-db \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest" \
  --command="npx" \
  --args="prisma,migrate,deploy"

gcloud run jobs execute db-migrate --region=asia-east1
```

---

## 方案二：使用 Supabase 作为数据库

如果你已经在使用 Supabase，可以直接连接：

### 环境变量配置

```bash
gcloud run deploy note-app \
  --image=asia-east1-docker.pkg.dev/note-app-prod/note-app/web:latest \
  --platform=managed \
  --region=asia-east1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_MODE=supabase,NEXTAUTH_URL=https://YOUR_URL" \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DIRECT_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,NEXT_PUBLIC_SUPABASE_URL=SUPABASE_URL:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_KEY:latest" \
  --memory=1Gi
```

---

## 配置自定义域名

### 1. 验证域名所有权

```bash
gcloud domains verify your-domain.com
```

### 2. 映射域名到 Cloud Run

```bash
gcloud run domain-mappings create \
  --service=note-app \
  --domain=your-domain.com \
  --region=asia-east1
```

### 3. 配置 DNS

在你的 DNS 提供商处添加 CNAME 记录：
- 类型: CNAME
- 名称: @ 或 www
- 值: ghs.googlehosted.com

---

## CI/CD 自动部署

### 使用 Cloud Build

创建 `cloudbuild.yaml`：

```yaml
steps:
  # 构建镜像
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'asia-east1-docker.pkg.dev/$PROJECT_ID/note-app/web:$COMMIT_SHA'
      - '-t'
      - 'asia-east1-docker.pkg.dev/$PROJECT_ID/note-app/web:latest'
      - '.'

  # 推送镜像
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'asia-east1-docker.pkg.dev/$PROJECT_ID/note-app/web:$COMMIT_SHA'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'asia-east1-docker.pkg.dev/$PROJECT_ID/note-app/web:latest'

  # 部署到 Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'note-app'
      - '--image=asia-east1-docker.pkg.dev/$PROJECT_ID/note-app/web:$COMMIT_SHA'
      - '--region=asia-east1'
      - '--platform=managed'

images:
  - 'asia-east1-docker.pkg.dev/$PROJECT_ID/note-app/web:$COMMIT_SHA'
  - 'asia-east1-docker.pkg.dev/$PROJECT_ID/note-app/web:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

### 设置触发器

```bash
gcloud builds triggers create github \
  --repo-name=note-app \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

---

## 监控与日志

### 查看日志

```bash
gcloud run services logs read note-app --region=asia-east1
```

### 设置告警

```bash
# 创建错误率告警
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Cloud Run Error Rate" \
  --condition-display-name="Error rate > 1%" \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count"'
```

---

## 成本优化

### 1. 设置最小实例为 0
```bash
gcloud run services update note-app --min-instances=0 --region=asia-east1
```

### 2. 使用 Cloud SQL 自动暂停
对于开发环境，可以配置实例在空闲时自动暂停。

### 3. 设置预算告警
在 GCP Console > Billing > Budgets 中设置预算告警。

---

## 常见问题

### Q: 冷启动时间太长？
A: 设置 `--min-instances=1` 保持至少一个实例运行。

### Q: 数据库连接失败？
A: 确保 Cloud Run 服务账号有 Cloud SQL Client 角色：
```bash
gcloud projects add-iam-policy-binding note-app-prod \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/cloudsql.client"
```

### Q: 如何查看构建日志？
A: 
```bash
gcloud builds list
gcloud builds log BUILD_ID
```

---

## 相关资源

- [Cloud Run 文档](https://cloud.google.com/run/docs)
- [Cloud SQL 文档](https://cloud.google.com/sql/docs)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Cloud SQL 连接](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-google-cloud-sql)
