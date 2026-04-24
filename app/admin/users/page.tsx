import { requireRole } from '@/lib/auth/role-guard'
import { getProfile } from '@/lib/auth/session'
import { listProfilesByOrg } from '@/features/admin/queries'
import { UserTable } from '@/components/admin/UserTable'
import { PendingStaffTable } from '@/components/admin/PendingStaffTable'
import { getSession } from '@/lib/auth/session'

export default async function UsersPage() {
  await requireRole(['school_admin', 'super_admin'])

  const [profile, session] = await Promise.all([getProfile(), getSession()])
  if (!profile || !profile.organization_id) return null

  const users = await listProfilesByOrg(profile.organization_id)
  const currentUserId = session?.id ?? ''

  const activeUsers = users.filter((u) => u.status === 'active')
  const pendingUsers = users.filter((u) => u.status === 'pending_review')

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage roles for all users in your organization.
        </p>
      </div>

      {pendingUsers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">
              Pending Approval
              <span className="ml-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 text-xs font-medium">
                {pendingUsers.length}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Staff members who signed up and are waiting to be approved.
            </p>
          </div>
          <PendingStaffTable users={pendingUsers} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {activeUsers.length} active {activeUsers.length === 1 ? 'user' : 'users'}
          </p>
        </div>
        <UserTable users={activeUsers} currentUserId={currentUserId} />
      </div>
    </div>
  )
}
