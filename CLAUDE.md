@AGENTS.md

# Git Policy

**Never create branches.** Always commit directly to `main`. Do not open pull requests. Do not use worktrees or feature branches. Push to `origin/main` when the user asks you to push.

# LabFlow AI — Developer Guide

## Project Overview
LabFlow AI is a classroom lab management web app for teachers, students, and school admins.
Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase, and Anthropic Claude API.

## Quick Start

### Prerequisites
- Node.js 20+
- Supabase account and project
- Anthropic API key

### Setup
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

3. Set up Supabase (see `supabase/README.md` for full instructions):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   npx ts-node --project tsconfig.json supabase/seed-users.ts
   supabase gen types typescript --linked > types/database.ts
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Architecture

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (base-ui) |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| AI | Anthropic Claude API |
| Charts | Recharts |
| Forms | react-hook-form + Zod |

### Folder Structure
```
app/                    # Next.js App Router pages and API routes
  (auth)/               # Unauthenticated pages (login, signup, forgot-password)
  (app)/                # Shared pages (dashboard, settings)
  teacher/              # Teacher-only pages
  student/              # Student-only pages
  admin/                # School admin pages
  api/                  # API route handlers (AI, storage)
components/
  ui/                   # shadcn/ui components
  shared/               # Shared across roles (TopNav, BrandingProvider, etc.)
  teacher/              # Teacher-specific components
  student/              # Student-specific components
  admin/                # Admin-specific components
features/               # Data layer: server actions + queries
  lab-builder/          # Lab CRUD operations
  lab-runner/           # Student lab run operations
  teacher/              # Teacher class/assignment operations
  monitoring/           # Realtime monitoring queries
  analytics/            # Analytics queries and transforms
  admin/                # Organization and admin operations
hooks/                  # React hooks
  useLabRun.ts          # Student step data state + autosave
  useStudentStatus.ts   # Optimistic status updates
  useRealtimeMonitor.ts # Supabase Realtime for teacher monitor
  useAutoSave.ts        # Debounced save utility
  useFeatureFlag.ts     # Feature flag client hook
lib/
  supabase/             # Supabase client (browser, server, middleware)
  auth/                 # Session helpers + role guards
  ai/                   # Anthropic client + prompts + rate limiting
  validations/          # Data flagging rules + form schemas
types/
  database.ts           # Supabase-generated types (regenerate with: supabase gen types typescript --linked)
  app.ts                # Application-level TypeScript types
supabase/
  migrations/           # SQL migration files (run in order)
  seed.sql              # Static seed data (org, feature flags)
  seed-users.ts         # Creates demo users via Admin API
  seed-data.sql         # Demo class, lab, enrollments (run after seed-users.ts)
```

### User Roles
| Role | Access | Description |
|---|---|---|
| `teacher` | `/teacher/*` | Creates labs, monitors students, views analytics |
| `student` | `/student/*` | Completes lab assignments |
| `school_admin` | `/admin/*` + `/teacher/*` | Manages org branding, settings, users |
| `super_admin` | All routes | Cross-organization admin (future, RLS scaffolded) |

### Auth Flow
1. User signs up with org slug (school code) → org looked up → profile + user_settings created by DB trigger
2. Role stored in `profiles.role` (DB authoritative) AND `auth.users.app_metadata.role` (for JWT/middleware)
3. `middleware.ts` reads JWT role, enforces route-level access
4. `RoleGuard` server component provides per-page role checks
5. RLS policies enforce data access at the DB level (defense in depth)

### Data Flow
- **Server Components** fetch data directly via Supabase server client (cookie-based session)
- **Server Actions** handle mutations (forms, autosave, status updates)
- **API Routes** handle AI generation and storage signed URLs
- **Client Components** use Supabase browser client for Realtime subscriptions only

### AI Features
| Feature | Route | Model | Feature Flag |
|---|---|---|---|
| Lab Generation | POST /api/ai/generate-lab | claude-opus-4-7 | ai_lab_generation |
| Help Chat | POST /api/ai/help-chat | claude-sonnet-4-6 | help_chat |

Both routes check the org's feature flag before calling Anthropic. Rate limits: 10 lab generations / 100 help messages per org per hour (in-memory, resets on restart).

Prompt caching is enabled on both routes to reduce API costs.

### Realtime Architecture
- Teacher monitor subscribes to `student_lab_runs` updates filtered by `assignment_id`
- Help escalation channel notifies teacher when a student escalates
- Channels cleaned up on component unmount

### Branding
- `BrandingProvider` (server component) injects CSS custom properties `--color-brand-primary` and `--color-brand-secondary` from org settings
- Teacher, student, and admin layouts each wrap content with BrandingProvider
- Dark mode: user preference via next-themes, stored in `user_settings.theme`

## Database

### Key Tables
| Table | Purpose |
|---|---|
| `organizations` | School/org settings, branding colors |
| `profiles` | User profiles (1:1 with auth.users) |
| `labs` | Lab definitions with metadata |
| `lab_steps` | Individual procedure steps with data fields |
| `student_lab_runs` | Student progress through a lab assignment |
| `step_responses` | Student data entries and reflections per step |
| `help_requests` | AI help conversations |
| `feature_flags` | Per-org feature toggles |

### Migrations
Run in order via `supabase db push`:
1. `001_extensions_enums.sql` — pg extensions, custom ENUMs
2. `002_core_tables.sql` — all tables with indexes
3. `003_triggers.sql` — auto-timestamps, new user handler, role sync
4. `004_rls.sql` — Row Level Security policies
5. `005_storage_buckets.sql` — Storage bucket config

### Regenerating Types
After any schema change:
```bash
supabase gen types typescript --linked > types/database.ts
```

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build + TypeScript check
npm run lint         # ESLint
```

## Feature Flags
Managed per-organization in `feature_flags` table. Toggle in admin panel at `/admin/feature-flags`.

| Flag | Controls |
|---|---|
| `ai_lab_generation` | AI lab draft generation in lab builder |
| `help_chat` | AI Socratic help during student lab runs |
| `analytics` | Analytics dashboard in teacher panel |

## Demo Accounts
After running seed scripts (see `supabase/README.md`):

| Email | Password | Role |
|---|---|---|
| admin@westlake.demo | LabFlow2025! | School Admin |
| teacher@westlake.demo | LabFlow2025! | Teacher |
| student1@westlake.demo | LabFlow2025! | Student |
| student2@westlake.demo | LabFlow2025! | Student |

## Key Patterns

### Adding a new Server Action
```typescript
// features/my-feature/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function myAction(data: MyData) {
  const supabase = await createClient()
  const { error } = await supabase.from('my_table').insert(data)
  if (error) throw error
  revalidatePath('/my-path')
}
```

### Adding a new query
```typescript
// features/my-feature/queries.ts
import { createClient } from '@/lib/supabase/server'

export async function getMyData(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('my_table').select('*').eq('id', id).single()
  return data
}
```

### Adding a new AI feature
1. Check feature flag with `checkFeatureFlag('my_flag')` in the route handler
2. Check rate limit with `checkRateLimit(orgId, 'my_flag')`
3. Add prompt caching with `cache_control: { type: 'ephemeral' }` on the system prompt
4. Use `claude-opus-4-7` for generation tasks, `claude-sonnet-4-6` for interactive/streaming

## Known Limitations (MVP)
- Rate limiting is in-memory (resets on server restart) — use a Redis-backed solution for production
- Teacher materials are stored in Supabase Storage but not yet passed to AI as context (scaffolded, retrieval deferred)
- Analytics use simple aggregation queries — no advanced ML clustering
- No email notifications for escalated help requests (flag visible in teacher monitor)
