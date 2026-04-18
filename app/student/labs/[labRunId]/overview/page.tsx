import { getProfile } from '@/lib/auth/session'
import { checkLabRunOwnership, getLabRunWithSteps } from '@/features/lab-runner/queries'
import { notFound, redirect } from 'next/navigation'
import { LabOverview } from '@/components/student/lab-runner/LabOverview'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Lab } from '@/types/app'

interface Props {
  params: Promise<{ labRunId: string }>
}

export default async function LabOverviewPage({ params }: Props) {
  const { labRunId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const isOwner = await checkLabRunOwnership(labRunId, profile.id)
  if (!isOwner) notFound()

  const run = await getLabRunWithSteps(labRunId)
  if (!run) notFound()

  const lab = run.labs as Lab & { lab_steps?: { id: string }[] }
  const totalSteps = lab.lab_steps?.length ?? 0

  function getContinueHref(): string {
    if (!run.prelab_completed) {
      return `/student/labs/${labRunId}/prelab`
    }
    const step = run.current_step > 0 ? run.current_step : 1
    return `/student/labs/${labRunId}/step/${step}`
  }

  function getContinueLabel(): string {
    if (!run.prelab_completed) return 'Start Pre-Lab'
    if (run.current_step === 0) return 'Go to Step 1'
    if (run.completed_at) return 'View Completion'
    return `Continue at Step ${run.current_step}`
  }

  const continueHref = run.completed_at
    ? `/student/labs/${labRunId}/complete`
    : getContinueHref()
  const continueLabel = run.completed_at ? 'View Completion' : getContinueLabel()

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Lab</p>
        <h1 className="text-2xl font-bold">{lab.title}</h1>
        {totalSteps > 0 && (
          <p className="text-sm text-muted-foreground">{totalSteps} steps</p>
        )}
      </div>

      <LabOverview lab={lab} />

      <div className="flex justify-end">
        <Button size="lg" render={<Link href={continueHref} />}>
          {continueLabel}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
