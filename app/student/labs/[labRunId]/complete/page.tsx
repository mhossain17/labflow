import { getProfile } from '@/lib/auth/session'
import {
  checkLabRunOwnership,
  getLabRunWithSteps,
  getStepResponses,
  getGradeForRun,
} from '@/features/lab-runner/queries'
import { notFound, redirect } from 'next/navigation'
import { submitLab } from '@/features/lab-runner/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, Clock, ArrowLeft, Zap } from 'lucide-react'
import { normalizeAndSortLabSteps } from '@/lib/labs/steps'
import { getRubricItems } from '@/features/lab-builder/queries'
import { SelfAssessment } from '@/components/student/lab-runner/SelfAssessment'
import { XP_PER_STEP, XP_PER_LAB_COMPLETE, XP_ON_TIME_BONUS, XP_GRADE_BONUS, getLevel } from '@/lib/gamification'

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

  const steps = normalizeAndSortLabSteps(run.labs?.lab_steps)

  const labId = (run.labs as any)?.id ?? run.lab_id
  const [stepResponses, rubricItems, { grade, scores }] = await Promise.all([
    getStepResponses(labRunId),
    getRubricItems(labId),
    getGradeForRun(labRunId),
  ])
  const completedStepIds = new Set(
    stepResponses.filter((r: { completed: boolean }) => r.completed).map((r: { step_id: string }) => r.step_id)
  )

  const isCompleted = !!run.completed_at

  // Compute XP earned from this lab run
  const completedStepsCount = stepResponses.filter((r: { completed: boolean }) => r.completed).length
  let earnedXp = completedStepsCount * XP_PER_STEP
  if (isCompleted) {
    earnedXp += XP_PER_LAB_COMPLETE
    const assignment = run.lab_assignments as { due_date: string | null } | null
    if (assignment?.due_date && run.completed_at) {
      const due = new Date(assignment.due_date)
      due.setHours(23, 59, 59)
      if (new Date(run.completed_at) <= due) earnedXp += XP_ON_TIME_BONUS
    }
  }
  const letterGrade = grade?.letter_grade?.charAt(0)
  if (letterGrade && XP_GRADE_BONUS[letterGrade] !== undefined) {
    earnedXp += XP_GRADE_BONUS[letterGrade]
  }
  const earnedLevel = getLevel(earnedXp)

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

          {/* XP earned */}
          {isCompleted && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 px-6 py-3">
              <Zap className="size-5 text-green-600 dark:text-green-400" />
              <span className="font-bold text-green-700 dark:text-green-300 text-lg">
                +{earnedXp} XP earned
              </span>
              <span className={`text-sm font-medium ${earnedLevel.colorClass}`}>
                · {earnedLevel.emoji} {earnedLevel.name}
              </span>
            </div>
          )}

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

          {rubricItems.length > 0 && (
            <SelfAssessment
              labRunId={labRunId}
              rubricItems={rubricItems}
              existingScores={scores}
              teacherGrade={grade}
            />
          )}

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
