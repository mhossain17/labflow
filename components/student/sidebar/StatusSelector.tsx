'use client'
import { useStudentStatus } from '@/hooks/useStudentStatus'
import type { StudentWorkStatus } from '@/types/app'

const STATUS_OPTIONS: {
  value: StudentWorkStatus
  label: string
  color: string
}[] = [
  { value: 'on_track', label: 'On Track', color: 'text-green-600 dark:text-green-400' },
  { value: 'need_help', label: 'Need Help', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'stuck', label: 'Stuck', color: 'text-red-600 dark:text-red-400' },
  { value: 'waiting_for_check', label: 'Waiting for Teacher', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'finished_step', label: 'Finished This Step', color: 'text-purple-600 dark:text-purple-400' },
]

interface Props {
  labRunId: string
  initialStatus: StudentWorkStatus
}

export function StatusSelector({ labRunId, initialStatus }: Props) {
  const { status, changeStatus, isPending } = useStudentStatus(labRunId, initialStatus)

  const current = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0]

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Status</p>
      <select
        value={status}
        onChange={(e) => changeStatus(e.target.value as StudentWorkStatus)}
        disabled={isPending}
        className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-opacity ${current.color} ${isPending ? 'opacity-60' : ''}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
