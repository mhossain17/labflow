import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types/app'

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

  return data as Profile | null
}

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getSession()
  if (!user) return null
  return (user.app_metadata?.role as UserRole) ?? null
}
