import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getStudentDashboardData } from '@/features/lab-runner/queries'
import { StudentDashboard } from '@/components/student/StudentDashboard'

export default async function StudentPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const classes = await getStudentDashboardData(profile.id)

  return (
    <StudentDashboard
      firstName={profile.first_name ?? 'Student'}
      classes={classes}
      studentId={profile.id}
    />
  )
}
