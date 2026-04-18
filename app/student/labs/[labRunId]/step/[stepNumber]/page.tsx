import { getProfile } from '@/lib/auth/session'
import {
  checkLabRunOwnership,
  getLabRunWithSteps,
  getStepResponse,
} from '@/features/lab-runner/queries'
import { notFound, redirect } from 'next/navigation'
import { StepRunner } from '@/components/student/lab-runner/StepRunner'
import { normalizeAndSortLabSteps } from '@/lib/labs/steps'
import { normalizeDataFlags, normalizeStepDataValues } from '@/lib/labs/responses'

interface Props {
  params: Promise<{ labRunId: string; stepNumber: string }>
}

export default async function StepPage({ params }: Props) {
  const { labRunId, stepNumber: stepNumberStr } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const isOwner = await checkLabRunOwnership(labRunId, profile.id)
  if (!isOwner) notFound()

  const run = await getLabRunWithSteps(labRunId)
  if (!run) notFound()

  // Must complete prelab first
  if (!run.prelab_completed) {
    redirect(`/student/labs/${labRunId}/prelab`)
  }

  const stepNumber = parseInt(stepNumberStr, 10)
  if (isNaN(stepNumber) || stepNumber < 1) notFound()

  const steps = normalizeAndSortLabSteps(run.labs?.lab_steps)
  const totalSteps = steps.length

  if (stepNumber > totalSteps) notFound()

  const step = steps.find((s) => s.step_number === stepNumber)
  if (!step) notFound()

  const existingResponse = await getStepResponse(labRunId, step.id)

  return (
    <StepRunner
      labRunId={labRunId}
      studentId={profile.id}
      step={step}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      initialDataValues={normalizeStepDataValues(existingResponse?.data_values ?? null)}
      initialReflection={existingResponse?.reflection_text ?? ''}
      initialFlags={normalizeDataFlags(existingResponse?.flags ?? null)}
    />
  )
}
