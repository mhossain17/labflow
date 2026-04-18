import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/session'
import { listLabsByTeacher } from '@/features/teacher/queries'
import { getTeacherAnalyticsOverview } from '@/features/analytics/queries'
import { AnalyticsDashboard } from '@/components/teacher/analytics/AnalyticsDashboard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart3, Plus } from 'lucide-react'
import type { Lab } from '@/types/app'

export default async function AnalyticsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const allowedRoles = ['teacher', 'school_admin', 'super_admin']
  if (!allowedRoles.includes(profile.role)) redirect('/dashboard')

  const [labs, overview] = await Promise.all([
    listLabsByTeacher(profile.id) as Promise<Lab[]>,
    getTeacherAnalyticsOverview(profile.id),
  ])

  if (labs.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <EmptyState
          icon={<BarChart3 className="size-12" />}
          title="No labs found"
          description="No labs found. Create and assign labs to see analytics."
          action={
            <Button render={<Link href="/teacher/labs/new" />}>
              <Plus className="size-4" />
              Create Lab
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <AnalyticsDashboard
      labs={labs}
      overview={overview}
    />
  )
}
