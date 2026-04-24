import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Organization, UserRole, ProfileStatus } from '@/types/app'

const VALID_ROLES: UserRole[] = ['teacher', 'student', 'school_admin', 'super_admin']

function parseRole(value: string): UserRole {
  if (VALID_ROLES.includes(value as UserRole)) {
    return value as UserRole
  }
  return 'student'
}

export async function listAllOrganizations(): Promise<Organization[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color, secondary_color, student_code, staff_code, created_at, updated_at')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Organization[]
}

export async function getOrganization(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color, secondary_color, footer_text')
    .eq('id', orgId)
    .single()
  if (error) throw error
  return data as {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string
    secondary_color: string
    footer_text: string | null
  }
}

export async function listProfilesByOrg(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, status')
    .eq('organization_id', orgId)
    .order('last_name', { ascending: true })
  if (error) throw error
  const profiles = (data ?? []) as Array<{
    id: string
    first_name: string
    last_name: string
    role: string
    status: string
  }>
  return profiles.map((profile) => ({
    ...profile,
    role: parseRole(profile.role),
    status: (profile.status ?? 'active') as ProfileStatus,
    email: null,
  }))
}

export async function listFeatureFlags(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feature_flags')
    .select('id, flag_key, enabled')
    .eq('organization_id', orgId)
  if (error) throw error
  return (data ?? []) as Array<{ id: string; flag_key: string; enabled: boolean }>
}

export type SuperAdminUserRow = {
  id: string
  organization_id: string | null
  organization_name: string
  first_name: string
  last_name: string
  email: string | null
  role: UserRole
  status: ProfileStatus
  created_at: string
}

export async function listAllUsersWithEmails(): Promise<SuperAdminUserRow[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, organization_id, first_name, last_name, role, status, created_at, organizations(name)')
    .order('last_name', { ascending: true })

  if (error) throw error

  const profiles: SuperAdminUserRow[] = (data ?? []).map((row: {
    id: string
    organization_id: string | null
    first_name: string
    last_name: string
    role: string
    status: string
    created_at: string
    organizations: { name: string } | null
  }) => ({
    id: row.id,
    organization_id: row.organization_id,
    organization_name: row.organizations?.name ?? '—',
    first_name: row.first_name,
    last_name: row.last_name,
    email: null,
    role: parseRole(row.role),
    status: (row.status ?? 'active') as ProfileStatus,
    created_at: row.created_at,
  }))

  // Merge emails from auth.users via Admin API (service role only)
  const adminClient = createAdminClient()
  if (adminClient) {
    const emailMap: Record<string, string> = {}
    let page = 1
    while (true) {
      const { data: authData } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 })
      if (!authData?.users?.length) break
      for (const u of authData.users) {
        if (u.email) emailMap[u.id] = u.email
      }
      if (authData.users.length < 1000) break
      page++
    }
    for (const profile of profiles) {
      profile.email = emailMap[profile.id] ?? null
    }
  }

  return profiles
}
