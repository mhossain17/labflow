'use client'
import { stopImpersonation } from '@/app/super-admin/actions'
import { Shield, X } from 'lucide-react'

export function ImpersonationBanner({ orgName }: { orgName: string }) {
  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium shrink-0">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span>Platform Admin — managing <strong>{orgName}</strong></span>
      </div>
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
  )
}
