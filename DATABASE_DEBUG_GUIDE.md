# 🔍 Database Connection Debugging Guide

## Problem
Homepage shows empty arrays when fetching `/api/collections/advisors/records` and `/api/collections/pages/records`.

## Possible Causes
1. ❌ Vercel is using a different DATABASE_URL than local
2. ❌ Database was never seeded
3. ❌ Database connection failing in production
4. ❌ Collections exist but records are empty

---

## 🧪 Test Database Connection in Production

### **Step 1: Deploy the Test Endpoint**

I've created `/api/db-test` which is now deployed. Visit:

```
https://your-vercel-domain.vercel.app/api/db-test
```

### **Step 2: Analyze the Response**

**✅ Good Response:**
```json
{
  "success": true,
  "message": "✅ Database connected and seeded successfully",
  "database": {
    "host": "ep-cool-name-123456.us-east-1.aws.neon.tech",
    "database": "neondb"
  },
  "counts": {
    "collections": 6,
    "advisors": 10,
    "pages": 7
  }
}
```

**⚠️ Empty Database:**
```json
{
  "success": true,
  "message": "⚠️ Database connected but missing records",
  "counts": {
    "collections": 6,
    "advisors": 0,  // ← Empty!
    "pages": 0      // ← Empty!
  }
}
```

**❌ Connection Failed:**
```json
{
  "success": false,
  "message": "❌ Database connection failed",
  "database": {
    "connectionError": "Connection timeout"
  }
}
```

---

## 📊 Compare Database Hosts

### **Check Vercel's DATABASE_URL**

**Option 1: Vercel Dashboard (Manual)**
1. Go to https://vercel.com/dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Find `DATABASE_URL` and note the **hostname**

**Option 2: Vercel CLI (Automated)**
```powershell
# Run the helper script
.\scripts\check-vercel-db.ps1
```

This will show:
```
📊 Database Configuration:
  Host: ep-cool-name-123456.us-east-1.aws.neon.tech
  Database: neondb
```

### **Compare with Local DATABASE_URL**

Check what DATABASE_URL you used when seeding locally:
```powershell
# Show your local DATABASE_URL host
$env:DATABASE_URL  # Should show the URL you used for seeding
```

**If they're different hosts** → You seeded the wrong database! 

---

## 🔧 Solutions Based on Test Results

### **Scenario 1: Empty Database (Collections exist, but 0 advisors/pages)**

**The Issue:** Vercel's database was never seeded.

**Solution:** Seed the production database that Vercel is using:

```powershell
# 1. Get the DATABASE_URL from Vercel dashboard
# 2. Set it locally
$env:DATABASE_URL="postgresql://user:pass@vercel-db-host/db"

# 3. Run the seed
npm run prisma:seed
```

---

### **Scenario 2: Connection Failed**

**Possible causes:**
- DATABASE_URL not set in Vercel
- Database host is down
- Connection string is malformed
- IP restrictions on database

**Solution:**
1. Verify DATABASE_URL in Vercel Environment Variables
2. Test connection from your local machine:
   ```bash
   DATABASE_URL="vercel-url" npx prisma db pull
   ```
3. Check your database provider's dashboard (Neon, Supabase, etc.)

---

### **Scenario 3: Different Database Hosts**

**The Issue:** 
- Local seeding used: `database-a.provider.com`
- Vercel is using: `database-b.provider.com`

**Solution:** Seed the correct database:
```powershell
# Use the EXACT DATABASE_URL from Vercel
$env:DATABASE_URL="postgresql://...the-vercel-one..."
npm run prisma:seed
```

---

### **Scenario 4: Everything Shows Success but Homepage Still Empty**

**Possible causes:**
- Cache issue
- API route not using the right Prisma instance
- React state not updating

**Solution:**
1. Hard refresh the page: `Ctrl+Shift+R`
2. Check browser console for errors
3. Test API directly:
   ```
   https://your-domain.vercel.app/api/collections/advisors/records
   ```
4. Clear Vercel build cache and redeploy

---

## 🎯 Quick Diagnostic Flow

```
1. Visit /api/db-test in production
   ↓
2a. If empty (0 advisors/pages)
   → Seed production database
   ↓
2b. If connection error
   → Check DATABASE_URL in Vercel
   ↓
2c. If success with data
   → Check API route / homepage code
   ↓
3. Verify /api/collections/advisors/records returns data
   ↓
4. Check homepage loads advisor cards
```

---

## 📝 Checklist

- [ ] `/api/db-test` returns `success: true`
- [ ] Shows `collections: 6`
- [ ] Shows `advisors: 10`
- [ ] Shows `pages: 7`
- [ ] Database host matches Vercel's DATABASE_URL
- [ ] `/api/collections/advisors/records` returns 10 items
- [ ] `/api/collections/pages/records` returns 7 items
- [ ] Homepage displays advisor cards

---

## 🆘 Still Not Working?

### **Test the exact API endpoint:**
```bash
curl https://your-domain.vercel.app/api/collections/advisors/records
```

### **Check Vercel Function Logs:**
1. Vercel Dashboard → Your Project
2. **Deployments** → Latest deployment
3. **Functions** tab
4. Click on failing function
5. Check error logs

### **Common Issues:**

**"Collection not found"**
- Collections table is empty
- Need to run seed script

**"Connection timeout"**
- DATABASE_URL not set or wrong
- Database not accessible from Vercel region

**Empty array `[]`**
- Collections exist but no records
- Need to run full seed (not just collections)

---

## 🔗 Useful Commands

```bash
# Test database connection
DATABASE_URL="your-url" npx prisma db pull

# View database in Prisma Studio
DATABASE_URL="your-url" npx prisma studio

# Count records manually
DATABASE_URL="your-url" npx prisma db execute --stdin
# Then run: SELECT COUNT(*) FROM "Record";

# Full seed
DATABASE_URL="your-url" npm run prisma:seed
```

