import { stopImpersonation, switchImpersonatedOrg, switchImpersonatedUser } from '@/app/super-admin/actions'
import { Shield, X } from 'lucide-react'

type ImpersonationTarget = {
  id: string
  name: string
}

type ImpersonationUser = {
  id: string
  name: string
  role: 'teacher' | 'student'
}

interface ImpersonationBannerProps {
  orgName: string
  currentOrgId: string
  orgOptions: ImpersonationTarget[]
  userOptions: ImpersonationUser[]
  currentUserId: string | null
}

export function ImpersonationBanner({
  orgName,
  currentOrgId,
  orgOptions,
  userOptions,
  currentUserId,
}: ImpersonationBannerProps) {
  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm font-medium shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span>Platform Admin — managing <strong>{orgName}</strong></span>
      </div>
      <div className="flex items-center gap-2">
        {orgOptions.length > 0 && (
          <form action={switchImpersonatedOrg} className="flex items-center gap-2">
            <label htmlFor="impersonation-org" className="sr-only">Switch organization</label>
            <select
              id="impersonation-org"
              name="orgId"
              defaultValue={currentOrgId}
              className="h-8 min-w-44 rounded border border-amber-700/40 bg-amber-50/70 px-2 text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-900/50"
            >
              {orgOptions.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded px-2 py-1 text-xs hover:bg-amber-600/30 transition-colors"
            >
              Switch
            </button>
          </form>
        )}
        {userOptions.length > 0 && (
          <form action={switchImpersonatedUser} className="flex items-center gap-2">
            <input type="hidden" name="orgId" value={currentOrgId} />
            <label htmlFor="impersonation-user" className="sr-only">Act as user</label>
            <select
              id="impersonation-user"
              name="userId"
              required
              defaultValue={currentUserId ?? ''}
              className="h-8 min-w-52 rounded border border-amber-700/40 bg-amber-50/70 px-2 text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-900/50"
            >
              <option value="" disabled>Select user to act as</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role === 'teacher' ? 'Teacher' : 'Student'})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded px-2 py-1 text-xs hover:bg-amber-600/30 transition-colors"
            >
              Act As
            </button>
          </form>
        )}
        <form action={stopImpersonation}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-amber-600/30 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Exit
          </button>
        </form>
      </div>
    </div>
  )
}
