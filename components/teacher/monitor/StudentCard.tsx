'use client'

import { formatDistanceToNow } from 'date-fns'
import type { StudentRunSnapshot } from '@/features/monitoring/realtime'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  on_track: { label: 'On Track', className: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800' },
  need_help: { label: 'Need Help', className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800' },
  stuck: { label: 'Stuck', className: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800' },
  waiting_for_check: { label: 'Waiting', className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800' },
  finished_step: { label: 'Finished Step', className: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800' },
}

const STATUS_BAR_COLOR: Record<string, string> = {
  on_track: 'bg-green-500',
  need_help: 'bg-amber-500',
  stuck: 'bg-red-500',
  waiting_for_check: 'bg-blue-500',
  finished_step: 'bg-purple-500',
}

interface StudentCardProps {
  run: StudentRunSnapshot
  totalSteps: number
}

export function StudentCard({ run, totalSteps }: StudentCardProps) {
  const status = STATUS_CONFIG[run.status] ?? { label: run.status, className: 'bg-muted text-muted-foreground border-muted' }
  const barColor = STATUS_BAR_COLOR[run.status] ?? 'bg-muted-foreground'

  const progress = totalSteps > 0 ? Math.min((run.current_step / totalSteps) * 100, 100) : 0

  let timeAgo = ''
  try {
    timeAgo = formatDistanceToNow(new Date(run.updated_at), { addSuffix: true })
  } catch {
    timeAgo = 'recently'
  }

  return (
    <Card size="sm" className="transition-shadow hover:shadow-md">
      <CardHeader className="border-b pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-tight">
            {run.first_name} {run.last_name}
          </CardTitle>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        {run.flag_count > 0 && (
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300">
              ⚠ {run.flag_count} flag{run.flag_count > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        {/* Step progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {run.current_step} / {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quick note */}
        {run.quick_note && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            &ldquo;{run.quick_note}&rdquo;
          </p>
        )}

        {/* Last updated */}
        <p className="text-xs text-muted-foreground">
          Updated {timeAgo}
        </p>
      </CardContent>
    </Card>
  )
}
