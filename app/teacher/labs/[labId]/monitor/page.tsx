import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/session'
import { getLabWithSteps } from '@/features/teacher/queries'
import {
  getLabAssignmentForMonitor,
  getStudentRunsForMonitor,
  getEscalatedHelpRequests,
} from '@/features/monitoring/queries'
import { MonitorDashboard } from '@/components/teacher/monitor/MonitorDashboard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users } from 'lucide-react'

interface MonitorPageProps {
  params: Promise<{ labId: string }>
}

export default async function MonitorPage({ params }: MonitorPageProps) {
  const { labId } = await params

  const profile = await getProfile()
  if (!profile) redirect('/login')

  const allowedRoles = ['teacher', 'school_admin', 'super_admin']
  if (!allowedRoles.includes(profile.role)) redirect('/dashboard')

  const lab = await getLabWithSteps(labId)
  if (!lab) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
        <h1 className="text-2xl font-bold">Lab not found</h1>
        <p className="text-muted-foreground">This lab does not exist or you do not have access.</p>
      </div>
    )
  }

  const totalSteps: number = lab.lab_steps?.length ?? 0

  const assignment = await getLabAssignmentForMonitor(labId)

  if (!assignment) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{lab.title} — Live Monitor</h1>
        <EmptyState
          icon={<Users className="size-12" />}
          title="Lab not assigned"
          description="This lab hasn't been assigned to a class yet."
          action={
            <Button render={<Link href={`/teacher/labs/${labId}`} />}>
              View Lab
            </Button>
          }
        />
      </div>
    )
  }

  const [initialRuns, initialEscalatedHelp] = await Promise.all([
    getStudentRunsForMonitor(assignment.id),
    getEscalatedHelpRequests(assignment.id),
  ])

  return (
    <MonitorDashboard
      labId={labId}
      labTitle={lab.title}
      assignmentId={assignment.id}
      totalSteps={totalSteps}
      initialRuns={initialRuns}
      initialEscalatedHelp={initialEscalatedHelp}
    />
  )
}
