#!/usr/bin/env bash
set -euo pipefail

OUT="audit_out"
mkdir -p "$OUT"

echo "== System & Tooling ==" | tee "$OUT/00_system.txt"
{
  date
  uname -a || true
  echo "node: $(node -v 2>/dev/null || echo 'not found')"
  echo "npm:  $(npm -v 2>/dev/null || echo 'not found')"
  echo "pnpm: $(pnpm -v 2>/dev/null || echo 'not found')"
  echo "yarn: $(yarn -v 2>/dev/null || echo 'not found')"
} >> "$OUT/00_system.txt" 2>&1

echo "== Next.js Info ==" | tee "$OUT/01_next_info.txt"
{
  npx --yes next info || true
  echo
  echo "package.json scripts:"
  jq -r '.scripts' package.json 2>/dev/null || cat package.json 2>/dev/null || echo "package.json not found"
} >> "$OUT/01_next_info.txt" 2>&1

echo "== Repo Snapshot ==" | tee "$OUT/02_repo_snapshot.txt"
{
  git rev-parse --short HEAD 2>/dev/null || true
  git status -s 2>/dev/null || true
  echo
  echo "Top-level dirs:"
  ls -la
} >> "$OUT/02_repo_snapshot.txt" 2>&1

echo "== Node Modules Size ==" | tee "$OUT/03_modules_size.txt"
{
  du -sh node_modules 2>/dev/null || echo "node_modules missing"
  echo
  echo "Largest 20 packages:"
  du -sh node_modules/* 2>/dev/null | sort -hr | head -n 20 || true
} >> "$OUT/03_modules_size.txt" 2>&1

echo "== Next Config & Routes ==" | tee "$OUT/04_next_config_routes.txt"
{
  [ -f next.config.js ] && cat next.config.js
  [ -f next.config.mjs ] && cat next.config.mjs
  [ -d app ] && echo -e "\nApp Router pages (app/):" && find app -type f \( -name "page.*" -o -name "layout.*" -o -name "route.*" \) | sed 's/^/ - /'
  [ -d pages ] && echo -e "\nPages Router pages (pages/):" && find pages -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | sed 's/^/ - /'
} >> "$OUT/04_next_config_routes.txt" 2>&1

echo "== Common Anti-Patterns (grep) ==" | tee "$OUT/05_antipattern_scan.txt"
{
  echo "Scanning for heavy/blocking patterns (SSR, middleware, sync crypto/fs, infinite loops, etc.)"
  grep -RIn --exclude-dir=node_modules -E \
    "(getServerSideProps|getStaticProps|middleware|while\s*\(true\)|bcrypt\.hashSync|execSync|spawnSync|fs\.readFileSync|zod.*parse\(await fetch|await\s+fetch\(.+\)\s*;)" \
    . || true
} >> "$OUT/05_antipattern_scan.txt" 2>&1

echo "== Env Snapshot (keys only) ==" | tee "$OUT/06_env_keys.txt"
{
  for f in .env .env.local .env.development; do
    [ -f "$f" ] && echo "[$f]" && sed -E 's/^(#.*| *$)//; s/(=).*$/=\[REDACTED\]/' "$f"
  done
} >> "$OUT/06_env_keys.txt" 2>&1

echo "== Prisma / DB Checks ==" | tee "$OUT/07_prisma_db.txt"
{
  if [ -f prisma/schema.prisma ]; then
    npx --yes prisma -v || true
    echo
    echo "[Connectivity dry-run: prisma db pull --print (10s budget)]"
    if command -v timeout >/dev/null 2>&1; then
      timeout 10s npx --yes prisma db pull --print || echo "(timeout or error)"
    else
      npx --yes prisma db pull --print || true
    fi
  else
    echo "No prisma/schema.prisma found. Skipping Prisma checks."
  fi
} >> "$OUT/07_prisma_db.txt" 2>&1

echo "== One-Minute Dev Run (capturing logs) ==" | tee "$OUT/08_dev_log.txt"
{
  # Try to run the dev server for 60s with verbose Next logs and trace warnings.
  # We don't assume a specific package manager; default to npm script 'dev'.
  if jq -e '.scripts.dev' package.json >/dev/null 2>&1; then
    echo "[Starting dev for ~60s with DEBUG=next:* and trace warnings]"
    (DEBUG=next:* NODE_OPTIONS="--trace-warnings" npm run -s dev > "$OUT/dev.stdout.log" 2> "$OUT/dev.stderr.log" & echo $! > "$OUT/dev.pid")
    PID=$(cat "$OUT/dev.pid" 2>/dev/null || echo "")
    sleep 60
    if [ -n "$PID" ]; then
      kill "$PID" 2>/dev/null || true
      sleep 2
      kill -9 "$PID" 2>/dev/null || true
    fi
    echo "[Stopped dev] Collected $OUT/dev.stdout.log and $OUT/dev.stderr.log"
  else
    echo "No 'dev' script in package.json. Skipping dev run."
  fi
} >> "$OUT/08_dev_log.txt" 2>&1

echo "== Quick Heuristics ==" | tee "$OUT/09_findings.txt"
{
  echo "- If dev froze early: check $OUT/dev.stderr.log for Prisma migrations, DB connect timeouts, or file watcher limits."
  echo "- Big node_modules? Consider stripping unused heavy libs or switching to 'pnpm'."
  echo "- App Router: avoid top-level 'await fetch' in 'layout.tsx' or middleware doing network calls."
  echo "- Image assets: large static images can slow dev; prefer 'next/image' and optimize."
  echo "- Many files watched? Consider excluding large directories in 'next.config.*' experimental.fsCache or reduce watchers."
} >> "$OUT/09_findings.txt" 2>&1

echo "== Report Summary ==" | tee "$OUT/REPORT.md"
{
  echo "# Dev & DB Audit (Local)"
  echo
  echo "Generated: $(date)"
  echo
  echo "Artifacts:"
  ls -1 "$OUT" | sed 's/^/ - /'
  echo
  echo "Suggested next reads:"
  echo " - 08_dev_log.txt + dev.stderr.log: look for stack traces, DB timeouts, file watcher errors"
  echo " - 05_antipattern_scan.txt: any SSR/middleware heavy calls or sync CPU work"
  echo " - 07_prisma_db.txt: Prisma connectivity/migrations"
  echo " - 03_modules_size.txt: dependency weight"
  echo
  echo "Tip: re-run with 'NODE_OPTIONS=--inspect' in dev to attach a profiler if lock-ups persist."
} >> "$OUT/REPORT.md" 2>&1

echo
echo "Done. Open $OUT/REPORT.md"

