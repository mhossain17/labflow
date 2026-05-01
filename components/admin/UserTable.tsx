'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Eye } from 'lucide-react'
import { updateUserRole } from '@/features/admin/actions'
import { startUserImpersonation } from '@/lib/auth/actions'
import { DeleteStudentDialog } from '@/components/admin/DeleteStudentDialog'
import type { UserRole } from '@/types/app'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: UserRole
}

interface UserTableProps {
  users: User[]
  currentUserId: string
  canImpersonate?: boolean
}

const ROLES = ['teacher', 'student', 'school_admin', 'super_admin'] as const
type RoleOption = (typeof ROLES)[number]

const ROLE_LABELS: Record<RoleOption, string> = {
  teacher: 'Teacher',
  student: 'Student',
  school_admin: 'School Admin',
  super_admin: 'Super Admin',
}

function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string
  currentRole: RoleOption
  disabled: boolean
}) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as RoleOption
    if (!ROLES.includes(newRole)) return
    const previousRole = role
    setRole(newRole)

    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
        toast.success('Role updated')
      } catch {
        setRole(previousRole)
        toast.error('Failed to update role')
      }
    })
  }

  return (
    <select
      value={role}
      onChange={handleChange}
      disabled={disabled || isPending}
      className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  )
}

function ActAsButton({ userId, role }: { userId: string; role: UserRole }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (role === 'school_admin' || role === 'super_admin') return null

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            const { redirectTo } = await startUserImpersonation(userId)
            router.push(redirectTo)
            router.refresh()
          } catch {
            toast.error('Could not switch to this user')
          }
        })
      }}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      title="View as this user"
    >
      <Eye className="h-3.5 w-3.5" />
      Act As
    </button>
  )
}

export function UserTable({ users, currentUserId, canImpersonate = true }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No users found in this organization.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => {
            const isSelf = user.id === currentUserId
            return (
              <tr
                key={user.id}
                className={`border-b border-border last:border-0 ${
                  idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                } ${isSelf ? 'bg-primary/5' : ''}`}
              >
                <td className="px-4 py-3 font-medium">
                  {user.first_name} {user.last_name}
                  {isSelf && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.email ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <RoleSelect
                    userId={user.id}
                    currentRole={user.role}
                    disabled={isSelf}
                  />
                </td>
                <td className="px-4 py-3">
                  {isSelf ? (
                    <span className="text-xs text-muted-foreground">Cannot edit own account</span>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      {canImpersonate && <ActAsButton userId={user.id} role={user.role} />}
                      <a
                        href={`/api/admin/export-student-data?studentId=${user.id}`}
                        download
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="Export student data"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </a>
                      {user.role === 'student' && (
                        <DeleteStudentDialog
                          userId={user.id}
                          userName={`${user.first_name} ${user.last_name}`}
                        />
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
