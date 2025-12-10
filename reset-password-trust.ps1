# Automated password reset using trust authentication
# Run as Administrator

$newPassword = "xzr1234567."
$pgDataPath = "C:\Program Files\PostgreSQL\17\data"
$pgHbaFile = Join-Path $pgDataPath "pg_hba.conf"
$backupFile = Join-Path $pgDataPath "pg_hba.conf.backup"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Automated PostgreSQL Password Reset" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor White
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor White
    Write-Host "3. Navigate to: $PWD" -ForegroundColor Cyan
    Write-Host "4. Run: .\reset-password-trust.ps1`n" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Running as Administrator`n" -ForegroundColor Green

# Step 1: Backup pg_hba.conf
Write-Host "Step 1: Backing up pg_hba.conf..." -ForegroundColor Yellow
if (Test-Path $pgHbaFile) {
    Copy-Item $pgHbaFile $backupFile -Force
    Write-Host "✅ Backup created: $backupFile`n" -ForegroundColor Green
} else {
    Write-Host "❌ pg_hba.conf not found at: $pgHbaFile" -ForegroundColor Red
    Write-Host "Please check your PostgreSQL installation path`n" -ForegroundColor Yellow
    exit 1
}

# Step 2: Modify pg_hba.conf to use trust
Write-Host "Step 2: Modifying pg_hba.conf to use 'trust' authentication..." -ForegroundColor Yellow
$content = Get-Content $pgHbaFile
$newContent = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)\w+', '$1trust' `
                       -replace '(host\s+all\s+all\s+::1/128\s+)\w+', '$1trust'
Set-Content $pgHbaFile $newContent
Write-Host "✅ pg_hba.conf modified`n" -ForegroundColor Green

# Step 3: Restart PostgreSQL
Write-Host "Step 3: Restarting PostgreSQL service..." -ForegroundColor Yellow
$service = Get-Service -Name postgresql* | Select-Object -First 1
if ($service) {
    Restart-Service $service.Name -Force
    Start-Sleep -Seconds 3
    Write-Host "✅ PostgreSQL restarted`n" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL service not found`n" -ForegroundColor Red
    exit 1
}

# Step 4: Reset password
Write-Host "Step 4: Resetting password..." -ForegroundColor Yellow
$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"
$tempSqlFile = "temp_reset.sql"
Set-Content -Path $tempSqlFile -Value $sqlCommand

try {
    $result = psql -U postgres -d postgres -f $tempSqlFile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Password reset successful!`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Password reset failed: $result`n" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_`n" -ForegroundColor Red
}

Remove-Item $tempSqlFile -ErrorAction SilentlyContinue

# Step 5: Restore pg_hba.conf
Write-Host "Step 5: Restoring pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $backupFile $pgHbaFile -Force
Write-Host "✅ pg_hba.conf restored`n" -ForegroundColor Green

# Step 6: Restart PostgreSQL again
Write-Host "Step 6: Restarting PostgreSQL with original settings..." -ForegroundColor Yellow
Restart-Service $service.Name -Force
Start-Sleep -Seconds 3
Write-Host "✅ PostgreSQL restarted`n" -ForegroundColor Green

# Step 7: Test connection
Write-Host "Step 7: Testing connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $newPassword
$testResult = psql -U postgres -d postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connection test successful!`n" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Password Reset Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "New password: $newPassword" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Run: npm run db:push" -ForegroundColor Cyan
    Write-Host "2. Run: npm run db:seed" -ForegroundColor Cyan
    Write-Host "3. Run: npm run dev`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Connection test failed" -ForegroundColor Yellow
    Write-Host "Please try connecting manually: psql -U postgres`n" -ForegroundColor White
}

Remove-Item $env:PGPASSWORD -ErrorAction SilentlyContinue
