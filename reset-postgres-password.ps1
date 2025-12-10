# Reset PostgreSQL password script
# This script will reset the postgres user password

$newPassword = "xzr1234567."

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Password Reset" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Attempting to reset postgres user password..." -ForegroundColor Yellow
Write-Host "New password will be: $newPassword`n" -ForegroundColor Green

# Method 1: Try using psql with Windows authentication
Write-Host "Method 1: Using psql command..." -ForegroundColor Yellow

$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"

# Create a temporary SQL file
$tempSqlFile = "temp_reset_password.sql"
Set-Content -Path $tempSqlFile -Value $sqlCommand

Write-Host "Running: psql -U postgres -d postgres -f $tempSqlFile" -ForegroundColor Cyan
Write-Host "(You may be prompted for the current password)`n" -ForegroundColor Gray

try {
    $result = psql -U postgres -d postgres -f $tempSqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Password reset successful!" -ForegroundColor Green
        Write-Host "New password: $newPassword" -ForegroundColor Green
        Remove-Item $tempSqlFile -ErrorAction SilentlyContinue
        
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Test connection: psql -U postgres -d postgres" -ForegroundColor Cyan
        Write-Host "2. Create database: npm run db:push" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "`n⚠️  Method 1 failed. Trying alternative method..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Remove-Item $tempSqlFile -ErrorAction SilentlyContinue

# Method 2: Instructions for manual reset
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Manual Reset Instructions" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "If automatic reset failed, please follow these steps:`n" -ForegroundColor Yellow

Write-Host "Option A - Using pgAdmin:" -ForegroundColor Green
Write-Host "1. Open pgAdmin" -ForegroundColor White
Write-Host "2. Right-click on 'postgres' user under Login/Group Roles" -ForegroundColor White
Write-Host "3. Select Properties > Definition" -ForegroundColor White
Write-Host "4. Enter new password: $newPassword" -ForegroundColor Cyan
Write-Host "5. Click Save`n" -ForegroundColor White

Write-Host "Option B - Using Command Line:" -ForegroundColor Green
Write-Host "1. Open Command Prompt as Administrator" -ForegroundColor White
Write-Host "2. Run: psql -U postgres" -ForegroundColor Cyan
Write-Host "3. Enter current password when prompted" -ForegroundColor White
Write-Host "4. Run: ALTER USER postgres WITH PASSWORD '$newPassword';" -ForegroundColor Cyan
Write-Host "5. Type: \q to exit`n" -ForegroundColor White

Write-Host "Option C - Edit pg_hba.conf (Temporary):" -ForegroundColor Green
Write-Host "1. Find pg_hba.conf (usually in C:\Program Files\PostgreSQL\17\data\)" -ForegroundColor White
Write-Host "2. Change 'md5' or 'scram-sha-256' to 'trust' for local connections" -ForegroundColor White
Write-Host "3. Restart PostgreSQL service" -ForegroundColor White
Write-Host "4. Run: psql -U postgres" -ForegroundColor Cyan
Write-Host "5. Run: ALTER USER postgres WITH PASSWORD '$newPassword';" -ForegroundColor Cyan
Write-Host "6. Change pg_hba.conf back to 'scram-sha-256'" -ForegroundColor White
Write-Host "7. Restart PostgreSQL service again`n" -ForegroundColor White

Write-Host "========================================" -ForegroundColor Cyan
