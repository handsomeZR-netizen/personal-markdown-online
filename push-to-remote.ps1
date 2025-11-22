# Git 推送脚本
# 用于在网络恢复后推送代码到远程仓库

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Git 推送脚本" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否有未提交的更改
Write-Host "检查 Git 状态..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "当前分支信息:" -ForegroundColor Yellow
git branch -vv

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "尝试推送到远程仓库..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 方法 1: 标准推送
Write-Host "方法 1: 标准 HTTPS 推送" -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ 推送成功！" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "方法 1 失败，尝试方法 2..." -ForegroundColor Yellow
Write-Host ""

# 方法 2: 使用代理推送
Write-Host "方法 2: 使用代理推送 (127.0.0.1:7897)" -ForegroundColor Green
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ 推送成功！" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "方法 2 失败，尝试方法 3..." -ForegroundColor Yellow
Write-Host ""

# 方法 3: 尝试其他代理端口
Write-Host "方法 3: 使用代理推送 (127.0.0.1:7890)" -ForegroundColor Green
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ 推送成功！" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Red
Write-Host "所有推送方法都失败了" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Red
Write-Host ""
Write-Host "可能的原因:" -ForegroundColor Yellow
Write-Host "1. 网络连接问题" -ForegroundColor White
Write-Host "2. 代理未运行或端口不正确" -ForegroundColor White
Write-Host "3. GitHub 服务不可用" -ForegroundColor White
Write-Host ""
Write-Host "建议的解决方案:" -ForegroundColor Yellow
Write-Host "1. 检查网络连接" -ForegroundColor White
Write-Host "2. 确保代理软件（Clash/V2Ray）正在运行" -ForegroundColor White
Write-Host "3. 尝试使用手机热点" -ForegroundColor White
Write-Host "4. 使用 GitHub Desktop 推送" -ForegroundColor White
Write-Host ""
Write-Host "待推送的提交:" -ForegroundColor Yellow
git log origin/main..HEAD --oneline

Write-Host ""
Write-Host "稍后可以重新运行此脚本: .\push-to-remote.ps1" -ForegroundColor Cyan

exit 1
