import { requireRole } from '@/lib/auth/role-guard'
import { getProfile, getImpersonatedOrgId } from '@/lib/auth/session'
import { TopNav } from '@/components/shared/TopNav'
import { AdminSidebar } from './AdminSidebar'
import { BrandingProvider } from '@/components/shared/BrandingProvider'
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner'
import { getOrganization } from '@/features/admin/queries'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await requireRole(['school_admin', 'super_admin'])

  const profile = await getProfile()
  let org: { id: string; name: string; primary_color: string; secondary_color: string } | null = null
  if (profile) {
    try {
      org = await getOrganization(profile.organization_id)
    } catch {
      // Org fetch failure is non-fatal — defaults will be used
    }
  }

  const impersonatedOrgId = role === 'super_admin' ? await getImpersonatedOrgId() : null

  return (
    <BrandingProvider org={org}>
      <div className="min-h-screen flex flex-col bg-background">
        {impersonatedOrgId && org && (
          <ImpersonationBanner orgName={org.name} />
        )}
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </BrandingProvider>
  )
}
