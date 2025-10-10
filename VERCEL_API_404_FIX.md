# 🚨 API Routes Returning 404 on Vercel - Troubleshooting Guide

## Problem
ALL API routes return 404 on Vercel but work perfectly locally.
- ❌ `/api/collections/advisors/records` → 404
- ❌ `/api/health` → 404
- ❌ `/api/test` → 404
- ✅ Same routes work on `localhost:3000`

## Root Causes & Solutions

### 🔍 **Cause 1: Build Failures Being Ignored**

Your `next.config.ts` has:
```typescript
typescript: {
  ignoreBuildErrors: true,  // ⚠️ DANGEROUS!
}
```

**Why this causes 404s:**
- TypeScript errors prevent API routes from being compiled
- Vercel builds "successfully" but without the API routes
- Routes exist in source code but not in deployment

**Solution:**
```typescript
typescript: {
  ignoreBuildErrors: false,  // ← Force build to fail on TS errors
}
```

---

### 🔍 **Cause 2: Missing Prisma Client Generation**

API routes that import Prisma fail to build if Prisma Client isn't generated.

**Check `package.json`:**
```json
{
  "scripts": {
    "postinstall": "prisma generate"  // ✅ Must have this
  }
}
```

**Already added ✅** - But verify it's running in Vercel build logs.

---

### 🔍 **Cause 3: Import Path Issues**

Check if all imports use correct paths:
```typescript
// ✅ Good
import { prisma } from '@/app/lib/prisma'

// ❌ Bad (might work locally but not in production)
import { prisma } from '../../lib/prisma'
```

---

### 🔍 **Cause 4: Dynamic Route Syntax Issues**

Check bracket folders:
```
✅ app/api/collections/[slug]/route.ts
❌ app/api/collections/{slug}/route.ts
```

**Your routes are correct ✅**

---

### 🔍 **Cause 5: Output Directory Configuration**

Next.js 15 with App Router should output to `.next/`:
```typescript
// next.config.ts - check for these issues:
// ❌ DON'T have: output: 'export' (breaks API routes)
// ❌ DON'T have: distDir pointing elsewhere
```

**Your config is clean ✅**

---

## 🔧 **Fix Steps (In Order)**

### **Step 1: Enable TypeScript Error Checking**

This will reveal any build failures:

<function_calls>
<invoke name="search_replace">
<parameter name="file_path">next.config.ts
