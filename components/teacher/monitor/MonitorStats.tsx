'use client'
import { useState } from 'react'
import type { StudentRunSnapshot } from '@/features/monitoring/realtime'

interface MonitorStatsProps {
  runs: StudentRunSnapshot[]
  totalSteps: number
}

export function MonitorStats({ runs }: MonitorStatsProps) {
  const [hoveredStat, setHoveredStat] = useState<string | null>(null)

  const total = runs.length
  const onTrackRuns = runs.filter(r => r.status === 'on_track')
  const needsAttentionRuns = runs.filter(r => r.status === 'need_help' || r.status === 'stuck')
  const waitingForCheckRuns = runs.filter(r => r.status === 'waiting_for_check')

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

  const commonStepRuns = mostCommonStep !== null
    ? runs.filter(r => r.current_step === mostCommonStep)
    : []

  const stats = [
    {
      label: 'Total Students',
      value: total,
      description: 'enrolled in this session',
      color: 'text-foreground',
      students: runs,
    },
    {
      label: 'On Track',
      value: onTrackRuns.length,
      description: 'progressing normally',
      color: 'text-green-600 dark:text-green-400',
      students: onTrackRuns,
    },
    {
      label: 'Needs Attention',
      value: needsAttentionRuns.length,
      description: 'stuck or need help',
      color: 'text-red-600 dark:text-red-400',
      students: needsAttentionRuns,
    },
    {
      label: 'Waiting for Check',
      value: waitingForCheckRuns.length,
      description: 'awaiting teacher review',
      color: 'text-blue-600 dark:text-blue-400',
      students: waitingForCheckRuns,
    },
    {
      label: 'Common Step',
      value: mostCommonStep !== null ? `Step ${mostCommonStep}` : '—',
      description: mostCommonStep !== null ? `${maxCount} student${maxCount !== 1 ? 's' : ''}` : 'no data',
      color: 'text-purple-600 dark:text-purple-400',
      students: commonStepRuns,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="relative rounded-xl border bg-card p-4 ring-1 ring-foreground/10 cursor-default"
          onMouseEnter={() => setHoveredStat(stat.label)}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>

          {hoveredStat === stat.label && stat.students.length > 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 w-48 rounded-lg border border-border bg-popover shadow-lg p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Students</p>
              {stat.students.map(s => (
                <p key={s.student_id} className="text-sm text-foreground truncate">
                  {s.first_name} {s.last_name}
                </p>
              ))}
            </div>
          )}

          {hoveredStat === stat.label && stat.students.length === 0 && (
            <div className="absolute top-full left-0 mt-2 z-50 w-48 rounded-lg border border-border bg-popover shadow-lg p-3">
              <p className="text-sm text-muted-foreground">No students</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
