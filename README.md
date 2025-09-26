# Starter  Admin CMS Template

Clean Next.js + Prisma + JWT starter with predefined Collections, Admin dashboard, and CRUD APIs.

## Features

-  **JWT Authentication** - Login/logout with protected routes
-  **User Management** - CRUD with roles and company assignment  
-  **Dynamic Collections** - Advisors, Structures, Companies, Tasks
-  **Modern UI** - Tailwind CSS, responsive design, modals
-  **Security** - Middleware protection, environment safety
-  **Admin Dashboard** - Full CRUD operations, collapsible panels

## Quick Start

1. **Setup**: See [TEMPLATE_SETUP.md](./TEMPLATE_SETUP.md) for detailed instructions
2. **Install**: 
pm install
3. **Configure**: Copy env.example to .env.local and fill in values
4. **Database**: 
px prisma migrate deploy && npx prisma db seed
5. **Run**: 
pm run dev

## Stack

- **Framework**: Next.js 15 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT with HttpOnly cookies
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

Default admin: dmin@example.com / dmin123 (run 
pm run create-admin to create)
