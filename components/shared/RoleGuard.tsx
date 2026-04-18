import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/app'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  redirectTo?: string
}

export async function RoleGuard({ allowedRoles, children, redirectTo = '/dashboard' }: RoleGuardProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.app_metadata?.role as UserRole | undefined
  if (!role || !allowedRoles.includes(role)) redirect(redirectTo)

  return <>{children}</>
}
