import { requireRole } from '@/lib/auth/role-guard'
import { listAllOrganizations } from '@/features/admin/queries'
import { impersonateOrg } from './actions'
import { CreateOrgDialog } from '@/components/super-admin/CreateOrgDialog'
import { OrgCodeRow } from '@/components/super-admin/OrgCodeRow'
import { Building2, ArrowRight } from 'lucide-react'

export default async function SuperAdminPage() {
  await requireRole(['super_admin'])

  const orgs = await listAllOrganizations()

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organizations and their join codes.
          </p>
        </div>
        <CreateOrgDialog />
      </div>

      {orgs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No organizations found. Create one to get started.</p>
      ) : (
        <div className="grid gap-3">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-lg border bg-card px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {org.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-10 w-16 object-contain rounded"
                    />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: org.primary_color || '#6366f1' }}
                    >
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">/{org.slug}</p>
                  </div>
                </div>
                <form action={impersonateOrg.bind(null, org.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <span>Manage</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>
              </div>

              <OrgCodeRow
                orgId={org.id}
                studentCode={org.student_code}
                staffCode={org.staff_code}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
