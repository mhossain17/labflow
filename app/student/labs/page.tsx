import { getProfile } from '@/lib/auth/session'
import { listStudentLabRuns } from '@/features/lab-runner/queries'
import { redirect } from 'next/navigation'
import { LabRunCard } from '@/components/student/LabRunCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FlaskConical, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default async function StudentLabsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const runs = await listStudentLabRuns(profile.id)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border pb-3">
        <span className="px-3 py-1.5 text-sm font-medium rounded-md bg-primary/10 text-primary flex items-center gap-1.5">
          <FlaskConical className="size-4" />
          My Labs
        </span>
        <Link
          href="/student/grades"
          className="px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
        >
          <GraduationCap className="size-4" />
          Grades
        </Link>
      </div>
      <h1 className="text-2xl font-bold">My Labs</h1>

      {runs.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="size-12" />}
          title="No labs assigned yet"
          description="No labs assigned yet. Check back when your teacher assigns a lab."
        />
      ) : (
        <div className="grid gap-4">
          {runs.map((run: Record<string, unknown>) => (
            <LabRunCard key={run.id as string} run={run} />
          ))}
        </div>
      )}
    </div>
  )
}
