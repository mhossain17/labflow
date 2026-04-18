import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/app'

const VALID_ROLES: UserRole[] = ['teacher', 'student', 'school_admin', 'super_admin']

function parseRole(value: string): UserRole {
  if (VALID_ROLES.includes(value as UserRole)) {
    return value as UserRole
  }
  return 'student'
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
    .select('id, first_name, last_name, role')
    .eq('organization_id', orgId)
    .order('last_name', { ascending: true })
  if (error) throw error
  const profiles = (data ?? []) as Array<{
    id: string
    first_name: string
    last_name: string
    role: string
  }>
  return profiles.map((profile) => ({
    ...profile,
    role: parseRole(profile.role),
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
