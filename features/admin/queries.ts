import { createClient } from '@/lib/supabase/server'

export async function getOrganization(orgId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('profiles')
    .select('id, first_name, last_name, role, email')
    .eq('organization_id', orgId)
    .order('last_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as Array<{
    id: string
    first_name: string
    last_name: string
    role: string
    email: string | null
  }>
}

export async function listFeatureFlags(orgId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('feature_flags')
    .select('id, flag_key, enabled')
    .eq('organization_id', orgId)
  if (error) throw error
  return (data ?? []) as Array<{ id: string; flag_key: string; enabled: boolean }>
}
