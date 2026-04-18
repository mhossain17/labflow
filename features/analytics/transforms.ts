// Shape database results into Recharts-friendly format

const STATUS_COLORS: Record<string, string> = {
  on_track: '#22c55e',
  need_help: '#f59e0b',
  stuck: '#ef4444',
  waiting_for_check: '#3b82f6',
  finished_step: '#a855f7',
}

const STATUS_LABELS: Record<string, string> = {
  on_track: 'On Track',
  need_help: 'Need Help',
  stuck: 'Stuck',
  waiting_for_check: 'Waiting',
  finished_step: 'Finished Step',
}

export function toStatusDistributionData(runs: Array<{ status: string }>) {
  const counts: Record<string, number> = {}
  for (const r of runs) {
    counts[r.status] = (counts[r.status] ?? 0) + 1
  }

  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS[status] ?? '#94a3b8',
    }))
}

export function toStuckStepChartData(
  stuckData: Array<{ step_number: number; step_title: string; stuck_count: number; help_count?: number }>
) {
  return stuckData.map(d => ({
    step: `Step ${d.step_number}: ${d.step_title.length > 20 ? d.step_title.slice(0, 20) + '…' : d.step_title}`,
    stuck: d.stuck_count,
    help: d.help_count ?? 0,
  }))
}

export function toCompletionProgressData(
  runs: Array<{ current_step: number; completed_at: string | null }>,
  totalSteps: number
) {
  const stepCounts: Record<number, number> = {}

  // Include step 0 as "Pre-Lab"
  for (let i = 0; i <= totalSteps; i++) {
    stepCounts[i] = 0
  }

  for (const r of runs) {
    const step = r.current_step
    if (stepCounts[step] !== undefined) {
      stepCounts[step]++
    }
  }

  return Object.entries(stepCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([step, count]) => ({
      step: Number(step) === 0 ? 'Pre-Lab' : `Step ${step}`,
      count,
    }))
}
