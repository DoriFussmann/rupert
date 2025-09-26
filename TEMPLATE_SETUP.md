# Template Setup Guide

Complete setup instructions for deploying this admin CMS template with Neon Database and Vercel.

## Prerequisites

- Node.js 18+
- Git
- GitHub account
- Neon account (free tier available)
- Vercel account (free tier available)

## 1. Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Sign up or log in
3. Click **"Create Project"**
4. Choose a project name (e.g., "my-admin-cms")
5. Select region closest to your users
6. Copy the **Connection String** (starts with postgresql://)

## 2. Set Environment Variables

1. Copy env.example to .env.local:
   `ash
   cp env.example .env.local
   `

2. Fill in your .env.local:
   `env
   # Database - paste your Neon connection string
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   
   # JWT Authentication - generate a secure random string
   AUTH_JWT_SECRET=your-super-secret-jwt-key-here
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Application
   NEXT_PUBLIC_APP_NAME=Your App Name
   `

## 3. Install Dependencies

`ash
# Using npm
npm install

# Or using pnpm (recommended)
pnpm install

# Or using yarn
yarn install
`

## 4. Setup Database

`ash
# Deploy migrations to create tables
npx prisma migrate deploy

# Seed the database with initial collections and data
npx prisma db seed
`

## 5. Create Admin User

`ash
# Creates default admin user: admin@example.com / admin123
npm run create-admin
`

## 6. Test Locally

`ash
# Start development server
npm run dev
`

Visit:
- **App**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Health Check**: http://localhost:3000/api/health

## 7. Deploy to Vercel

### Option A: Vercel CLI (Recommended)

1. Install Vercel CLI:
   `ash
   npm i -g vercel
   `

2. Deploy:
   `ash
   vercel
   `

3. Follow prompts to link your GitHub repo

### Option B: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

## 8. Set Vercel Environment Variables

In your Vercel project dashboard:

1. Go to **Settings**  **Environment Variables**
2. Add these variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | DATABASE_URL | Your Neon connection string | Production |
   | AUTH_JWT_SECRET | Your JWT secret | Production |
   | JWT_SECRET | Your JWT secret | Production |
   | NEXT_PUBLIC_APP_NAME | Your app name | Production |

3. **Redeploy** your project after adding environment variables

## 9. Run Database Migrations on Vercel

After deployment, run migrations on your production database:

`ash
# In your local terminal, with production DATABASE_URL
npx prisma migrate deploy

# Seed production database (optional)
npx prisma db seed
`

## 10. Create Production Admin User

`ash
# Run this with your production DATABASE_URL
npm run create-admin
`

## Verification

Your deployed app should have:

-  **Homepage**: Working at your Vercel URL
-  **Admin Login**: /login redirects to /admin after login
-  **Health Check**: /api/health returns { ok: true }
-  **Self Test**: /api/selftest returns success when DB is connected
-  **Protected Routes**: /admin requires authentication

## Troubleshooting

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Check Neon database is active (not suspended)
- Ensure ?sslmode=require is in your connection string

### Environment Variables
- Make sure all required env vars are set in Vercel
- Redeploy after adding/changing environment variables
- Check Vercel function logs for errors

### Authentication Issues
- Verify JWT_SECRET is set and matches between local and production
- Clear browser cookies and try logging in again
- Check that admin user exists in production database

## Next Steps

- Customize collections in prisma/seed.ts
- Modify UI components in pp/admin/page.tsx
- Add your own branding and styling
- Set up custom domain in Vercel (optional)

## Support

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
