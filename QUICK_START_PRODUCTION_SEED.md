# 🚀 Quick Start: Seed Production Database

## **The Fastest Way to Seed Production**

### **Method 1: Using Vercel Environment Variables** (Easiest)

```bash
# 1. Get your production DATABASE_URL from Vercel dashboard
# Go to: Project → Settings → Environment Variables
# Copy the DATABASE_URL value

# 2. Set it temporarily in your terminal (Windows PowerShell)
$env:DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# 3. Run the seed
npm run prisma:seed
```

**Expected Output**:
```
Advisors: created 10, updated 0
Structure templates: created 2, updated 0
Pages: created 7, updated 0
Tools & Pages: created 26, updated 0
✅ Seed complete
```

---

### **Method 2: Quick Vercel CLI** (If you have Vercel CLI)

```bash
# Pull production env vars
npx vercel env pull .env.production

# Run seed with production env
npm run prisma:seed
```

---

### **Method 3: Direct from Vercel Storage Tab**

1. **Go to Vercel Dashboard** → Your Project
2. **Click "Storage"** tab
3. **Click your Postgres database**
4. **Click "Connect"** button
5. **Copy the connection string**
6. **Run in terminal**:
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="paste-connection-string-here"
   npm run prisma:seed
   
   # Mac/Linux
   DATABASE_URL="paste-connection-string-here" npm run prisma:seed
   ```

---

## **Verify It Worked**

### **Check via API**:
```bash
# Check advisors (should see 10)
curl https://your-domain.vercel.app/api/collections/advisors/records

# Check pages (should see 7-33)
curl https://your-domain.vercel.app/api/collections/pages/records
```

### **Check via Browser**:
1. Visit your homepage: `https://your-domain.vercel.app/`
2. Should see 10 advisor cards (Rupert, Gideon, Jade, etc.)
3. Open console - should be NO errors about empty arrays

### **Check via Admin Panel**:
1. Visit: `https://your-domain.vercel.app/admin`
2. Advisors section → Should show 10 records
3. Pages section → Should show 7-33 records

---

## **What Gets Created**

✅ **10 Advisors**:
- Rupert (Strategy Master)
- Gideon (Data Strategist)
- Jade (Modeling Ninja)
- Dante (Wall Street Insider)
- Aria (Product Mentor)
- Piotr (Project Maestro)
- Salomon (Industry Sage)
- Lyra (Growth Alchemist)
- Vera (Legal Navigator)
- Noa (People Architect)

✅ **7 Basic Pages**:
- Home
- Login
- Admin
- Design Master
- Data Mapper
- Strategy Planner
- Agent Kit

✅ **26+ Tool Pages** (with detailed howItWorks content):
- Model Builder
- Business Plan Builder
- FP&A Analyzer
- Valuation Deck Builder
- Product Narrative Designer
- Go-to-Market Builder
- Contract Simplifier
- Org Design Builder
- ...and 18 more

✅ **2 Structure Templates**:
- Business Plan (Short)
- Financial Model (Lite)

---

## **Troubleshooting**

### **Error: "Database not available"**
- ❌ Your `DATABASE_URL` is not set or incorrect
- ✅ Check Vercel dashboard → Settings → Environment Variables
- ✅ Make sure the connection string includes `?sslmode=require`

### **Error: "Connection refused"**
- ❌ Database might be paused or IP restricted
- ✅ Check Vercel Storage → Postgres → ensure it's active
- ✅ Check if there are IP restrictions

### **Showing "updated 10" instead of "created 10"**
- ✅ This is NORMAL if you've run the seed before
- ✅ The script is idempotent (safe to run multiple times)
- ✅ Existing records are updated, not duplicated

---

## **Safety Notes**

✅ **Idempotent**: Safe to run multiple times  
✅ **No Data Loss**: Updates existing records, doesn't delete  
✅ **Production Safe**: Checks for existing data first  
✅ **Case-Insensitive**: Matches records by normalized names  

---

**Need Help?** Check `SEED_FIX_SUMMARY.md` for detailed technical information.

