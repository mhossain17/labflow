'use client'

import { useState, useEffect, useTransition } from 'react'
import type { Lab } from '@/types/app'
import { AnalyticsStatCard } from './AnalyticsStatCard'
import { LabCompletionChart } from './LabCompletionChart'
import { StatusDistributionChart } from './StatusDistributionChart'
import { StuckStepChart } from './StuckStepChart'
import { getLabAnalyticsAction } from '@/features/analytics/actions'

interface OverviewStats {
  lab_counts: Record<string, number>
  active_runs_today: number
  students_needing_attention: number
}

interface AnalyticsDashboardProps {
  labs: Lab[]
  overview: OverviewStats
}

export function AnalyticsDashboard({ labs, overview }: AnalyticsDashboardProps) {
  const [selectedLabId, setSelectedLabId] = useState<string>(labs[0]?.id ?? '')
  const [labData, setLabData] = useState<{
    completionData: Array<{ step: string; count: number }>
    statusData: Array<{ name: string; value: number; color: string }>
    stuckData: Array<{ step: string; stuck: number; help: number }>
    summary: { total_runs: number; completed_runs: number; in_progress_runs: number }
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!selectedLabId) return
    startTransition(async () => {
      const data = await getLabAnalyticsAction(selectedLabId)
      setLabData(data)
    })
  }, [selectedLabId])

  const totalLabs = Object.values(overview.lab_counts).reduce((a, b) => a + b, 0)
  const publishedLabs = overview.lab_counts['published'] ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Overview of your classroom lab activity</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <AnalyticsStatCard
          label="Total Labs"
          value={totalLabs}
          description={`${publishedLabs} published`}
        />
        <AnalyticsStatCard
          label="Active Today"
          value={overview.active_runs_today}
          description="student sessions"
        />
        <AnalyticsStatCard
          label="Needs Attention"
          value={overview.students_needing_attention}
          description="stuck or need help"
        />
        <AnalyticsStatCard
          label="Published Labs"
          value={publishedLabs}
          description="available to students"
        />
      </div>

      {/* Lab selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="lab-select" className="text-sm font-medium">
            View analytics for:
          </label>
          <select
            id="lab-select"
            value={selectedLabId}
            onChange={e => setSelectedLabId(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {labs.map(lab => (
              <option key={lab.id} value={lab.id}>
                {lab.title}
              </option>
            ))}
          </select>
        </div>

        {/* Charts area */}
        {isPending ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-xl border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : labData ? (
          <div className="space-y-6">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4">
              <AnalyticsStatCard
                label="Total Runs"
                value={labData.summary.total_runs}
                description="all time"
              />
              <AnalyticsStatCard
                label="Completed"
                value={labData.summary.completed_runs}
                description="submitted labs"
              />
              <AnalyticsStatCard
                label="In Progress"
                value={labData.summary.in_progress_runs}
                description="currently working"
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Completion progress */}
              <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
                <h3 className="text-sm font-medium mb-4">Students at Each Step</h3>
                <LabCompletionChart data={labData.completionData} />
              </div>

              {/* Status distribution */}
              <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
                <h3 className="text-sm font-medium mb-4">Status Distribution</h3>
                <StatusDistributionChart data={labData.statusData} />
              </div>
            </div>

            {/* Stuck steps - full width */}
            <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="text-sm font-medium mb-1">Students Stuck by Step</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Which steps have the most students struggling
              </p>
              <StuckStepChart data={labData.stuckData} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-8 text-center text-muted-foreground">
            {labs.length === 0
              ? 'No labs yet. Create your first lab to see analytics.'
              : 'Select a lab to view its analytics.'}
          </div>
        )}
      </div>
    </div>
  )
}
