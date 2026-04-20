import { AnalyticsStatCard } from '@/components/teacher/analytics/AnalyticsStatCard'
import type { OrgOverview } from '@/features/analytics/admin-queries'

export function OrgStatCards({ overview }: { overview: OrgOverview }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <AnalyticsStatCard
        label="Students"
        value={overview.total_students}
        description="enrolled"
      />
      <AnalyticsStatCard
        label="Teachers"
        value={overview.total_teachers}
        description="active"
      />
      <AnalyticsStatCard
        label="Published Labs"
        value={overview.total_published_labs}
        description="available"
      />
      <AnalyticsStatCard
        label="Active (7d)"
        value={overview.active_runs_last_7_days}
        description="lab sessions"
      />
      <AnalyticsStatCard
        label="Completion Rate"
        value={`${overview.overall_completion_rate}%`}
        description="all time"
      />
    </div>
  )
}
