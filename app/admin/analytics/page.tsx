import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import {
  getOrgAnalyticsOverview,
  getTeacherUsageStats,
  getStudentUsageStats,
  getOrgCompletionTrend,
  getOrgHelpStats,
} from '@/features/analytics/admin-queries'
import { OrgStatCards } from '@/components/admin/analytics/OrgStatCards'
import { TeacherUsageTable } from '@/components/admin/analytics/TeacherUsageTable'
import { StudentUsageTable } from '@/components/admin/analytics/StudentUsageTable'
import { OrgCompletionChart } from '@/components/admin/analytics/OrgCompletionChart'
import { AnalyticsStatCard } from '@/components/teacher/analytics/AnalyticsStatCard'

export default async function AdminAnalyticsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!['school_admin', 'super_admin'].includes(profile.role)) redirect('/teacher/analytics')
  if (!profile.organization_id) redirect('/super-admin')

  const [overview, teacherStats, studentStats, trend, helpStats] = await Promise.all([
    getOrgAnalyticsOverview(profile.organization_id),
    getTeacherUsageStats(profile.organization_id),
    getStudentUsageStats(profile.organization_id),
    getOrgCompletionTrend(profile.organization_id),
    getOrgHelpStats(profile.organization_id),
  ])

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Organization-wide usage, engagement, and performance data.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Overview</h2>
        <OrgStatCards overview={overview} />
      </section>

      {/* Completion Trend */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lab Completions (Last 8 Weeks)</h2>
        <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
          <OrgCompletionChart data={trend} />
        </div>
      </section>

      {/* Help Stats */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Help & Support</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AnalyticsStatCard
            label="Total Requests"
            value={helpStats.total_requests}
            description="all time"
          />
          <AnalyticsStatCard
            label="Escalated"
            value={helpStats.escalated_count}
            description="to teacher"
          />
          <AnalyticsStatCard
            label="Escalation Rate"
            value={`${helpStats.escalation_rate}%`}
            description="of all requests"
          />
          <AnalyticsStatCard
            label="Avg Turns"
            value={helpStats.avg_conversation_turns}
            description="per help session"
          />
        </div>
      </section>

      {/* Teacher Usage */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Teacher Activity</h2>
        <TeacherUsageTable stats={teacherStats} />
      </section>

      {/* Student Usage */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Student Activity</h2>
        <StudentUsageTable stats={studentStats} />
      </section>
    </div>
  )
}
