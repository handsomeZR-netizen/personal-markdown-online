# 生成 NEXTAUTH_SECRET
# 运行: powershell -ExecutionPolicy Bypass -File scripts/generate-secret.ps1

Write-Host "🔐 生成 NEXTAUTH_SECRET..." -ForegroundColor Cyan
Write-Host ""

$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

Write-Host "✅ 生成成功！" -ForegroundColor Green
Write-Host ""
Write-Host "你的 NEXTAUTH_SECRET:" -ForegroundColor Yellow
Write-Host $secret -ForegroundColor White
Write-Host ""
Write-Host "📋 复制这个值并添加到:" -ForegroundColor Cyan
Write-Host "  1. Vercel 环境变量" -ForegroundColor Gray
Write-Host "  2. .env.local (本地开发)" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  注意: 生产环境和开发环境应该使用不同的密钥！" -ForegroundColor Yellow
