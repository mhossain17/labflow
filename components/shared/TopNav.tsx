import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { TopNavUserMenu } from './TopNavUserMenu'
import type { Profile, Organization } from '@/types/app'

export async function TopNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  let org: Organization | null = null

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data: profileData } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData as Profile | null

    if (profile?.organization_id) {
      const { data: orgData } = await db
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()
      org = orgData as Organization | null
    }
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
          <Link href="/dashboard" className="flex items-center">
            <Image
              src={org.logo_url}
              alt={org.name}
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </Link>
        ) : (
          <Link href="/dashboard" className="font-bold text-primary text-lg">
            {org?.name ?? 'LabFlow'}
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
        />
      )}
    </header>
  )
}
