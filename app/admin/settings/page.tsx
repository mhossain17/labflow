import { requireRole } from '@/lib/auth/role-guard'
import { getProfile } from '@/lib/auth/session'
import { getOrganization } from '@/features/admin/queries'
import { OrgSettingsForm } from '@/components/admin/OrgSettingsForm'

export default async function AdminSettingsPage() {
  await requireRole(['school_admin', 'super_admin'])

  const profile = await getProfile()
  if (!profile) return null

  const org = await getOrganization(profile.organization_id)

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your school&apos;s account and general settings.
        </p>
      </div>

      <OrgSettingsForm org={org} />

      {/* Account info section */}
      <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold">Account Information</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <span className="text-muted-foreground">Organization ID</span>
          <span className="font-mono text-xs break-all">{org.id}</span>
          <span className="text-muted-foreground">Slug</span>
          <span className="font-mono">{org.slug}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Contact support to change your organization slug or transfer account ownership.
        </p>
      </div>
    </div>
  )
}
