# Check Vercel Database Configuration
# This script helps verify what DATABASE_URL Vercel is using

Write-Host "🔍 Checking Vercel Database Configuration..." -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📱 Manual Check:" -ForegroundColor Cyan
    Write-Host "1. Go to https://vercel.com/dashboard"
    Write-Host "2. Select your project"
    Write-Host "3. Settings → Environment Variables"
    Write-Host "4. Look for DATABASE_URL"
    Write-Host ""
    exit 1
}

Write-Host "✅ Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Pull environment variables
Write-Host "📥 Pulling production environment variables..." -ForegroundColor Cyan
vercel env pull .env.vercel-check --environment=production

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Environment variables pulled" -ForegroundColor Green
    Write-Host ""
    
    # Check if DATABASE_URL exists
    if (Test-Path ".env.vercel-check") {
        $content = Get-Content ".env.vercel-check"
        $dbUrl = $content | Select-String "DATABASE_URL="
        
        if ($dbUrl) {
            # Extract just the host
            $url = $dbUrl -replace 'DATABASE_URL=', ''
            try {
                $uri = [System.Uri]$url
                $host = $uri.Host
                $database = $uri.LocalPath.TrimStart('/')
                
                Write-Host "📊 Database Configuration:" -ForegroundColor Cyan
                Write-Host "  Host: $host" -ForegroundColor White
                Write-Host "  Database: $database" -ForegroundColor White
            } catch {
                Write-Host "⚠️  Could not parse DATABASE_URL" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ DATABASE_URL not found in environment variables" -ForegroundColor Red
        }
        
        # Clean up
        Remove-Item ".env.vercel-check" -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "❌ Failed to pull environment variables" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you're logged in: vercel login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Test your production database connection:" -ForegroundColor Cyan
Write-Host "https://your-domain.vercel.app/api/db-test"
Write-Host ""

