# Vercel 环境变量一键配置脚本 (PowerShell)
# 使用方法: .\vercel-env-setup.ps1

Write-Host "🚀 Vercel 环境变量配置助手" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了 Vercel CLI
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ 未检测到 Vercel CLI" -ForegroundColor Red
    Write-Host "请先安装: npm install -g vercel" -ForegroundColor Yellow
    Write-Host "或手动在 Vercel Dashboard 配置环境变量" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 检测到 Vercel CLI" -ForegroundColor Green
Write-Host ""

# 检查是否已登录
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "请先登录 Vercel:" -ForegroundColor Yellow
    vercel login
}

Write-Host "📋 开始配置环境变量..." -ForegroundColor Cyan
Write-Host ""

# 检查 .env.local 文件
if (-not (Test-Path .env.local)) {
    Write-Host "❌ 未找到 .env.local 文件" -ForegroundColor Red
    Write-Host "请先创建 .env.local 文件并配置环境变量" -ForegroundColor Yellow
    exit 1
}

# 读取并设置环境变量
Get-Content .env.local | ForEach-Object {
    $line = $_.Trim()
    
    # 跳过注释和空行
    if ($line -match '^#' -or $line -eq '') {
        return
    }
    
    # 解析键值对
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
        
        Write-Host "⚙️  设置 $key..." -ForegroundColor Yellow
        
        # 尝试添加环境变量
        $value | vercel env add $key production preview development 2>$null
        
        if ($LASTEXITCODE -ne 0) {
            # 如果失败，先删除再添加
            vercel env rm $key production preview development -y 2>$null
            $value | vercel env add $key production preview development
        }
    }
}

Write-Host ""
Write-Host "✅ 环境变量配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步:" -ForegroundColor Cyan
Write-Host "1. 运行 'vercel' 或 'git push' 触发重新部署"
Write-Host "2. 等待部署完成（约 2-3 分钟）"
Write-Host "3. 访问你的网站验证"
Write-Host ""
Write-Host "💡 提示: 你也可以在 Vercel Dashboard 手动验证环境变量" -ForegroundColor Yellow
Write-Host "   https://vercel.com/dashboard → 项目 → Settings → Environment Variables"
