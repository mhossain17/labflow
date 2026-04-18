import { getProfile } from '@/lib/auth/session'
import { listStudentLabRuns } from '@/features/lab-runner/queries'
import { redirect } from 'next/navigation'
import { LabRunCard } from '@/components/student/LabRunCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FlaskConical } from 'lucide-react'

export default async function StudentLabsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const runs = await listStudentLabRuns(profile.id)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
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
