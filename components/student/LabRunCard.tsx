import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, ChevronRight } from 'lucide-react'
import type { StudentWorkStatus } from '@/types/app'

interface LabRun {
  id: string
  status: StudentWorkStatus
  current_step: number
  completed_at: string | null
  prelab_completed: boolean
  labs: {
    title: string
    lab_steps?: { id: string }[]
  }
  lab_assignments?: {
    due_date: string | null
  }
}

function statusChip(run: LabRun) {
  if (run.completed_at) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Complete</Badge>
  }
  const labels: Record<StudentWorkStatus, { label: string; className: string }> = {
    on_track: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    need_help: { label: 'Need Help', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    stuck: { label: 'Stuck', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    waiting_for_check: { label: 'Waiting for Teacher', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    finished_step: { label: 'Finished Step', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  }
  const s = labels[run.status] ?? labels.on_track
  return <Badge className={s.className}>{s.label}</Badge>
}

export function LabRunCard({ run }: { run: Record<string, unknown> }) {
  const r = run as unknown as LabRun
  const totalSteps = r.labs?.lab_steps?.length ?? 0
  const currentStep = r.current_step ?? 0
  const progress = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0
  const dueDate = r.lab_assignments?.due_date
  const isComplete = !!r.completed_at

  const href = `/student/labs/${r.id}/overview`
  const buttonLabel = isComplete ? 'View' : 'Continue'

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-base truncate">{r.labs?.title}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {statusChip(r)}
            {dueDate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                Due {new Date(dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Button size="sm" variant={isComplete ? 'outline' : 'default'} render={<Link href={href} />}>
          {buttonLabel}
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {totalSteps > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {r.prelab_completed
                ? `Step ${currentStep} of ${totalSteps}`
                : 'Pre-Lab not completed'}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </div>
  )
}
