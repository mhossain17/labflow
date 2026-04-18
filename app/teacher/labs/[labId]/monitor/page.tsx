import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/session'
import { getLabWithSteps } from '@/features/teacher/queries'
import {
  getLabAssignmentsForMonitor,
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
  searchParams: Promise<{ classId?: string }>
}

export default async function MonitorPage({ params, searchParams }: MonitorPageProps) {
  const [{ labId }, { classId }] = await Promise.all([params, searchParams])

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
  const assignments = await getLabAssignmentsForMonitor(labId)

  if (assignments.length === 0) {
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

  const assignment = assignments.find(a => a.class_id === classId) ?? assignments[0]

  const [initialRuns, initialEscalatedHelp] = await Promise.all([
    getStudentRunsForMonitor(assignment.id),
    getEscalatedHelpRequests(assignment.id),
  ])

  const labSteps = (lab.lab_steps ?? []).map((s: {
    id: string
    step_number: number
    title: string
    data_entry_fields: unknown
  }) => ({
    id: s.id,
    step_number: s.step_number,
    title: s.title,
    data_entry_fields: s.data_entry_fields as { label: string; unit?: string }[] | null,
  }))

  const assignmentSummaries = assignments.map((a: {
    id: string
    class_id: string
    classes: { id: string; name: string; period: string | null }
  }) => ({
    id: a.id,
    classId: a.class_id,
    className: a.classes.name,
    classPeriod: a.classes.period,
  }))

  return (
    <MonitorDashboard
      labId={labId}
      labTitle={lab.title}
      assignmentId={assignment.id}
      selectedClassId={assignment.class_id}
      assignments={assignmentSummaries}
      totalSteps={totalSteps}
      labSteps={labSteps}
      initialRuns={initialRuns}
      initialEscalatedHelp={initialEscalatedHelp}
    />
  )
}
