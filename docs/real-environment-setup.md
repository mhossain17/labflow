# LabFlow Real Environment Setup (Starting With Main Teacher/Admin)

This guide is for a real school environment (not demo mode). It starts by creating one primary staff account with admin rights, then expands to teachers and students.

## 1. Prepare environment variables

Copy `.env.example` to `.env.local` and set at least:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For a real deployment, keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

## 2. Apply schema only (no demo seed data)

Run migrations:

```bash
supabase db push
```

Do not run `supabase/seed-all.mjs` or `supabase/seed-demo.mjs` in production.

## 3. Create your real organization row

Use the Supabase SQL editor (or CLI) to insert your school:

```sql
insert into public.organizations (id, name, slug, primary_color, secondary_color, footer_text)
values (
  gen_random_uuid(),
  'Your School Name',
  'your-school-code',
  '#1D4ED8',
  '#0EA5E9',
  'Powered by LabFlow'
);
```

Save the `slug` because students use it as the signup school code.

## 4. Bootstrap the first main teacher/admin account

Create one initial staff account with role `school_admin` via Supabase Auth Admin API. This is your first "lead teacher/admin" account.

Minimal Node script pattern:

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const orgId = 'YOUR_ORG_UUID'

await supabase.auth.admin.createUser({
  email: 'leadteacher@your-school.edu',
  password: 'set-a-strong-password',
  email_confirm: true,
  user_metadata: {
    organization_id: orgId,
    role: 'school_admin',
    first_name: 'Lead',
    last_name: 'Teacher',
  },
  app_metadata: {
    role: 'school_admin',
  },
})
```

Why this is needed:

- Public signup currently creates `student` accounts.
- Your first admin/staff account must be created through Admin API (or promoted manually in Supabase) so you can access admin features immediately.

## 5. First login and org configuration

Sign in as the lead teacher/admin and configure:

- `/admin/branding`
- `/admin/feature-flags`
- `/admin/users`
- `/admin/settings`

Then create classes and labs from teacher/admin flows.

## 6. Add additional staff accounts

Use one of these:

- Supabase Admin API (recommended for staff import)
- Create user, then update role to `teacher` or `school_admin` in `profiles` and `auth.users.app_metadata`

Role sync trigger updates `app_metadata.role` when `profiles.role` changes.

## 7. Student onboarding

Students can sign up with:

- First name / last name
- Email + password
- School code (`organizations.slug`)
- COPPA consent checkbox

After signup, enroll students into classes in teacher/admin workflows.

## 8. Turn off demo access in production

The login demo panel is intended for demo/non-production use. Keep your production environment free of demo accounts and demo credentials.

## 9. Recommended go-live checklist

- Run migrations only (no demo seeds)
- Confirm at least one `school_admin` account works end-to-end
- Verify signup with your real school code
- Verify RLS by testing teacher and student accounts in separate browsers
- Rotate any temporary bootstrap password immediately
