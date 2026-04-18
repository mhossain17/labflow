import { getProfile } from '@/lib/auth/session'
import { getLabWithSteps } from '@/features/teacher/queries'
import { getSubmissionsForGrading } from '@/features/teacher/queries'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ labId: string }>
}

export default async function GradeSubmissionsPage({ params }: Props) {
  const { labId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const [lab, assignments] = await Promise.all([
    getLabWithSteps(labId),
    getSubmissionsForGrading(labId),
  ])
  if (!lab) notFound()

  const totalSubmissions = assignments.reduce(
    (sum: number, a: any) => sum + a.student_lab_runs.length, 0
  )

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <Link
        href={`/teacher/labs/${labId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to lab
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Grade Submissions</h1>
        <p className="text-muted-foreground mt-1">{lab.title} · {totalSubmissions} submitted</p>
      </div>

      {totalSubmissions === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          No submissions yet.
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment: any) => {
            if (assignment.student_lab_runs.length === 0) return null
            return (
              <section key={assignment.id} className="space-y-3">
                <h2 className="font-semibold">
                  {assignment.classes?.name}
                  {assignment.classes?.period && (
                    <span className="text-muted-foreground font-normal ml-1.5">({assignment.classes.period})</span>
                  )}
                </h2>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Grade</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignment.student_lab_runs.map((run: any, idx: number) => {
                        const grade = run.student_grades?.[0]
                        const studentName = run.profiles
                          ? `${run.profiles.first_name} ${run.profiles.last_name}`
                          : 'Unknown'
                        return (
                          <tr
                            key={run.id}
                            className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                          >
                            <td className="px-4 py-3 font-medium">{studentName}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                {new Date(run.completed_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {grade ? (
                                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                  <CheckCircle2 className="size-3.5" />
                                  {grade.total_score}/{grade.max_score} pts
                                  {grade.letter_grade && ` · ${grade.letter_grade}`}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Ungraded</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant={grade ? 'outline' : 'default'}
                                render={<Link href={`/teacher/labs/${labId}/grade/${run.id}`} />}
                              >
                                {grade ? 'Edit Grade' : 'Grade'}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
