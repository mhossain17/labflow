import { requireRole } from '@/lib/auth/role-guard'
import { getProfile } from '@/lib/auth/session'
import { listProfilesByOrg } from '@/features/admin/queries'
import { UserTable } from '@/components/admin/UserTable'
import { getSession } from '@/lib/auth/session'

export default async function UsersPage() {
  await requireRole(['school_admin', 'super_admin'])

  const [profile, session] = await Promise.all([getProfile(), getSession()])
  if (!profile) return null

  const users = await listProfilesByOrg(profile.organization_id)
  const currentUserId = session?.id ?? ''

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage roles for all users in your organization.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? 'user' : 'users'} total
        </p>
      </div>

      <UserTable users={users} currentUserId={currentUserId} />
    </div>
  )
}
