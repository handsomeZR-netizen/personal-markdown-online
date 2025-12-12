# deploy-collab.ps1 - 协作服务部署脚本 (Windows PowerShell)
# 使用方法: .\scripts\deploy-collab.ps1 -Platform fly|render|docker

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("fly", "render", "docker")]
    [string]$Platform,
    
    [string]$DatabaseUrl,
    [string]$CollabSecret,
    [string]$AllowedOrigins = "https://xzr5.top"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  协作服务部署脚本" -ForegroundColor Cyan
Write-Host "  平台: $Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 生成密钥（如果未提供）
if (-not $CollabSecret) {
    $CollabSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
    Write-Host "`n生成的 COLLAB_SERVER_SECRET:" -ForegroundColor Yellow
    Write-Host $CollabSecret -ForegroundColor Green
    Write-Host "请保存此密钥，并在 Vercel 中设置相同的值！`n" -ForegroundColor Yellow
}

switch ($Platform) {
    "fly" {
        Write-Host "`n[Fly.io 部署]" -ForegroundColor Magenta
        
        # 检查 fly CLI
        if (-not (Get-Command fly -ErrorAction SilentlyContinue)) {
            Write-Host "安装 Fly CLI..." -ForegroundColor Yellow
            iwr https://fly.io/install.ps1 -useb | iex
        }
        
        # 登录检查
        Write-Host "检查 Fly.io 登录状态..." -ForegroundColor Yellow
        fly auth whoami 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "请先登录 Fly.io..." -ForegroundColor Yellow
            fly auth login
        }
        
        # 创建应用（如果不存在）
        Write-Host "创建/检查应用..." -ForegroundColor Yellow
        fly apps create noteapp-collab 2>$null
        
        # 设置 secrets
        if ($DatabaseUrl) {
            Write-Host "设置环境变量..." -ForegroundColor Yellow
            fly secrets set `
                DATABASE_URL="$DatabaseUrl" `
                COLLAB_SERVER_SECRET="$CollabSecret" `
                COLLAB_ALLOWED_ORIGINS="$AllowedOrigins"
        } else {
            Write-Host "警告: 未提供 DATABASE_URL，请手动设置:" -ForegroundColor Yellow
            Write-Host "fly secrets set DATABASE_URL=`"your-neon-url`"" -ForegroundColor Gray
        }
        
        # 部署
        Write-Host "开始部署..." -ForegroundColor Yellow
        fly deploy --dockerfile Dockerfile.collab
        
        # 显示状态
        Write-Host "`n部署完成！" -ForegroundColor Green
        fly status
        
        Write-Host "`n下一步:" -ForegroundColor Cyan
        Write-Host "1. 添加自定义域名: fly certs add collab.xzr5.top"
        Write-Host "2. 配置 DNS CNAME: collab -> noteapp-collab.fly.dev"
        Write-Host "3. 在 Vercel 设置 NEXT_PUBLIC_COLLAB_SERVER_URL=wss://collab.xzr5.top"
    }
    
    "render" {
        Write-Host "`n[Render 部署]" -ForegroundColor Magenta
        Write-Host "Render 需要通过 Web Dashboard 部署:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. 访问 https://dashboard.render.com" -ForegroundColor White
        Write-Host "2. New -> Web Service -> 连接 GitHub 仓库" -ForegroundColor White
        Write-Host "3. 选择 Docker 环境" -ForegroundColor White
        Write-Host "4. Dockerfile Path: ./Dockerfile.collab" -ForegroundColor White
        Write-Host "5. 设置环境变量:" -ForegroundColor White
        Write-Host "   DATABASE_URL = $DatabaseUrl" -ForegroundColor Gray
        Write-Host "   COLLAB_SERVER_SECRET = $CollabSecret" -ForegroundColor Gray
        Write-Host "   COLLAB_ALLOWED_ORIGINS = $AllowedOrigins" -ForegroundColor Gray
        Write-Host "6. 部署" -ForegroundColor White
        Write-Host ""
        Write-Host "或者使用 render.yaml 自动配置（Blueprint）" -ForegroundColor Cyan
    }
    
    "docker" {
        Write-Host "`n[Docker 自托管部署]" -ForegroundColor Magenta
        
        # 创建 .env.collab 文件
        $envContent = @"
# 协作服务环境变量
DATABASE_URL=$DatabaseUrl
COLLAB_SERVER_SECRET=$CollabSecret
COLLAB_ALLOWED_ORIGINS=$AllowedOrigins
"@
        
        if ($DatabaseUrl) {
            $envContent | Out-File -FilePath ".env.collab" -Encoding utf8
            Write-Host "已创建 .env.collab 文件" -ForegroundColor Green
        } else {
            Write-Host "请创建 .env.collab 文件，参考 .env.collab.example" -ForegroundColor Yellow
        }
        
        # 构建并启动
        Write-Host "构建 Docker 镜像..." -ForegroundColor Yellow
        docker-compose -f docker-compose.collab.yml build
        
        Write-Host "启动服务..." -ForegroundColor Yellow
        docker-compose -f docker-compose.collab.yml up -d
        
        Write-Host "`n服务状态:" -ForegroundColor Cyan
        docker-compose -f docker-compose.collab.yml ps
        
        Write-Host "`n下一步:" -ForegroundColor Cyan
        Write-Host "1. 确保 Caddyfile 中的域名正确"
        Write-Host "2. 配置 DNS A 记录指向服务器 IP"
        Write-Host "3. 查看日志: docker-compose -f docker-compose.collab.yml logs -f collab"
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  重要提醒" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. 在 Vercel 设置以下环境变量:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_COLLAB_SERVER_URL = wss://collab.xzr5.top" -ForegroundColor Gray
Write-Host "   COLLAB_SERVER_SECRET = $CollabSecret" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 重新部署 Vercel 以应用变量:" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Gray
