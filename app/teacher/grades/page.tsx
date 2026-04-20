import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getAllGradesForTeacher } from '@/features/teacher/queries'
import { TeacherGradeOverview } from '@/components/teacher/grades/TeacherGradeOverview'

export default async function TeacherGradesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const rows = await getAllGradesForTeacher(profile.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grades</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All completed lab submissions across your classes.
        </p>
      </div>
      <TeacherGradeOverview rows={rows} />
    </div>
  )
}
