# 🌱 Production Database Seeding Guide

## Quick Start

### **Step 1: Get Your Production DATABASE_URL**

1. Go to **Vercel Dashboard** → Your Project
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL` and **copy the value**
4. Or use Vercel CLI: `vercel env pull .env.production`

### **Step 2: Set DATABASE_URL Temporarily**

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="your-production-database-url-here"
```

**Mac/Linux (Bash):**
```bash
export DATABASE_URL="your-production-database-url-here"
```

### **Step 3: Run the Seed**

```bash
npm run prisma:seed
```

**Or use the helper script:**

**Windows:**
```powershell
.\scripts\seed-production.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/seed-production.sh
./scripts/seed-production.sh
```

---

## 📊 What Gets Seeded

### **10 Advisors Created:**
1. **Rupert** - Strategy Master
2. **Gideon** - Data Strategist  
3. **Jade** - Modeling Ninja
4. **Dante** - Wall Street Insider
5. **Aria** - Product Mentor
6. **Piotr** - Project Maestro
7. **Salomon** - Industry Sage
8. **Lyra** - Growth Alchemist
9. **Vera** - Legal Navigator
10. **Noa** - People Architect

### **7 Pages Created:**
- Home
- Login
- Admin
- Design Master
- Data Mapper
- Strategy Planner
- Agent Kit

### **Plus:**
- Structure templates
- System prompts
- Field definitions for all collections

---

## 🚀 Alternative: Seed via Vercel CLI

If you have Vercel CLI installed:

```bash
# 1. Pull production environment
vercel env pull .env.production

# 2. Load and seed
source .env.production  # or on Windows: Get-Content .env.production | ForEach-Object { $_ }
npm run prisma:seed
```

---

## 🔍 Verify After Seeding

### **Test Endpoints:**

```bash
# Check advisors
curl https://your-domain.vercel.app/api/collections/advisors/records

# Check pages
curl https://your-domain.vercel.app/api/collections/pages/records
```

### **Check Homepage:**
Visit `https://your-domain.vercel.app/` - you should see the advisor cards.

---

## ⚠️ Important Notes

- ✅ **Idempotent:** Safe to run multiple times (upserts, doesn't duplicate)
- ✅ **Production-Safe:** Won't delete existing data
- ⚠️ **Requires DATABASE_URL:** Make sure it's set correctly
- ⚠️ **Internet Required:** Connects to your production database

---

## 🐛 Troubleshooting

### **Error: "Environment variable not found: DATABASE_URL"**

Make sure you set the DATABASE_URL environment variable before running the seed.

### **Error: "Connection timeout"**

Check your production database is accessible from your location. Some databases block connections from certain IPs.

### **Seed completes but still empty:**

Check you're pointing to the correct database URL (production, not local).

### **Want to test locally first?**

```bash
# Use your local database
npm run dev  # in another terminal
npm run prisma:seed
```

Then check `http://localhost:3000/` to verify data appears.

---

## 📝 What the Seed Does

```typescript
// From prisma/seed.ts - main() function:
1. ensureCollections()           // Creates 6 collections
2. seedAdvisorFields()           // Defines advisor schema
3. seedAdvisorRecords()          // ⭐ Creates 10 advisors
4. seedStructuresCollection()    // Structure templates
5. seedStructureTemplates()      // Sample templates
6. seedCompaniesCollection()     // Company fields
7. seedTasksCollection()         // Task fields
8. seedSystemPromptsCollection() // System prompt fields
9. seedToolsPagesCollection()    // ⭐ Creates 7 pages
10. seedToolsPagesRecords()      // Detailed page data
```

---

## 🎯 Quick Command Reference

```bash
# Seed production (manual)
DATABASE_URL="prod-url" npm run prisma:seed

# Seed with Vercel CLI
vercel env pull && npm run prisma:seed

# Seed collections only (without records)
npm run seed-collections

# Open Prisma Studio (view data)
DATABASE_URL="prod-url" npx prisma studio
```

---

## ✅ Success Indicators

After seeding, you should see:

```
✅ Seed complete
Advisors: created 10, updated 0
Tools & Pages: created 7, updated 0
```

And your homepage at `/` should display all 10 advisor cards with images and descriptions.

