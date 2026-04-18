import { getLabWithSteps, getLabAssignments, listAvailableClasses } from '@/features/teacher/queries'
import { getProfile } from '@/lib/auth/session'
import { LabStatusBadge } from '@/components/teacher/lab-builder/LabStatusBadge'
import { AssignLabDialog } from '@/components/teacher/lab-builder/AssignLabDialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Monitor,
  Clock,
  ListChecks,
  FlaskConical,
  BookOpen,
  Calendar,
  X,
  GraduationCap,
} from 'lucide-react'
import type { LabStatus } from '@/types/app'
import { unassignLab } from '@/features/teacher/actions'

interface LabDetailPageProps {
  params: Promise<{ labId: string }>
}


export default async function LabDetailPage({ params }: LabDetailPageProps) {
  const { labId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const [lab, assignments, availableClasses] = await Promise.all([
    getLabWithSteps(labId),
    getLabAssignments(labId),
    listAvailableClasses(profile.id, labId),
  ])

  if (!lab) notFound()

  const stepCount = lab.lab_steps?.length ?? 0
  const questionCount = lab.pre_lab_questions?.length ?? 0

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/teacher/labs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to labs
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{lab.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LabStatusBadge status={lab.status as LabStatus} />
            <Button variant="outline" size="sm" render={<Link href={`/teacher/labs/${labId}/edit`} />}>
              <Pencil className="size-4" />
              Edit
            </Button>
            {lab.status === 'published' && (
              <Button size="sm" render={<Link href={`/teacher/labs/${labId}/monitor`} />}>
                <Monitor className="size-4" />
                Monitor
              </Button>
            )}
            {lab.status === 'published' && (
              <Button variant="outline" size="sm" render={<Link href={`/teacher/labs/${labId}/grade`} />}>
                <GraduationCap className="size-4" />
                Grade Submissions
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {lab.estimated_minutes && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" />
              {lab.estimated_minutes} minutes
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-4" />
            {questionCount} pre-lab {questionCount === 1 ? 'question' : 'questions'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical className="size-4" />
            {stepCount} {stepCount === 1 ? 'step' : 'steps'}
          </span>
        </div>
      </div>

      {/* Overview */}
      {lab.overview && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{lab.overview}</p>
        </section>
      )}

      {/* Objectives */}
      {lab.objectives?.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Learning Objectives</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {lab.objectives.map((obj: string, i: number) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Step preview */}
      {stepCount > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold">Procedure ({stepCount} steps)</h2>
          <div className="space-y-2">
            {lab.lab_steps
              .sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
              .slice(0, 3)
              .map((step: { id: string; step_number: number; title: string; instructions: string }) => (
                <div key={step.id} className="flex gap-3 text-sm">
                  <span className="font-medium text-muted-foreground w-6 shrink-0">{step.step_number}.</span>
                  <div>
                    <span className="font-medium">{step.title}</span>
                    {step.instructions && (
                      <p className="text-muted-foreground line-clamp-1 mt-0.5">{step.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
            {stepCount > 3 && (
              <p className="text-xs text-muted-foreground pl-9">
                + {stepCount - 3} more steps. <Link href={`/teacher/labs/${labId}/edit`} className="underline">View all</Link>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Teacher notes */}
      {lab.teacher_notes && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <BookOpen className="size-4" />
            Teacher Notes
            <span className="text-xs font-normal text-muted-foreground">(private)</span>
          </h2>
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
            {lab.teacher_notes}
          </div>
        </section>
      )}

      {/* Assign to class */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Class Assignments</h2>
          <AssignLabDialog
            labId={labId}
            teacherId={profile.id}
            availableClasses={availableClasses}
          />
        </div>
        {assignments.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            This lab has not been assigned to any class yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Class</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: {
                  id: string
                  class_id: string
                  due_date: string | null
                  classes: { id: string; name: string; period: string | null }
                }, idx: number) => (
                  <tr key={a.id} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/teacher/classes/${a.classes.id}`} className="hover:underline">
                        {a.classes.name}
                        {a.classes.period && <span className="ml-1 text-muted-foreground font-normal">({a.classes.period})</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.due_date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-4" />
                          {new Date(a.due_date).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={async () => {
                        'use server'
                        await unassignLab(labId, a.class_id)
                      }}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="size-3.5" />
                          Unassign
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
