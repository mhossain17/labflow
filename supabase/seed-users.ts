#!/usr/bin/env node
/**
 * Seed script: creates demo users via Supabase Admin Auth API.
 * Run AFTER migrations and static seed.sql.
 * It also runs supabase/seed-data.sql and supabase/seed-demo-rich.sql.
 * Usage: npx ts-node --project tsconfig.json supabase/seed-users.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { execSync } from 'child_process'

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

const ORG_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

const SUPER_ADMIN = {
  email: 'superadmin@labflow.dev',
  password: 'LabFlow2025!',
  role: 'super_admin',
  first_name: 'Super',
  last_name: 'Admin',
}

const DEMO_USERS = [
  {
    email: 'demo@westlake.demo',
    password: 'LabFlow2025!',
    role: 'school_admin',
    first_name: 'Demo',
    last_name: 'Gateway',
  },
  {
    email: 'admin@westlake.demo',
    password: 'LabFlow2025!',
    role: 'school_admin',
    first_name: 'Alice',
    last_name: 'Admin',
  },
  {
    email: 'teacher@westlake.demo',
    password: 'LabFlow2025!',
    role: 'teacher',
    first_name: 'Taylor',
    last_name: 'Teacher',
  },
  {
    email: 'student1@westlake.demo',
    password: 'LabFlow2025!',
    role: 'student',
    first_name: 'Sam',
    last_name: 'Student',
  },
  {
    email: 'student2@westlake.demo',
    password: 'LabFlow2025!',
    role: 'student',
    first_name: 'Jordan',
    last_name: 'Learner',
  },
  {
    email: 'student3@westlake.demo',
    password: 'LabFlow2025!',
    role: 'student',
    first_name: 'Alex',
    last_name: 'Chen',
  },
  {
    email: 'student4@westlake.demo',
    password: 'LabFlow2025!',
    role: 'student',
    first_name: 'Maya',
    last_name: 'Rodriguez',
  },
  {
    email: 'student5@westlake.demo',
    password: 'LabFlow2025!',
    role: 'student',
    first_name: 'Ethan',
    last_name: 'Park',
  },
  {
    email: 'student6@westlake.demo',
    password: 'LabFlow2025!',
    role: 'student',
    first_name: 'Sofia',
    last_name: 'Williams',
  },
]

async function seedUsers() {
  const createdIds: Record<string, string> = {}

  // Create super admin (no org)
  console.log(`Creating super admin: ${SUPER_ADMIN.email}`)
  const { data: saData, error: saError } = await adminClient.auth.admin.createUser({
    email: SUPER_ADMIN.email,
    password: SUPER_ADMIN.password,
    email_confirm: true,
    user_metadata: {
      role: SUPER_ADMIN.role,
      first_name: SUPER_ADMIN.first_name,
      last_name: SUPER_ADMIN.last_name,
    },
    app_metadata: { role: SUPER_ADMIN.role },
  })
  if (saError) {
    console.error(`Failed to create super admin:`, saError.message)
  } else {
    console.log(`  Created ${SUPER_ADMIN.email} → ${saData.user?.id}`)
    if (saData.user?.id) createdIds['super_admin'] = saData.user.id
  }

  for (const user of DEMO_USERS) {
    console.log(`Creating user: ${user.email}`)
    const { data, error } = await adminClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        organization_id: ORG_ID,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      app_metadata: {
        role: user.role,
      },
    })

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message)
      continue
    }

    const id = data.user?.id
    if (id) {
      createdIds[user.role === 'teacher' ? 'teacher' : user.email] = id
      console.log(`  Created ${user.email} → ${id}`)
    }
  }

  // Write IDs to a file for the next seed step
  const outputPath = path.resolve(process.cwd(), 'supabase/seed-ids.json')
  fs.writeFileSync(outputPath, JSON.stringify(createdIds, null, 2))
  console.log(`\nUser IDs written to ${outputPath}`)

  console.log('\nSeeding relational demo data...')
  execSync('supabase db query --file supabase/seed-data.sql', { stdio: 'inherit' })
  execSync('supabase db query --file supabase/seed-demo-rich.sql', { stdio: 'inherit' })
  console.log('\nDemo seed completed.')
}

seedUsers().catch(console.error)
