'use server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IMPERSONATE_USER_COOKIE, getRealProfile } from './session'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function startUserImpersonation(userId: string): Promise<{ redirectTo: string }> {
  const realProfile = await getRealProfile()
  if (!realProfile || (realProfile.role !== 'school_admin' && realProfile.role !== 'super_admin')) {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: target } = await (supabase as any)
    .from('profiles')
    .select('id, role, first_name, last_name, organization_id')
    .eq('id', userId)
    .single()

  if (!target) throw new Error('User not found')
  if (target.id === realProfile.id) throw new Error('Cannot impersonate yourself')
  if (target.role === 'school_admin' || target.role === 'super_admin') {
    throw new Error('Cannot impersonate admin users')
  }
  if (
    realProfile.role === 'school_admin' &&
    target.organization_id !== realProfile.organization_id
  ) {
    throw new Error('Cannot impersonate users from another organization')
  }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATE_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })

  const roleRedirects: Record<string, string> = {
    teacher: '/teacher',
    student: '/student',
  }
  return { redirectTo: roleRedirects[target.role] ?? '/dashboard' }
}

export async function stopUserImpersonation() {
  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATE_USER_COOKIE)
  redirect('/admin/users')
}

