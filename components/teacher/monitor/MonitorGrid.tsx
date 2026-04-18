'use client'

import { useState, useEffect } from 'react'
import type { StudentRunSnapshot } from '@/features/monitoring/realtime'
import { StudentCard } from './StudentCard'

type FilterType = 'all' | 'attention' | 'stuck' | 'waiting'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Need Attention' },
  { key: 'stuck', label: 'Stuck' },
  { key: 'waiting', label: 'Waiting' },
]

function filterRuns(runs: StudentRunSnapshot[], filter: FilterType): StudentRunSnapshot[] {
  switch (filter) {
    case 'attention':
      return runs.filter(r => r.status === 'need_help' || r.status === 'stuck')
    case 'stuck':
      return runs.filter(r => r.status === 'stuck')
    case 'waiting':
      return runs.filter(r => r.status === 'waiting_for_check')
    default:
      return runs
  }
}

interface MonitorGridProps {
  runs: StudentRunSnapshot[]
  totalSteps: number
}

export function MonitorGrid({ runs, totalSteps }: MonitorGridProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  // Force re-render of timestamps every 30s
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filterRuns(runs, filter)
  const activeCount = runs.filter(r => !r.status.includes('completed')).length

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{activeCount}</span>{' '}
          student{activeCount !== 1 ? 's' : ''} active
        </p>
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-8 text-center text-muted-foreground">
          {runs.length === 0
            ? 'No students have started this lab yet.'
            : 'No students match this filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(run => (
            <StudentCard key={run.student_id} run={run} totalSteps={totalSteps} />
          ))}
        </div>
      )}
    </div>
  )
}
