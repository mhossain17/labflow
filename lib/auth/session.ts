import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types/app'

export const IMPERSONATE_COOKIE = 'labflow_impersonate_org'

export async function getImpersonatedOrgId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!data) return null

  const profile = data as Profile

  // For super_admin: inject the impersonated org so all admin pages work transparently
  if (profile.role === 'super_admin') {
    const impersonatedOrgId = await getImpersonatedOrgId()
    if (impersonatedOrgId) {
      return { ...profile, organization_id: impersonatedOrgId }
    }
  }

  return profile
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getSession()
  if (!user) return null
  return (user.app_metadata?.role as UserRole) ?? null
}
