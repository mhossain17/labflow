import { redirect } from 'next/navigation'
import { getUserRole } from './session'
import type { UserRole } from '@/types/app'

export async function requireRole(allowedRoles: UserRole[], redirectTo = '/dashboard') {
  const role = await getUserRole()
  if (!role || !allowedRoles.includes(role)) redirect(redirectTo)
  return role
}

export async function requireAuth(redirectTo = '/login') {
  const role = await getUserRole()
  if (!role) redirect(redirectTo)
  return role
}
