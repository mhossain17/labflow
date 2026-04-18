# Supabase Setup Guide

## Prerequisites
- Supabase project created at supabase.com
- `supabase` CLI installed: `npm install -g supabase`
- `.env.local` filled in from `.env.example`

## Steps

### 1. Link your project
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Run migrations
Applies all schema migrations in order (extensions, tables, triggers, RLS, storage):
```bash
supabase db push
```

### 3. Run static seed data
In the Supabase SQL editor (or via `supabase db query`), run `supabase/seed.sql`.
This inserts the demo organization and feature flags.

```bash
# Option A: SQL editor — paste contents of supabase/seed.sql
# Option B: CLI
cat supabase/seed.sql | supabase db query
```

### 4. Create demo users
Runs against the Admin Auth API to create auth users. The DB trigger `handle_new_user`
will automatically create a `profiles` row for each user.

```bash
npx ts-node --project tsconfig.json supabase/seed-users.ts
```

This script writes `supabase/seed-ids.json` with the generated UUIDs — you need these
in the next step.

### 4.5. Run demo data (class, lab, enrollments)
`seed-data.sql` creates the demo class, demo lab ("Measuring the Density of Water"),
4 lab steps, 2 pre-lab questions, a lab assignment, and student enrollments.

**Before running**, replace the three UUID placeholders with values from `seed-ids.json`:

```bash
# Read the IDs generated in step 4
TEACHER=$(jq -r '.teacher' supabase/seed-ids.json)
S1=$(jq -r '.["student1@westlake.demo"]' supabase/seed-ids.json)
S2=$(jq -r '.["student2@westlake.demo"]' supabase/seed-ids.json)

# Substitute and run
sed -e "s/TEACHER_ID_PLACEHOLDER/$TEACHER/g" \
    -e "s/STUDENT1_ID_PLACEHOLDER/$S1/g"     \
    -e "s/STUDENT2_ID_PLACEHOLDER/$S2/g"     \
    supabase/seed-data.sql | supabase db query
```

Or open `supabase/seed-data.sql` in the Supabase SQL editor, manually replace the
three `_PLACEHOLDER` strings, and run it.

### 5. Generate TypeScript types
Run this after any schema change to keep `types/database.ts` in sync:
```bash
supabase gen types typescript --linked > types/database.ts
```

## Migration Files
Run in order via `supabase db push`:
- `001_extensions_enums.sql` — PostgreSQL extensions and custom enums
- `002_core_tables.sql` — All application tables with indexes
- `003_triggers.sql` — Auto-timestamp and user creation triggers, role sync
- `004_rls.sql` — Row Level Security policies for all tables
- `005_storage_buckets.sql` — Storage bucket configuration and policies

## Seed Files
| File | Purpose |
|---|---|
| `seed.sql` | Demo organization + feature flags (static, no user UUIDs needed) |
| `seed-users.ts` | Creates auth users via Admin API, writes `seed-ids.json` |
| `seed-data.sql` | Demo class, lab, steps, questions, assignment, enrollments (needs UUIDs from `seed-ids.json`) |

## Demo Accounts (after seeding)
| Email | Password | Role |
|---|---|---|
| admin@westlake.demo | LabFlow2025! | School Admin |
| teacher@westlake.demo | LabFlow2025! | Teacher |
| student1@westlake.demo | LabFlow2025! | Student |
| student2@westlake.demo | LabFlow2025! | Student |

## Troubleshooting

### "relation 'profiles' does not exist" or "table not found"
Migrations have not been applied yet. Run `supabase db push` first (Step 2).

### "new row violates row-level security policy"
You are running a query as an authenticated user who does not have permission for that
table. For seed operations use the service role key, or run queries in the Supabase
SQL editor (which runs as the `postgres` superuser and bypasses RLS).

### "handle_new_user trigger failed" / user created but no profile row
The trigger reads `organization_id` from `user_metadata`. Make sure `seed.sql` has
already been run so the organization row exists before creating users. If the org row
is missing, the trigger will fail with a foreign key violation and no profile is created.
Fix: run `seed.sql`, then delete the orphaned auth users and re-run `seed-users.ts`.

### "duplicate key value violates unique constraint"
The seed script uses `ON CONFLICT ... DO NOTHING` so re-running is safe for most
tables. If you see this on `class_enrollments` or `lab_assignments`, it means the
row already exists — this is not an error.

### seed-ids.json is missing
You must run `seed-users.ts` (Step 4) before `seed-data.sql`. The script writes
`supabase/seed-ids.json` automatically. If you deleted it, re-run the script (existing
auth users will fail with a "User already exists" error — delete them in the Supabase
dashboard Auth section first, then re-run).
