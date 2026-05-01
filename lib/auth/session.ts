import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types/app'

export const IMPERSONATE_COOKIE = 'labflow_impersonate_org'
export const IMPERSONATE_USER_COOKIE = 'labflow_impersonate_user'

export async function getImpersonatedOrgId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null
}

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(IMPERSONATE_USER_COOKIE)?.value ?? null
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Returns the real authenticated user's profile — never affected by impersonation.
export async function getRealProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from('profiles').select('*').eq('id', user.id).single()
  return (data as Profile) ?? null
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const realRole = user.app_metadata?.role as UserRole

  // User impersonation: school_admin / super_admin can view as another user
  if (realRole === 'school_admin' || realRole === 'super_admin') {
    const impersonatedUserId = await getImpersonatedUserId()
    if (impersonatedUserId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: targetProfile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', impersonatedUserId)
        .single()

      if (targetProfile) {
        // Security: school_admin can only impersonate within their org
        if (realRole === 'school_admin') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: adminProfile } = await (supabase as any)
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()
          if (adminProfile?.organization_id !== targetProfile.organization_id) {
            // Org mismatch — clear bad cookie and fall through
            const cookieStore = await cookies()
            cookieStore.delete(IMPERSONATE_USER_COOKIE)
          } else {
            return targetProfile as Profile
          }
        } else {
          return targetProfile as Profile
        }
      }
    }
  }

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

  const realRole = user.app_metadata?.role as UserRole

  // When impersonating a user, return their role for route guards
  if (realRole === 'school_admin' || realRole === 'super_admin') {
    const impersonatedUserId = await getImpersonatedUserId()
    if (impersonatedUserId) {
      const supabase = await createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', impersonatedUserId)
        .single()
      if (data?.role) return data.role as UserRole
    }
  }

  return realRole ?? null
}
