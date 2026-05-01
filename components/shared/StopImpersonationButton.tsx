'use client'
import { stopUserImpersonation } from '@/lib/auth/actions'

export function StopImpersonationButton() {
  return (
    <form action={stopUserImpersonation}>
      <button
        type="submit"
        className="rounded bg-yellow-700 text-yellow-50 px-3 py-0.5 text-xs font-medium hover:bg-yellow-800 transition-colors"
      >
        Stop Viewing
      </button>
    </form>
  )
}
