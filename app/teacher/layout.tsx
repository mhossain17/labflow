import { requireRole } from '@/lib/auth/role-guard'
import { getProfile } from '@/lib/auth/session'
import { TopNav } from '@/components/shared/TopNav'
import { TeacherSidebar } from './TeacherSidebar'
import { BrandingProvider } from '@/components/shared/BrandingProvider'
import { getOrganization } from '@/features/admin/queries'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['teacher', 'school_admin', 'super_admin'])

  const profile = await getProfile()
  let org: { primary_color: string; secondary_color: string } | null = null
  if (profile && profile.organization_id) {
    try {
      org = await getOrganization(profile.organization_id)
    } catch {
      // Org fetch failure is non-fatal — defaults will be used
    }
  }

  return (
    <BrandingProvider org={org}>
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <TeacherSidebar role={profile?.role} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </BrandingProvider>
  )
}
