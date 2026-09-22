# Interactive PowerShell script to create super admin on Railway
Write-Host "`n🚂 Railway Super Admin Setup`n" -ForegroundColor Cyan

Write-Host "This script will create a super admin account on your Railway PostgreSQL database.`n"

# Prompt for DATABASE_URL
Write-Host "📝 Please enter your Railway DATABASE_URL:" -ForegroundColor Yellow
Write-Host "   (Get it from: Railway Dashboard → PostgreSQL → Variables → DATABASE_URL)" -ForegroundColor Gray
$databaseUrl = Read-Host "`nDATABASE_URL"

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "`n❌ Error: DATABASE_URL is required!`n" -ForegroundColor Red
    exit 1
}

if ($databaseUrl -like "*YOUR_PASSWORD*" -or $databaseUrl -like "*localhost*") {
    Write-Host "`n❌ Error: Please use your actual Railway DATABASE_URL, not the placeholder!`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ DATABASE_URL received" -ForegroundColor Green
Write-Host "`n🔧 Setting up super admin with credentials:" -ForegroundColor Cyan
Write-Host "   Email: umairsame28@gmail.com" -ForegroundColor White
Write-Host "   Password: umairqasim2" -ForegroundColor White

Write-Host "`n⏳ Connecting to Railway database...`n" -ForegroundColor Yellow

# Set environment variable and run the script
$env:DATABASE_URL = $databaseUrl
node apps/api/create-railway-admin.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✨ Success! Your super admin account is ready.`n" -ForegroundColor Green
    Write-Host "🌐 You can now login at your deployed app with:" -ForegroundColor Cyan
    Write-Host "   Email: umairsame28@gmail.com" -ForegroundColor White
    Write-Host "   Password: umairqasim2`n" -ForegroundColor White
} else {
    Write-Host "`n❌ Failed to create super admin. Check the error message above.`n" -ForegroundColor Red
}
