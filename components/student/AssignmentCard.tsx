'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { startLabRun } from '@/features/lab-runner/actions'
import { CheckCircle2, Clock, Loader2, Play, ArrowRight, BookOpen } from 'lucide-react'

interface AssignmentCardProps {
  assignment: {
    id: string
    due_date: string | null
    lab_id: string
    labs: { id: string; title: string; overview: string | null; estimated_minutes: number | null }
    lab_run: {
      id: string
      current_step: number
      prelab_completed: boolean
      status: string
      completed_at: string | null
      labs: { title: string; lab_steps: { id: string }[] } | null
    } | null
  }
  studentId: string
}

export function AssignmentCard({ assignment, studentId }: AssignmentCardProps) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const run = assignment.lab_run
  const lab = assignment.labs

  const totalSteps = run?.labs?.lab_steps?.length ?? 0
  const progress = totalSteps > 0
    ? Math.round(((run?.current_step ?? 0) / totalSteps) * 100)
    : 0

  const dueDate = assignment.due_date
    ? new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null

  async function handleStart() {
    setStarting(true)
    try {
      const labRunId = await startLabRun(assignment.id, assignment.lab_id, studentId)
      router.push(`/student/labs/${labRunId}/overview`)
    } catch {
      setStarting(false)
    }
  }

  const isComplete = !!run?.completed_at
  const isInProgress = run && !isComplete

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{lab.title}</h3>
          {lab.overview && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{lab.overview}</p>
          )}
        </div>
        {isComplete ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="size-3" />
            Complete
          </span>
        ) : isInProgress ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            In Progress
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            Not Started
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {lab.estimated_minutes && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {lab.estimated_minutes} min
          </span>
        )}
        {dueDate && (
          <span>Due {dueDate}</span>
        )}
      </div>

      {isInProgress && totalSteps > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {run.current_step} of {totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        {isComplete ? (
          <Button size="sm" variant="outline" render={<Link href={`/student/labs/${run!.id}/complete`} />}>
            <BookOpen className="size-3.5" />
            View
          </Button>
        ) : isInProgress ? (
          <Button size="sm" render={<Link href={`/student/labs/${run!.id}/overview`} />}>
            Continue
            <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleStart} disabled={starting}>
            {starting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            Start Lab
          </Button>
        )}
      </div>
    </div>
  )
}
