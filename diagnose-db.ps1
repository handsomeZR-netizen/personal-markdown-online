# PostgreSQL 连接诊断脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL 连接诊断" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. 检查 PostgreSQL 服务状态
Write-Host "1. 检查 PostgreSQL 服务状态..." -ForegroundColor Yellow
$service = Get-Service -Name postgresql* -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "   ✅ 服务名称: $($service.Name)" -ForegroundColor Green
    Write-Host "   ✅ 状态: $($service.Status)" -ForegroundColor Green
} else {
    Write-Host "   ❌ 未找到 PostgreSQL 服务" -ForegroundColor Red
}

# 2. 检查端口 5432
Write-Host "`n2. 检查端口 5432..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "   ✅ 端口 5432 正在监听" -ForegroundColor Green
} else {
    Write-Host "   ❌ 端口 5432 未监听" -ForegroundColor Red
}

# 3. 显示环境变量
Write-Host "`n3. 当前数据库配置..." -ForegroundColor Yellow
if (Test-Path .env) {
    $dbUrl = Select-String -Path .env -Pattern "^DATABASE_URL=" | Select-Object -First 1
    if ($dbUrl) {
        Write-Host "   DATABASE_URL: $($dbUrl.Line)" -ForegroundColor Cyan
    }
}

# 4. 测试连接建议
Write-Host "`n4. 测试连接步骤..." -ForegroundColor Yellow
Write-Host "   请尝试以下命令测试连接:" -ForegroundColor White
Write-Host "   psql -U postgres -d postgres" -ForegroundColor Cyan
Write-Host "`n   如果提示输入密码，请输入你的 PostgreSQL 密码" -ForegroundColor White
Write-Host "   如果连接成功，运行以下 SQL 创建数据库:" -ForegroundColor White
Write-Host "   CREATE DATABASE noteapp;" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "诊断完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
