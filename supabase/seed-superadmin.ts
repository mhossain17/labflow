#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PLATFORM_ORG_ID = 'ffffffff-0000-0000-0000-000000000001'

async function main() {
  // Ensure platform org exists (profiles.organization_id is NOT NULL)
  const { error: orgError } = await adminClient
    .from('organizations')
    .upsert({
      id: PLATFORM_ORG_ID,
      name: 'LabFlow Platform',
      slug: 'labflow-platform',
      primary_color: '#6366f1',
      secondary_color: '#a5b4fc',
    }, { onConflict: 'id' })

  if (orgError) {
    console.error('Failed to create platform org:', orgError.message)
    process.exit(1)
  }
  console.log('Platform org ready.')

  const email = 'superadmin@labflow.dev'

  // Delete existing user if present
  const { data: existing } = await adminClient.auth.admin.listUsers()
  const existingUser = existing?.users?.find((u: { email?: string }) => u.email === email)
  if (existingUser) {
    console.log(`Deleting existing user ${email}...`)
    await adminClient.auth.admin.deleteUser(existingUser.id)
  }

  console.log(`Creating ${email}...`)
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: 'LabFlow2025!',
    email_confirm: true,
    user_metadata: {
      role: 'super_admin',
      first_name: 'Super',
      last_name: 'Admin',
      organization_id: PLATFORM_ORG_ID,
    },
    app_metadata: { role: 'super_admin' },
  })

  if (error) {
    console.error('Failed:', error.message)
    process.exit(1)
  }

  console.log(`Created ${email} → ${data.user?.id}`)
  console.log('Login with: superadmin@labflow.dev / LabFlow2025!')
}

main().catch(console.error)
