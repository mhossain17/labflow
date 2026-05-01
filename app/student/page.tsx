import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getStudentDashboardData } from '@/features/lab-runner/queries'
import { getStudentXpWithRank } from '@/features/gamification/queries'
import { StudentDashboard } from '@/components/student/StudentDashboard'

export default async function StudentPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const [classes, xpData] = await Promise.all([
    getStudentDashboardData(profile.id),
    profile.organization_id
      ? getStudentXpWithRank(profile.id, profile.organization_id)
      : Promise.resolve({ xp: 0, rank: null, total: 0 }),
  ])

  return (
    <StudentDashboard
      firstName={profile.first_name ?? 'Student'}
      classes={classes}
      studentId={profile.id}
      xp={xpData.xp}
      rank={xpData.rank}
      total={xpData.total}
    />
  )
}
