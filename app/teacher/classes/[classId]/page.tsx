import { getClassWithEnrollments, getClassLabAssignments } from '@/features/teacher/queries'
import { EnrollmentTable } from '@/components/teacher/classes/EnrollmentTable'
import { AddStudentForm } from '@/components/teacher/classes/AddStudentForm'
import { Badge } from '@/components/ui/badge'
import { LabStatusBadge } from '@/components/teacher/lab-builder/LabStatusBadge'
import Link from 'next/link'
import { ArrowLeft, Calendar, FlaskConical } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { LabStatus } from '@/types/app'

interface ClassDetailPageProps {
  params: Promise<{ classId: string }>
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { classId } = await params
  const [cls, assignments] = await Promise.all([
    getClassWithEnrollments(classId),
    getClassLabAssignments(classId),
  ])

  if (!cls) notFound()

  const enrollments = cls.enrollments ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to classes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{cls.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {cls.period && <Badge variant="outline">{cls.period}</Badge>}
              {cls.school_year && <Badge variant="outline">{cls.school_year}</Badge>}
            </div>
            {cls.description && (
              <p className="text-muted-foreground mt-2">{cls.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Students */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Students
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({enrollments.length})
            </span>
          </h2>
        </div>
        <AddStudentForm classId={classId} />
        <EnrollmentTable classId={classId} enrollments={enrollments} />
      </section>

      {/* Assigned Labs */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Assigned Labs
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({assignments.length})
          </span>
        </h2>
        {assignments.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No labs assigned to this class yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lab</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment: {
                  id: string
                  due_date: string | null
                  labs: { id: string; title: string; status: LabStatus }
                }, idx: number) => (
                  <tr
                    key={assignment.id}
                    className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/teacher/labs/${assignment.labs.id}`}
                        className="inline-flex items-center gap-1.5 font-medium hover:underline"
                      >
                        <FlaskConical className="size-4 text-muted-foreground" />
                        {assignment.labs.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <LabStatusBadge status={assignment.labs.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {assignment.due_date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-4" />
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
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
