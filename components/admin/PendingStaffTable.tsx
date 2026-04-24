'use client'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { approveStaffMember } from '@/features/admin/actions'
import type { UserRole, ProfileStatus } from '@/types/app'

interface PendingUser {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: UserRole
  status: ProfileStatus
}

interface PendingStaffTableProps {
  users: PendingUser[]
}

function ApproveButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await approveStaffMember(userId)
            toast.success('Staff member approved')
          } catch {
            toast.error('Failed to approve')
          }
        })
      }
      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Approving…' : 'Approve'}
    </button>
  )
}

export function PendingStaffTable({ users }: PendingStaffTableProps) {
  if (users.length === 0) return null

  return (
    <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-yellow-100 dark:border-yellow-900/30 last:border-0 bg-background">
              <td className="px-4 py-3 font-medium">
                {user.first_name} {user.last_name}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{user.email ?? '—'}</td>
              <td className="px-4 py-3">
                <ApproveButton userId={user.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
