import { getProfile } from '@/lib/auth/session'
import { getLabRunWithSteps } from '@/features/lab-runner/queries'
import { redirect } from 'next/navigation'
import { StatusSidebar } from '@/components/student/sidebar/StatusSidebar'
import type { LabStep } from '@/types/app'

interface Props {
  children: React.ReactNode
  params: Promise<{ labRunId: string }>
}

export default async function LabRunLayout({ children, params }: Props) {
  const { labRunId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const run = await getLabRunWithSteps(labRunId)
  const steps: LabStep[] = (run?.labs?.lab_steps ?? []).sort(
    (a: LabStep, b: LabStep) => a.step_number - b.step_number
  )
  const totalSteps = steps.length
  const currentStep = run?.current_step ?? 0

  // Find current step for help info
  const currentStepData = steps.find((s) => s.step_number === currentStep)

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
      <aside className="w-72 shrink-0 border-l border-border bg-card">
        <div className="sticky top-0 h-screen overflow-y-auto p-4">
          {run ? (
            <StatusSidebar
              labRunId={labRunId}
              studentId={profile.id}
              initialStatus={run.status}
              currentStep={currentStep}
              totalSteps={totalSteps}
              prelabCompleted={run.prelab_completed ?? false}
              quickNote={run.quick_note ?? null}
              stepId={currentStepData?.id}
              stepInstructions={currentStepData?.instructions}
              troubleshootingText={currentStepData?.troubleshooting}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </div>
      </aside>
    </div>
  )
}
