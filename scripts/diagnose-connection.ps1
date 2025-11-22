# Supabase Database Connection Diagnostic Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Supabase Connection Diagnostic" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$supabaseHost = "db.llroqdgpohslhfejwxrn.supabase.co"

# Test DNS
Write-Host "1. Testing DNS resolution..." -ForegroundColor Yellow
try {
    $dns = Resolve-DnsName -Name $supabaseHost -ErrorAction Stop
    Write-Host "   [OK] DNS resolved" -ForegroundColor Green
}
catch {
    Write-Host "   [FAIL] DNS failed" -ForegroundColor Red
}

Write-Host ""

# Test Port 5432
Write-Host "2. Testing port 5432 (Direct)..." -ForegroundColor Yellow
$test5432 = Test-NetConnection -ComputerName $supabaseHost -Port 5432 -WarningAction SilentlyContinue

if ($test5432.TcpTestSucceeded) {
    Write-Host "   [OK] Port 5432 accessible" -ForegroundColor Green
}
else {
    Write-Host "   [FAIL] Port 5432 not accessible" -ForegroundColor Red
}

Write-Host ""

# Test Port 6543
Write-Host "3. Testing port 6543 (Pooler)..." -ForegroundColor Yellow
$test6543 = Test-NetConnection -ComputerName $supabaseHost -Port 6543 -WarningAction SilentlyContinue

if ($test6543.TcpTestSucceeded) {
    Write-Host "   [OK] Port 6543 accessible" -ForegroundColor Green
}
else {
    Write-Host "   [FAIL] Port 6543 not accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Result" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check results
$bothFailed = (-not $test5432.TcpTestSucceeded) -and (-not $test6543.TcpTestSucceeded)

if ($bothFailed) {
    Write-Host "[!] Both ports are not accessible" -ForegroundColor Red
    Write-Host ""
    Write-Host "Most likely cause:" -ForegroundColor Yellow
    Write-Host "  - Database is PAUSED (free tier pauses after 7 days)" -ForegroundColor White
    Write-Host ""
    Write-Host "Solution:" -ForegroundColor Green
    Write-Host "  1. Visit: https://supabase.com/dashboard/project/llroqdgpohslhfejwxrn" -ForegroundColor Cyan
    Write-Host "  2. Click 'Resume' if status shows 'Paused'" -ForegroundColor Cyan
    Write-Host "  3. Wait 1-2 minutes" -ForegroundColor Cyan
    Write-Host "  4. Run: npm run db:test" -ForegroundColor Cyan
}
else {
    Write-Host "[OK] Database appears to be active" -ForegroundColor Green
    Write-Host ""
    Write-Host "If still can't connect, check:" -ForegroundColor Yellow
    Write-Host "  - Database password" -ForegroundColor White
    Write-Host "  - .env file loading" -ForegroundColor White
}

Write-Host ""
