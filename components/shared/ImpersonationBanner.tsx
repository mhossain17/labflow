import { cookies } from 'next/headers'
import { IMPERSONATE_USER_COOKIE } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { StopImpersonationButton } from './StopImpersonationButton'

export async function ImpersonationBanner() {
  const cookieStore = await cookies()
  const impersonatedUserId = cookieStore.get(IMPERSONATE_USER_COOKIE)?.value
  if (!impersonatedUserId) return null

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', impersonatedUserId)
    .single()

  if (!profile) return null

  const roleLabel: Record<string, string> = {
    student: 'Student',
    teacher: 'Teacher',
    school_admin: 'Admin',
    super_admin: 'Super Admin',
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-yellow-400 dark:bg-yellow-500 text-yellow-900 px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium shadow-sm">
      <span className="truncate">
        👁 Viewing as{' '}
        <strong>
          {profile.first_name} {profile.last_name}
        </strong>{' '}
        ({roleLabel[profile.role] ?? profile.role})
      </span>
      <StopImpersonationButton />
    </div>
  )
}
