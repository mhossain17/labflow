import type { StudentRunSnapshot } from '@/features/monitoring/realtime'

interface MonitorStatsProps {
  runs: StudentRunSnapshot[]
  totalSteps: number
}

export function MonitorStats({ runs }: MonitorStatsProps) {
  const total = runs.length
  const onTrack = runs.filter(r => r.status === 'on_track').length
  const needsAttention = runs.filter(r => r.status === 'need_help' || r.status === 'stuck').length
  const waitingForCheck = runs.filter(r => r.status === 'waiting_for_check').length

  // Mode of current_step
  const stepCounts: Record<number, number> = {}
  for (const r of runs) {
    stepCounts[r.current_step] = (stepCounts[r.current_step] ?? 0) + 1
  }
  let mostCommonStep: number | null = null
  let maxCount = 0
  for (const [step, count] of Object.entries(stepCounts)) {
    if (count > maxCount) {
      maxCount = count
      mostCommonStep = Number(step)
    }
  }

  const stats = [
    {
      label: 'Total Students',
      value: total,
      description: 'enrolled in this session',
      color: 'text-foreground',
    },
    {
      label: 'On Track',
      value: onTrack,
      description: 'progressing normally',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Needs Attention',
      value: needsAttention,
      description: 'stuck or need help',
      color: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Waiting for Check',
      value: waitingForCheck,
      description: 'awaiting teacher review',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Common Step',
      value: mostCommonStep !== null ? `Step ${mostCommonStep}` : '—',
      description: mostCommonStep !== null ? `${maxCount} student${maxCount !== 1 ? 's' : ''}` : 'no data',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10"
        >
          <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>
        </div>
      ))}
    </div>
  )
}
