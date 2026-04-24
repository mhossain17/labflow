import { requireRole } from '@/lib/auth/role-guard'
import { getProfile } from '@/lib/auth/session'
import { getOrganization } from '@/features/admin/queries'
import { BrandingPanel } from '@/components/admin/BrandingPanel'

export default async function BrandingPage() {
  await requireRole(['school_admin', 'super_admin'])

  const profile = await getProfile()
  if (!profile || !profile.organization_id) return null

  const org = await getOrganization(profile.organization_id)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">School Branding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your school&apos;s name, logo, and brand colors.
        </p>
      </div>
      <BrandingPanel org={org} />
    </div>
  )
}
