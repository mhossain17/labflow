'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth/session'
import { IMPERSONATE_COOKIE } from '@/lib/auth/session'

export async function impersonateOrg(orgId: string) {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATE_COOKIE, orgId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  redirect('/admin/branding')
}

export async function stopImpersonation() {
  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATE_COOKIE)
  redirect('/super-admin')
}
