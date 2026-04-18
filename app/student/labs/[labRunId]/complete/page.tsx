import { getProfile } from '@/lib/auth/session'
import {
  checkLabRunOwnership,
  getLabRunWithSteps,
  getStepResponses,
} from '@/features/lab-runner/queries'
import { notFound, redirect } from 'next/navigation'
import { submitLab } from '@/features/lab-runner/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, Clock, ArrowLeft } from 'lucide-react'
import type { LabStep } from '@/types/app'

interface Props {
  params: Promise<{ labRunId: string }>
}

export default async function CompletePage({ params }: Props) {
  const { labRunId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const isOwner = await checkLabRunOwnership(labRunId, profile.id)
  if (!isOwner) notFound()

  const run = await getLabRunWithSteps(labRunId)
  if (!run) notFound()

  const steps: LabStep[] = (run.labs?.lab_steps ?? []).sort(
    (a: LabStep, b: LabStep) => a.step_number - b.step_number
  )

  const stepResponses = await getStepResponses(labRunId)
  const completedStepIds = new Set(
    stepResponses.filter((r: { completed: boolean }) => r.completed).map((r: { step_id: string }) => r.step_id)
  )

  const isCompleted = !!run.completed_at

  async function handleSubmit() {
    'use server'
    await submitLab(labRunId)
    redirect(`/student/labs/${labRunId}/complete`)
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      {isCompleted ? (
        <>
          {/* Celebration */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <CheckCircle2 className="size-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold">Lab Complete!</h1>
            <p className="text-muted-foreground text-lg">{run.labs?.title}</p>
          </div>

          {/* Completion time */}
          {run.completed_at && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              Completed on{' '}
              {new Date(run.completed_at).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              at{' '}
              {new Date(run.completed_at).toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
          )}

          {/* Steps summary */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Steps Completed
            </h2>
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 text-sm">
                  <CheckCircle2
                    className={`size-4 shrink-0 ${
                      completedStepIds.has(step.id)
                        ? 'text-green-500'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                  <span>
                    Step {step.step_number}: {step.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-center">
            <Button variant="outline" size="lg" render={<Link href="/student/labs" />}>
              <ArrowLeft className="size-4" />
              View All Labs
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold">Ready to Submit?</h1>
            <p className="text-muted-foreground">
              You&apos;ve completed all steps of <strong>{run.labs?.title}</strong>. Submit your lab
              when you&apos;re ready.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Steps Summary
            </h2>
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 text-sm">
                  <CheckCircle2
                    className={`size-4 shrink-0 ${
                      completedStepIds.has(step.id)
                        ? 'text-green-500'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                  <span>
                    Step {step.step_number}: {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" render={<Link href="/student/labs" />}>
              <ArrowLeft className="size-4" />
              Back to Labs
            </Button>
            <form action={handleSubmit}>
              <Button type="submit" size="lg">
                <CheckCircle2 className="size-4" />
                Submit Lab
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
