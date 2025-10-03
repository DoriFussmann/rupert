# PowerShell Audit Script for Windows
$ErrorActionPreference = "Continue"

$OUT = "audit_out"
New-Item -ItemType Directory -Force -Path $OUT | Out-Null

Write-Host "== System & Tooling ==" -ForegroundColor Cyan
@"
System & Tooling
Generated: $(Get-Date)
OS: $([Environment]::OSVersion.VersionString)
PowerShell: $($PSVersionTable.PSVersion)
"@ | Tee-Object -FilePath "$OUT/00_system.txt"

try { node -v | Add-Content "$OUT/00_system.txt" } catch { "node: not found" | Add-Content "$OUT/00_system.txt" }
try { npm -v | Add-Content "$OUT/00_system.txt" } catch { "npm: not found" | Add-Content "$OUT/00_system.txt" }
try { pnpm -v | Add-Content "$OUT/00_system.txt" } catch { "pnpm: not found" | Add-Content "$OUT/00_system.txt" }

Write-Host "`n== Next.js Info ==" -ForegroundColor Cyan
"Next.js Info" | Tee-Object -FilePath "$OUT/01_next_info.txt"
try { npx --yes next info 2>&1 | Add-Content "$OUT/01_next_info.txt" } catch { }
"`npackage.json scripts:" | Add-Content "$OUT/01_next_info.txt"
if (Test-Path "package.json") {
    Get-Content "package.json" | Add-Content "$OUT/01_next_info.txt"
}

Write-Host "`n== Repo Snapshot ==" -ForegroundColor Cyan
"Repo Snapshot" | Tee-Object -FilePath "$OUT/02_repo_snapshot.txt"
try { git rev-parse --short HEAD 2>&1 | Add-Content "$OUT/02_repo_snapshot.txt" } catch { }
try { git status -s 2>&1 | Add-Content "$OUT/02_repo_snapshot.txt" } catch { }
"`nTop-level dirs:" | Add-Content "$OUT/02_repo_snapshot.txt"
Get-ChildItem -Directory | Select-Object Name | Add-Content "$OUT/02_repo_snapshot.txt"

Write-Host "`n== Node Modules Size ==" -ForegroundColor Cyan
"Node Modules Size" | Tee-Object -FilePath "$OUT/03_modules_size.txt"
if (Test-Path "node_modules") {
    $size = (Get-ChildItem -Recurse "node_modules" -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    "node_modules: $([math]::Round($size, 2)) MB" | Add-Content "$OUT/03_modules_size.txt"
    "`nLargest 20 packages:" | Add-Content "$OUT/03_modules_size.txt"
    Get-ChildItem "node_modules" -Directory -ErrorAction SilentlyContinue | 
        ForEach-Object { 
            $folderSize = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
            [PSCustomObject]@{Name=$_.Name; SizeMB=[math]::Round($folderSize, 2)}
        } | 
        Sort-Object SizeMB -Descending | 
        Select-Object -First 20 | 
        Add-Content "$OUT/03_modules_size.txt"
} else {
    "node_modules missing" | Add-Content "$OUT/03_modules_size.txt"
}

Write-Host "`n== Next Config & Routes ==" -ForegroundColor Cyan
"Next Config & Routes" | Tee-Object -FilePath "$OUT/04_next_config_routes.txt"
if (Test-Path "next.config.js") { Get-Content "next.config.js" | Add-Content "$OUT/04_next_config_routes.txt" }
if (Test-Path "next.config.mjs") { Get-Content "next.config.mjs" | Add-Content "$OUT/04_next_config_routes.txt" }
if (Test-Path "next.config.ts") { Get-Content "next.config.ts" | Add-Content "$OUT/04_next_config_routes.txt" }
if (Test-Path "app") {
    "`nApp Router pages (app/):" | Add-Content "$OUT/04_next_config_routes.txt"
    Get-ChildItem -Recurse "app" -Include "page.*","layout.*","route.*" | ForEach-Object { " - $($_.FullName)" } | Add-Content "$OUT/04_next_config_routes.txt"
}

Write-Host "`n== Env Snapshot (keys only) ==" -ForegroundColor Cyan
"Env Snapshot" | Tee-Object -FilePath "$OUT/06_env_keys.txt"
@(".env", ".env.local", ".env.development") | ForEach-Object {
    if (Test-Path $_) {
        "[$_]" | Add-Content "$OUT/06_env_keys.txt"
        Get-Content $_ | ForEach-Object {
            if ($_ -match '^([^#=]+)=') {
                "$($matches[1])=[REDACTED]"
            }
        } | Add-Content "$OUT/06_env_keys.txt"
    }
}

Write-Host "`n== Prisma / DB Checks ==" -ForegroundColor Cyan
"Prisma / DB Checks" | Tee-Object -FilePath "$OUT/07_prisma_db.txt"
if (Test-Path "prisma/schema.prisma") {
    try { npx --yes prisma -v 2>&1 | Add-Content "$OUT/07_prisma_db.txt" } catch { }
    "`nPrisma schema found" | Add-Content "$OUT/07_prisma_db.txt"
    Get-Content "prisma/schema.prisma" -TotalCount 20 | Add-Content "$OUT/07_prisma_db.txt"
} else {
    "No prisma/schema.prisma found" | Add-Content "$OUT/07_prisma_db.txt"
}

Write-Host "`n== Quick Heuristics ==" -ForegroundColor Cyan
@"
Quick Heuristics:
- Check node_modules size in 03_modules_size.txt
- Review Next config in 04_next_config_routes.txt
- Verify environment variables in 06_env_keys.txt
- Check Prisma setup in 07_prisma_db.txt
"@ | Tee-Object -FilePath "$OUT/09_findings.txt"

Write-Host "`n== Report Summary ==" -ForegroundColor Cyan
@"
# Dev & DB Audit (Windows)

Generated: $(Get-Date)

## Artifacts:
$(Get-ChildItem $OUT | ForEach-Object { " - $($_.Name)" } | Out-String)

## Suggested next reads:
 - 03_modules_size.txt: dependency weight
 - 04_next_config_routes.txt: Next.js configuration and routes
 - 06_env_keys.txt: environment variables
 - 07_prisma_db.txt: Prisma/database setup

## Notes:
 - Review the generated files for potential issues
 - Check for any missing dependencies or configuration problems
"@ | Tee-Object -FilePath "$OUT/REPORT.md"

Write-Host "`n=== Audit Complete ===" -ForegroundColor Green
Write-Host "Results saved to: $OUT/REPORT.md" -ForegroundColor Yellow
Write-Host "`nOpen $OUT/REPORT.md to view the full report" -ForegroundColor Cyan

