import { requireRole } from '@/lib/auth/role-guard'
import { listAllUsersWithEmails, listAllOrganizations } from '@/features/admin/queries'
import { SuperAdminUserTable } from '@/components/super-admin/SuperAdminUserTable'

export default async function SuperAdminUsersPage() {
  await requireRole(['super_admin'])

  const [users, orgs] = await Promise.all([
    listAllUsersWithEmails(),
    listAllOrganizations(),
  ])

  const pending = users.filter((u) => u.status === 'pending_review')

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">All Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users.length} {users.length === 1 ? 'user' : 'users'} across {orgs.length} {orgs.length === 1 ? 'organization' : 'organizations'}.
          {pending.length > 0 && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
              {pending.length} pending approval.
            </span>
          )}
        </p>
      </div>

      <SuperAdminUserTable users={users} orgs={orgs} />
    </div>
  )
}
