import { createClient } from '@/lib/supabase/server'
import { getImpersonatedOrgId } from '@/lib/auth/session'
import Image from 'next/image'
import Link from 'next/link'
import { TopNavUserMenu } from './TopNavUserMenu'
import type { Profile, Organization, UserRole } from '@/types/app'

function getHomeHref(role: UserRole | null, impersonatedOrgId: string | null) {
  if (role === 'teacher') return '/teacher/classes'
  if (role === 'school_admin') return '/teacher/classes'
  if (role === 'student') return '/student/labs'
  if (role === 'super_admin') return impersonatedOrgId ? '/admin/branding' : '/super-admin'
  return '/dashboard'
}

export async function TopNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  let org: Organization | null = null
  let homeHref = '/dashboard'

  if (user) {
    const role = (user.app_metadata?.role as UserRole | undefined) ?? null
    const impersonatedOrgId = role === 'super_admin' ? await getImpersonatedOrgId() : null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data: profileData } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData as Profile | null

    const orgIdForBranding = profile?.organization_id ?? impersonatedOrgId

    if (orgIdForBranding) {
      const { data: orgData } = await db
        .from('organizations')
        .select('*')
        .eq('id', orgIdForBranding)
        .single()
      org = orgData as Organization | null
    }

    homeHref = getHomeHref(role, impersonatedOrgId)
  }

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.email ?? 'User'

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase()

  return (
    <header className="border-b bg-card px-6 py-3 flex items-center justify-between h-14 shrink-0">
      {/* Left: org logo or name */}
      <div className="flex items-center gap-3">
        {org?.logo_url ? (
          <Link href={homeHref} className="flex items-center gap-2">
            <Image
              src={org.logo_url}
              alt={org.name}
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <span className="font-bold text-primary text-lg">LabFlow</span>
          </Link>
        ) : (
          <Link href={homeHref} className="flex items-center gap-2">
            <span className="font-bold text-primary text-lg">LabFlow</span>
          </Link>
        )}
      </div>

      {/* Right: avatar dropdown (client component) */}
      {user && (
        <TopNavUserMenu
          fullName={fullName}
          email={user.email ?? ''}
          initials={initials}
          avatarUrl={profile?.avatar_url}
          role={profile?.role}
        />
      )}
    </header>
  )
}
