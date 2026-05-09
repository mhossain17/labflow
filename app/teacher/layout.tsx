import { requireRole } from '@/lib/auth/role-guard'
import { getProfile, getRealProfile, getImpersonatedOrgId, getImpersonatedUserId } from '@/lib/auth/session'
import { TopNav } from '@/components/shared/TopNav'
import { TeacherSidebar } from './TeacherSidebar'
import { BrandingProvider } from '@/components/shared/BrandingProvider'
import { getOrganization, listAllOrganizations, listImpersonableUsersByOrg } from '@/features/admin/queries'
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['teacher', 'school_admin', 'super_admin'])

  const profile = await getProfile()
  let org: { id: string; name: string; primary_color: string; secondary_color: string } | null = null
  if (profile && profile.organization_id) {
    try {
      org = await getOrganization(profile.organization_id)
    } catch {
      // Org fetch failure is non-fatal — defaults will be used
    }
  }

  const realProfile = await getRealProfile()
  const isRealSuperAdmin = realProfile?.role === 'super_admin'
  const impersonatedOrgId = isRealSuperAdmin ? await getImpersonatedOrgId() : null
  const impersonatedUserId = isRealSuperAdmin ? await getImpersonatedUserId() : null

  let orgOptions: Array<{ id: string; name: string }> = []
  let userOptions: Array<{ id: string; name: string; role: 'teacher' | 'student' }> = []

  if (isRealSuperAdmin && impersonatedOrgId) {
    try {
      const [orgs, users] = await Promise.all([
        listAllOrganizations(),
        listImpersonableUsersByOrg(impersonatedOrgId),
      ])
      orgOptions = orgs.map(({ id, name }) => ({ id, name }))
      userOptions = users.map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        role: user.role,
      }))
    } catch {
      // Non-fatal: page can render without switcher data
    }
  }

  const currentOrgName = org?.name
    ?? orgOptions.find((item) => item.id === impersonatedOrgId)?.name
    ?? 'Selected Organization'

  return (
    <BrandingProvider org={org}>
      <div className="min-h-screen flex flex-col bg-background">
        {isRealSuperAdmin && impersonatedOrgId && (
          <ImpersonationBanner
            orgName={currentOrgName}
            currentOrgId={impersonatedOrgId}
            orgOptions={orgOptions}
            userOptions={userOptions}
            currentUserId={impersonatedUserId}
          />
        )}
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <TeacherSidebar role={profile?.role} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </BrandingProvider>
  )
}
