#!/usr/bin/env node
/**
 * One-time setup script:
 * 1. Remove any existing accounts for mhossain17@schools.nyc.gov
 * 2. Remove any non-demo organizations (keep aaaaaaaa-0000-0000-0000-000000000001)
 * 3. Create org "High School for Construction Trades, Engineering & Architecture" (slug: 27Q650)
 * 4. Create school_admin account for mhossain17@schools.nyc.gov in that org
 *
 * Usage: npx ts-node --project tsconfig.json supabase/setup-27Q650.ts
 */

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

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_ORG_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const TARGET_EMAIL = 'mhossain17@schools.nyc.gov'
const NEW_ORG_SLUG = '27Q650'
const NEW_ORG_NAME = 'High School for Construction Trades, Engineering & Architecture'

// Direct GoTrue admin REST call — more reliable than supabase-js wrapper for listing
async function authFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...((options.headers as Record<string, string>) ?? {}),
    },
  })
  const body = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, body }
}

async function run() {
  // ── 1. Delete any existing auth users with the target email ──────────────
  console.log(`\n[1] Checking for existing accounts: ${TARGET_EMAIL}`)

  // Use direct REST to list users (page through all)
  let page = 1
  let keepGoing = true
  while (keepGoing) {
    const { ok, body } = await authFetch(`/admin/users?page=${page}&per_page=50`)
    if (!ok) {
      console.warn(`  listUsers failed: ${JSON.stringify(body)}`)
      break
    }
    const users: { id: string; email: string }[] = body.users ?? []
    keepGoing = users.length === 50
    page++
    for (const u of users) {
      if (u.email === TARGET_EMAIL) {
        console.log(`  Deleting auth user ${u.id} (${u.email})`)
        const { ok: delOk, body: delBody } = await authFetch(`/admin/users/${u.id}`, { method: 'DELETE' })
        if (!delOk) console.error(`  Failed: ${JSON.stringify(delBody)}`)
        else console.log(`  Deleted.`)
      }
    }
  }

  // ── 2. Remove non-demo organizations ────────────────────────────────────
  console.log(`\n[2] Removing non-demo organizations (keeping ${DEMO_ORG_ID})`)
  const { data: orgs, error: orgsErr } = await admin
    .from('organizations')
    .select('id, name, slug')
    .neq('id', DEMO_ORG_ID)
  if (orgsErr) throw orgsErr

  for (const org of orgs ?? []) {
    console.log(`  Deleting org: ${org.name} (${org.slug} / ${org.id})`)
    // Delete auth users in this org first (profiles cascade from auth.users)
    const { data: profiles } = await admin
      .from('profiles')
      .select('id')
      .eq('organization_id', org.id)
    for (const p of profiles ?? []) {
      const { ok, body } = await authFetch(`/admin/users/${p.id}`, { method: 'DELETE' })
      if (!ok) console.error(`  Failed deleting user ${p.id}: ${JSON.stringify(body)}`)
      else console.log(`  Deleted user ${p.id}`)
    }
    const { error } = await admin.from('organizations').delete().eq('id', org.id)
    if (error) console.error(`  Failed deleting org: ${error.message}`)
    else console.log(`  Deleted org.`)
  }

  // ── 3. Create the new org ────────────────────────────────────────────────
  console.log(`\n[3] Creating organization: ${NEW_ORG_NAME}`)

  // Check if org with this slug already exists (from a previous partial run)
  const { data: existingOrg } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', NEW_ORG_SLUG)
    .maybeSingle()

  let newOrgId: string
  if (existingOrg) {
    newOrgId = existingOrg.id
    console.log(`  Org already exists: ${newOrgId}`)
  } else {
    const { data: newOrg, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: NEW_ORG_NAME,
        slug: NEW_ORG_SLUG,
        primary_color: '#2563EB',
        secondary_color: '#7C3AED',
        footer_text: 'Powered by LabFlow',
      })
      .select()
      .single()
    if (orgErr) throw orgErr
    newOrgId = newOrg.id
    console.log(`  Created org ${newOrgId}`)

    await admin.from('feature_flags').insert([
      { organization_id: newOrgId, flag_key: 'ai_lab_generation', enabled: true },
      { organization_id: newOrgId, flag_key: 'help_chat', enabled: true },
      { organization_id: newOrgId, flag_key: 'analytics', enabled: true },
    ])
    console.log(`  Feature flags created.`)
  }

  // ── 4. Create admin user via direct REST ─────────────────────────────────
  console.log(`\n[4] Creating admin user: ${TARGET_EMAIL}`)
  const { ok, status, body: createBody } = await authFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: TARGET_EMAIL,
      password: 'LabFlow2025!',
      email_confirm: true,
      user_metadata: {
        organization_id: newOrgId,
        role: 'school_admin',
        first_name: 'Mohammed',
        last_name: 'Hossain',
      },
      app_metadata: {
        role: 'school_admin',
      },
    }),
  })
  if (!ok) throw new Error(`createUser failed (${status}): ${JSON.stringify(createBody)}`)
  const userId = createBody.id
  console.log(`  Created user ${userId}`)

  // ── 5. Verify profile was auto-created by trigger ────────────────────────
  console.log(`\n[5] Verifying profile...`)
  await new Promise(r => setTimeout(r, 1000)) // brief wait for trigger
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (profile) {
    console.log(`  Profile OK: role=${profile.role}, org=${profile.organization_id}`)
    if (profile.organization_id !== newOrgId) {
      console.warn(`  Wrong org on profile! Fixing...`)
      await admin.from('profiles').update({ organization_id: newOrgId, role: 'school_admin' }).eq('id', userId)
      console.log(`  Fixed.`)
    }
  } else {
    console.warn(`  Profile not found — trigger may have failed. Creating manually...`)
    const { error: pErr } = await admin.from('profiles').insert({
      id: userId,
      organization_id: newOrgId,
      role: 'school_admin',
      first_name: 'Mohammed',
      last_name: 'Hossain',
    })
    if (pErr) console.error(`  Profile insert failed: ${pErr.message}`)
    else console.log(`  Profile created manually.`)
  }

  console.log('\nDone.')
  console.log(`\nSummary:`)
  console.log(`  Org: ${NEW_ORG_NAME} (${NEW_ORG_SLUG}) → ${newOrgId}`)
  console.log(`  Admin: ${TARGET_EMAIL} / LabFlow2025!`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
