import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getOrgGradeSummary, listClassesForGradeFilter, listLabsForGradeFilter } from '@/features/admin/grade-queries'
import { OrgGradeTable } from '@/components/admin/grades/OrgGradeTable'

export default async function AdminGradesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!['school_admin', 'super_admin'].includes(profile.role)) redirect('/teacher/grades')

  const [rows, classOptions, labOptions] = await Promise.all([
    getOrgGradeSummary(profile.organization_id),
    listClassesForGradeFilter(profile.organization_id),
    listLabsForGradeFilter(profile.organization_id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grades</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View all graded lab submissions across classes and teachers.
        </p>
      </div>
      <OrgGradeTable rows={rows} classOptions={classOptions} labOptions={labOptions} />
    </div>
  )
}
