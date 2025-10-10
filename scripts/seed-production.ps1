# Seed production database (PowerShell)
# Usage: .\scripts\seed-production.ps1

Write-Host "🌱 Seeding production database..." -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  WARNING: This will add/update records in PRODUCTION" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel, or Enter to continue..."
Read-Host

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "🔨 Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

Write-Host ""
Write-Host "🌱 Running seed script..." -ForegroundColor Cyan
npm run prisma:seed

Write-Host ""
Write-Host "✅ Seed complete!" -ForegroundColor Green

