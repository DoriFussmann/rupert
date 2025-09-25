# Zero-to-Production — Admin CMS Baseline

Clean Next.js + Prisma + JWT starter with predefined Collections (Advisors, Structures), Admin dashboard, and CRUD APIs.

## 1) Prereqs
- Node 18+
- Postgres (Neon recommended)
- Vercel (optional for deploy)

## 2) Configure Env
Create `.env.local` (also set in Vercel):
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET=REPLACE_WITH_LONG_RANDOM
```

## 3) Install & DB
```bash
npm install
npm run prisma:migrate
npm run prisma:seed
```

### Create Admin

```bash
# defaults: admin@example.com / admin123
npm run create-admin
```

## 4) Run

```bash
npm run dev
```

* App: [http://localhost:3000](http://localhost:3000)
* Health: [http://localhost:3000/api/health](http://localhost:3000/api/health)
* Login: /login → redirects to /admin on success
* Protected: /admin

## 5) APIs (selected)

* `GET /api/collections` — list (read-only)
* `GET /api/collections/:slug` — show (read-only)
* `GET/POST /api/collections/:slug/fields`
* `GET/PUT/DELETE /api/collections/:slug/fields/:id`
* `GET/POST /api/collections/:slug/records`
* `GET/PUT/DELETE /api/collections/:slug/records/:id`
* `GET /api/admin/users` | `POST /api/admin/users`
* `PUT /api/admin/users/:id` | `DELETE /api/admin/users/:id`
* `POST /api/auth/login` | `POST /api/auth/logout` | `GET /api/auth/me`

## 6) Notes

* Collections are predefined & **read-only** (no create/rename/delete).
* Admin dashboard lets you CRUD Users, Fields, and Records.
* Cookie: HttpOnly JWT used to guard `/admin`.