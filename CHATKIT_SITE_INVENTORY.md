# Site Inventory Report - OpenAI ChatKit Integration

**Generated:** 2025-01-10  
**Project:** Rupert (Strategy & FP&A Platform)  
**Purpose:** Pre-ChatKit integration analysis

---

## 1. Framework & Runtime

**Framework:** Next.js 15.5.4 (latest stable)  
**Routing:** App Router (`app/` directory)  
**Language:** TypeScript (strict mode enabled)  
**React Version:** 19.1.0  
**Node Target:** Node 20+ (no explicit engine constraint)  
**Runtime Usage:**
- Dev: Turbopack (`next dev --turbopack`)
- Middleware: Edge Runtime (currently disabled/passthrough but configured)
- API Routes: Node.js runtime (default)

---

## 2. Build & Deploy

**Package Manager:** npm (package-lock.json present)  
**Build Commands:**
- Dev: `npm run dev` (uses Turbopack)
- Build: `npm run build` → `.next/` output
- Start: `npm start`

**Deploy Platform:** Vercel (inferred from Next.js config + build patterns)  
- No `vercel.json` present (using defaults)
- Build ignores: ESLint errors, TypeScript errors (temporarily)
- Redirects configured: `/financial-model-builder` → `/model-builder`

**Adapters:** None (standard Next.js Vercel deployment)

---

## 3. Frontend

**UI Framework:** React 19.1.0  
**Styling:** Tailwind CSS v4 + custom CSS  
- PostCSS with `@tailwindcss/postcss`
- Custom CSS classes (`.nb-container`, `.nb-card`, `.nb-btn`, etc.)
- Google Fonts: Inter (weights 100-900)
- Design tokens in `:root` (CSS variables)

**Existing Chat UI:** YES - Multiple implementations
- Custom chat components in `/strategy-planner`, `/model-builder`, `/data-mapper`
- Chat messages, input boxes, typing indicators already built
- NO iframe or web component usage detected
- NO existing ChatKit installation

**Global Layout Files:**
- **Root:** `app/layout.tsx` - Includes sticky header with navigation + menu dropdown
- **NavigationHeader:** `app/components/NavigationHeader.tsx` - Reusable header used in child pages (creates duplicate header issue on some pages)
- No route groups or nested layouts detected

**Pages (client-side):**
```
/                    → app/page.tsx (Home - advisors grid)
/admin               → app/admin/page.tsx (CMS dashboard)
/login               → app/login/page.tsx
/agent-kit           → app/agent-kit/page.tsx
/business-taxonomy   → app/business-taxonomy/page.tsx
/data-mapper         → app/data-mapper/page.tsx (has chat UI)
/design-master       → app/design-master/page.tsx
/model-builder       → app/model-builder/page.tsx (has chat UI)
/strategy-planner    → app/strategy-planner/page.tsx (has chat UI)
```

---

## 4. Server & API

**API Routes (app/api/):**

### Authentication
- `POST /api/auth/login` - JWT auth, sets HttpOnly cookie
- `POST /api/auth/logout` - Clears auth cookie
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user from JWT
- `GET /api/auth` - Auth status check

### Admin/Users
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user by ID
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

### Collections (CMS)
- `GET /api/collections` - List all collections
- `GET /api/collections/[slug]` - Get collection by slug
- `GET /api/collections/[slug]/records` - List records
- `POST /api/collections/[slug]/records` - Create record
- `GET /api/collections/[slug]/records/[id]` - Get record
- `PATCH /api/collections/[slug]/records/[id]` - Update record
- `DELETE /api/collections/[slug]/records/[id]` - Delete record
- `GET /api/collections/[slug]/fields` - List fields
- `POST /api/collections/[slug]/fields` - Create field
- `PATCH /api/collections/[slug]/fields/[id]` - Update field
- `DELETE /api/collections/[slug]/fields/[id]` - Delete field

### OpenAI Integration
- `POST /api/openai/chat` - **Main chat endpoint** (supports chat.completions + responses API)
- `GET|POST /api/openai/analyze-payload` - Analyze arbitrary payloads

### Business Logic
- `POST /api/companies/update-classification` - AI-powered business classification
- `POST /api/companies/update-data-map` - Update company data mappings
- `POST /api/data-mapper/process` - Data mapping processor
- `POST /api/data-mapper/process-custom` - Custom data processing
- `POST /api/collections/structures/records/[id]/compile` - Structure compilation

### Utility
- `GET /api/health` - Health check
- `GET /api/selftest` - Self-test diagnostics
- `POST /api/simulate` - Simulation endpoint
- `POST /api/upload` - File upload handler

**Middleware:** 
- File: `middleware.ts`
- Status: Currently **passthrough** (all requests allowed, auth disabled)
- Matcher: Excludes `/api/*`, `_next/static`, `_next/image`, `favicon.ico`, static files
- Edge Runtime: Configured but not actively used

**Authentication:**
- **Type:** Custom JWT (using `jose` library, not NextAuth)
- **Storage:** HttpOnly cookies (`auth-token`)
- **Expiry:** 24 hours
- **User Access:** Available via `GET /api/auth/me`
- **Middleware Auth:** Currently disabled (passthrough)

---

## 5. Data Layer

**Database:** PostgreSQL  
**ORM:** Prisma 6.16.2  
- Schema: `prisma/schema.prisma`
- Models: `User`, `Collection`, `Field`, `Record`
- Migrations in `prisma/migrations/`

**Models:**
```prisma
User (id, email, password, name, role, company)
Collection (id, name, slug) → has many Fields, Records
Field (id, collectionId, label, key, type, required, options, order)
Record (id, collectionId, data[JSON], createdAt, updatedAt)
```

**Collections in Use:**
- `advisors` - AI advisors/personas
- `structures` - Document structures/templates
- `companies` - Company data & classifications
- `tasks` - Task definitions
- `pages` - Page metadata (for dynamic routing)
- `system-prompts` - System prompts for LLMs

**Redis/Caching:** None detected  
**Queue/Workers:** None detected

---

## 6. Environment & Config

**Environment Variables (from `env.example`):**
```bash
DATABASE_URL            # PostgreSQL connection string
AUTH_JWT_SECRET        # JWT signing secret (legacy?)
JWT_SECRET             # JWT signing secret
NEXT_PUBLIC_APP_NAME   # App name (public)
OPENAI_API_KEY         # OpenAI API key
```

**Security Headers:** None explicitly configured  
- No CSP headers detected
- No `script-src`, `connect-src`, or `frame-src` restrictions
- ⚠️ **ChatKit Impact:** Should be safe to integrate without CSP conflicts

**Local Development:**
- Port: 3000 (Next.js default)
- Domain: `localhost:3000`

**Production Domain:** Not specified (likely Vercel auto-domain)

---

## 7. OpenAI/AI Usage Today

**OpenAI SDK:** `openai@5.23.0` installed but **NOT directly imported**  
- Custom fetch calls to OpenAI API instead of SDK
- Direct API calls to `https://api.openai.com/v1/chat/completions`
- Direct API calls to `https://api.openai.com/v1/responses` (new Responses API)

**Active OpenAI Routes:**

### `/api/openai/chat` (Main Chat Handler)
- **Purpose:** Universal chat endpoint for all pages
- **Supports:**
  - Legacy chat interface (`userMessage` + `chatHistory`)
  - Direct OpenAI payload (`messages` array)
  - Responses API payload (`input` array)
- **Models Supported:** All OpenAI models (gpt-4, gpt-4o, o1, o3-mini, etc.)
- **Parameters:** temperature, top_p, max_tokens, frequency_penalty, presence_penalty, response_format
- **Used By:** Strategy Planner, Model Builder, Data Mapper (all pages with chat)

### `/api/openai/analyze-payload`
- **Purpose:** Ad-hoc payload analysis
- **Model:** Fixed to `gpt-4`
- **Usage:** Limited/test endpoint

**No Agents SDK:** Not using OpenAI Agents API  
**No ChatKit:** Not installed

---

## 8. Monorepo

**Structure:** Single-app repository (not a monorepo)  
**Web App Path:** Project root  
**Shared Packages:** None

---

## 9. Suggested Insertion Points

### A) Site-Wide Floating Widget

**Recommended Location:** `app/layout.tsx`  
**Rationale:**
- Root layout wraps all pages
- Already has sticky header (z-index: 50)
- ChatKit widget should use z-index > 50 (suggest: 9999)
- Insert before closing `</body>` tag

**Approach:**
```tsx
// In app/layout.tsx, line ~58-59 (after <main>{children}</main>)
<main className="nb-container py-6">{children}</main>
{/* ChatKit floating widget here */}
```

**Considerations:**
- Some pages use `NavigationHeader` component which creates duplicate headers
- Widget should overlay cleanly without interfering with dropdowns (current max z-index: 50)

---

### B) Section-Only Widget (No Route Groups)

**Challenge:** No route groups exist in current structure  
**Options:**

**Option 1: Specific Page Layout**  
Create layout for a subset of pages (e.g., all "tools" pages):
- Create: `app/(tools)/layout.tsx`
- Move: `data-mapper/`, `model-builder/`, `strategy-planner/`, `business-taxonomy/`, `design-master/` into `(tools)/` folder
- Add ChatKit to `(tools)/layout.tsx`

**Option 2: Component-Based Approach**  
Create a `<ToolPageLayout>` component:
- File: `app/components/ToolPageLayout.tsx`
- Wrap individual pages that need ChatKit
- More granular control, less refactoring

**Recommendation:** Option 2 (Component-Based) - Less disruptive

---

### C) Dedicated `/chat` Page

**Recommended Location:** `app/chat/page.tsx`  
**Rationale:**
- Follows existing pattern (each route = folder + `page.tsx`)
- Would automatically use root layout header
- Can use existing `NavigationHeader` component or not

**Approach:**
```tsx
// app/chat/page.tsx
"use client";
import NavigationHeader from "../components/NavigationHeader";

export default function ChatPage() {
  return (
    <>
      <NavigationHeader />
      {/* ChatKit full-page interface here */}
    </>
  );
}
```

**Note:** Current `/strategy-planner`, `/model-builder`, `/data-mapper` already have sophisticated chat UIs. Consider:
- Replacing those with ChatKit
- OR keeping them separate for specific advisor contexts

---

## 10. Paths Map

```
Root Layout:              app/layout.tsx
Navigation Component:     app/components/NavigationHeader.tsx
API Routes:               app/api/
OpenAI Chat Endpoint:     app/api/openai/chat/route.ts
Auth Lib:                 app/lib/auth.ts
Database Client:          app/lib/prisma.ts
Middleware:               middleware.ts
Global Styles:            app/globals.css
Home Page:                app/page.tsx
Admin:                    app/admin/page.tsx
Login:                    app/login/page.tsx

Tool Pages (have chat UI):
  Strategy Planner:       app/strategy-planner/page.tsx
  Model Builder:          app/model-builder/page.tsx  
  Data Mapper:            app/data-mapper/page.tsx
  Business Taxonomy:      app/business-taxonomy/page.tsx
  Design Master:          app/design-master/page.tsx

Agent Kit (new, empty):   app/agent-kit/page.tsx

Prisma Schema:            prisma/schema.prisma
Package Config:           package.json
TypeScript Config:        tsconfig.json
Next.js Config:           next.config.ts
Env Example:              env.example
```

---

## 11. Integration Recommendations

### Quick Wins
1. **Global Widget:** Add to `app/layout.tsx` (lines 58-59)
   - Minimal code change
   - Available site-wide
   - Set `z-index: 9999`

2. **Auth Context:** User info available via `/api/auth/me`
   - Pass to ChatKit for personalization
   - JWT in HttpOnly cookie (secure)

3. **Existing Chat Pages:** Consider replacing custom chat with ChatKit
   - `/strategy-planner` has full chat UI (850+ LOC)
   - `/model-builder` has similar implementation
   - Could simplify codebase significantly

### Challenges
1. **Duplicate Headers:** Many pages use both root layout header AND `NavigationHeader` component
   - May cause z-index stacking issues
   - Consider refactoring to single header source

2. **OpenAI API Key:** Already configured, reuse for ChatKit

3. **No Route Groups:** Would require folder restructuring for section-only widgets

### Next Steps
1. Confirm ChatKit widget should be **global** vs **section-specific**
2. Decide: Replace existing chat UIs or keep separate?
3. Review advisor/persona integration (10 advisors defined in DB)
4. Test ChatKit z-index layering with existing dropdown menus

---

## 12. Unknowns

1. **Production Domain:** Not specified in config (Vercel auto-assigned?)
2. **CSP Headers:** None configured currently - will ChatKit require specific CSP rules?
3. **Middleware Auth:** Currently disabled - will it be re-enabled before ChatKit?
4. **OpenAI Quota:** Existing chat uses may impact ChatKit rate limits
5. **Session Management:** JWT expiry (24h) - how should ChatKit handle expired sessions?

---

## Summary

**Green Lights:**
✅ Next.js 15 + App Router (modern, supported)  
✅ OpenAI API already integrated  
✅ TypeScript with strict mode  
✅ Clean API structure  
✅ No conflicting chat SDKs  
✅ No CSP restrictions  

**Yellow Flags:**
⚠️ Duplicate header components (layout + NavigationHeader)  
⚠️ Custom chat implementations on 3+ pages (may want to replace)  
⚠️ Edge middleware configured but not used  
⚠️ No route groups (limits section-only widget options)  

**Recommendation:** ChatKit integration is **straightforward**. Start with global widget in `app/layout.tsx`, then consider replacing page-specific chat UIs for consistency.

