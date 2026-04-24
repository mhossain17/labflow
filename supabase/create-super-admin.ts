#!/usr/bin/env npx ts-node --project tsconfig.json
/**
 * create-super-admin.ts
 *
 * Full user reset + fresh super admin creation.
 *
 * What it does:
 *   1. Deletes ALL existing auth users (paginated)
 *   2. Creates a fresh super_admin account: admin@labflow.dev
 *
 * Usage:
 *   npx ts-node --project tsconfig.json supabase/create-super-admin.ts
 *
 * Set SUPER_ADMIN_PASSWORD env var to override the default password.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SUPER_ADMIN_EMAIL    = 'admin@labflow.dev'
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? 'ChangeMe2025!'

async function deleteAllUsers(): Promise<number> {
  let totalDeleted = 0
  let page = 1

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      console.error('  listUsers error:', error.message)
      process.exit(1)
    }
    if (!data.users.length) break

    for (const user of data.users) {
      const { error: delErr } = await adminClient.auth.admin.deleteUser(user.id)
      if (delErr) {
        console.warn(`  Could not delete ${user.email ?? user.id}: ${delErr.message}`)
      } else {
        totalDeleted++
        console.log(`  Deleted ${user.email ?? user.id}`)
      }
    }

    if (data.users.length < 1000) break
    page++
  }

  return totalDeleted
}

async function main() {
  console.log('=== LabFlow User Reset ===\n')

  // Step 1: Delete all existing users
  console.log('Deleting all existing auth users...')
  const deleted = await deleteAllUsers()
  console.log(`Done. Deleted ${deleted} user(s).\n`)

  // Step 2: Create fresh super admin
  // organization_id is intentionally omitted — super_admin has no org
  console.log(`Creating super admin: ${SUPER_ADMIN_EMAIL}`)
  const { data, error } = await adminClient.auth.admin.createUser({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: 'super_admin',
      first_name: 'Platform',
      last_name: 'Admin',
    },
    app_metadata: { role: 'super_admin' },
  })

  if (error) {
    console.error('Failed to create super admin:', error.message)
    process.exit(1)
  }

  console.log('\n✓ Super admin created successfully!')
  console.log(`  Email:    ${SUPER_ADMIN_EMAIL}`)
  console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`)
  console.log(`  User ID:  ${data.user?.id}`)
  console.log('\nIMPORTANT: Change the password immediately after first login.')
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
