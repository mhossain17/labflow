'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  updateUserRoleSuperAdmin,
  approveStaffMemberSuperAdmin,
  resetUserPasswordSuperAdmin,
  deleteUserSuperAdmin,
} from '@/app/super-admin/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Organization, UserRole, ProfileStatus } from '@/types/app'
import type { SuperAdminUserRow } from '@/features/admin/queries'

const ROLES = ['teacher', 'student', 'school_admin', 'super_admin'] as const
const ROLE_LABELS: Record<UserRole, string> = {
  teacher: 'Teacher',
  student: 'Student',
  school_admin: 'School Admin',
  super_admin: 'Super Admin',
}

function RoleSelect({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole
    const prev = role
    setRole(newRole)
    startTransition(async () => {
      try {
        await updateUserRoleSuperAdmin(userId, newRole)
        toast.success('Role updated')
      } catch {
        setRole(prev)
        toast.error('Failed to update role')
      }
    })
  }

  return (
    <select
      value={role}
      onChange={handleChange}
      disabled={isPending}
      className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </select>
  )
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
            await approveStaffMemberSuperAdmin(userId)
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

function ResetPasswordDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await resetUserPasswordSuperAdmin(userId, password)
        toast.success('Password reset')
        setOpen(false)
        setPassword('')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reset password')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        Reset password
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            type="password"
            placeholder="New password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending || password.length < 8} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-xs text-destructive hover:underline">
        Delete
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This permanently removes their account and all associated lab data. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm border hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteUserSuperAdmin(userId)
                  toast.success(`${name} deleted`)
                  setOpen(false)
                } catch {
                  toast.error('Failed to delete user')
                }
              })
            }
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const STATUS_LABELS: Record<ProfileStatus, string> = {
  active: 'Active',
  pending_review: 'Pending',
}

interface SuperAdminUserTableProps {
  users: SuperAdminUserRow[]
  orgs: Organization[]
}

export function SuperAdminUserTable({ users, orgs }: SuperAdminUserTableProps) {
  const [filterOrgId, setFilterOrgId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'pending'>('all')

  const pending = users.filter((u) => u.status === 'pending_review')
  const filtered = users.filter((u) => {
    if (tab === 'pending' && u.status !== 'pending_review') return false
    if (filterOrgId && u.organization_id !== filterOrgId) return false
    if (search) {
      const q = search.toLowerCase()
      const name = `${u.first_name} ${u.last_name}`.toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      if (!name.includes(q) && !email.includes(q)) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={filterOrgId}
          onChange={(e) => setFilterOrgId(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All organizations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'all' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All users ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'pending' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Pending approval
          {pending.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              {pending.length}
            </span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {tab === 'pending' ? 'No staff members pending approval.' : 'No users match your filters.'}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td className="px-4 py-3 font-medium">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.organization_name}</td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={user.id} currentRole={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.status === 'pending_review'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {STATUS_LABELS[user.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.status === 'pending_review' && (
                        <ApproveButton userId={user.id} />
                      )}
                      <ResetPasswordDialog userId={user.id} />
                      <DeleteUserButton userId={user.id} name={`${user.first_name} ${user.last_name}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
