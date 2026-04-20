import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getAllGradesForStudent } from '@/features/lab-runner/queries'
import { StudentGradeCard } from '@/components/student/grades/StudentGradeCard'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'

export default async function StudentGradesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const entries = await getAllGradesForStudent(profile.id)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Simple tab nav */}
      <div className="flex gap-1 border-b border-border pb-3">
        <Link
          href="/student/labs"
          className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
        >
          <FlaskConical className="size-4" />
          My Labs
        </Link>
        <span className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary/10 text-primary">
          Grades
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-bold">My Grades</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your grades for completed labs across all classes.
        </p>
      </div>
      <StudentGradeCard entries={entries} />
    </div>
  )
}
