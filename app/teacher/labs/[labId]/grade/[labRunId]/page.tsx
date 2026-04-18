import { getProfile } from '@/lib/auth/session'
import { getGradingSheetData } from '@/features/teacher/queries'
import { GradingSheet } from '@/components/teacher/grading/GradingSheet'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Database } from 'lucide-react'
import { normalizeAndSortLabSteps } from '@/lib/labs/steps'

interface Props {
  params: Promise<{ labId: string; labRunId: string }>
}

export default async function GradeRunPage({ params }: Props) {
  const { labId, labRunId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const data = await getGradingSheetData(labRunId)
  if (!data) notFound()

  const { run, rubricItems, rubricScores, existingGrade } = data
  const studentName = run.profiles
    ? `${run.profiles.first_name} ${run.profiles.last_name}`
    : 'Student'
  const steps = normalizeAndSortLabSteps(run.labs?.lab_steps)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Link
        href={`/teacher/labs/${labId}/grade`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to submissions
      </Link>

      <h1 className="text-2xl font-bold">Grading: {studentName}</h1>
      <p className="text-muted-foreground -mt-4">{run.labs?.title}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Student responses */}
        <div className="space-y-6">
          <h2 className="font-semibold text-base">Student Responses</h2>

          {/* Pre-lab answers */}
          {run.pre_lab_responses?.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pre-Lab</h3>
              {run.pre_lab_responses.map((resp: any) => {
                const question = run.labs?.pre_lab_questions?.find(
                  (q: any) => q.id === resp.question_id
                )
                return (
                  <div key={resp.id} className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {question?.question_text ?? 'Question'}
                    </p>
                    <p className="text-sm">{resp.response_text || '—'}</p>
                  </div>
                )
              })}
            </section>
          )}

          {/* Step responses */}
          {steps.map((step) => {
            const resp = run.step_responses?.find((r: any) => r.step_id === step.id)
            if (!resp) return null
            return (
              <section key={step.id} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="size-3.5" />
                  Step {step.step_number}: {step.title}
                </h3>
                {resp.data_values && Object.keys(resp.data_values).length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    {Object.entries(resp.data_values).map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {resp.reflection_text && (
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="size-3" /> Reflection
                    </p>
                    <p className="text-sm">{resp.reflection_text}</p>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        {/* Right: Grading form */}
        <div>
          <GradingSheet
            labRunId={labRunId}
            teacherId={profile.id}
            labId={labId}
            studentName={studentName}
            rubricItems={rubricItems}
            existingScores={rubricScores}
            existingGrade={existingGrade}
          />
        </div>
      </div>
    </div>
  )
}
