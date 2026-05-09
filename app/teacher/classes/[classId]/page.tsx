import { getProfile } from '@/lib/auth/session'
import { redirect, notFound } from 'next/navigation'
import { getClassWithEnrollments, getClassLabAssignments, getTeacherPermissionsForClass } from '@/features/teacher/queries'
import { EnrollmentTable } from '@/components/teacher/classes/EnrollmentTable'
import { AddStudentForm } from '@/components/teacher/classes/AddStudentForm'
import { ClassDetailTabs } from '@/components/teacher/classes/ClassDetailTabs'
import { Badge } from '@/components/ui/badge'
import { LabStatusBadge } from '@/components/teacher/lab-builder/LabStatusBadge'
import Link from 'next/link'
import { ArrowLeft, Calendar, FlaskConical, Monitor, Users } from 'lucide-react'
import { notFound as nextNotFound } from 'next/navigation'
import type { LabStatus } from '@/types/app'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { hasGoogleConnected } from '@/lib/google-classroom/tokens'
import { createClient } from '@/lib/supabase/server'

interface ClassDetailPageProps {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ClassDetailPage({ params, searchParams }: ClassDetailPageProps) {
  const { classId } = await params
  const { tab } = await searchParams
  const activeTab = tab === 'labs' ? 'labs' : 'students'

  const profile = await getProfile()
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const [cls, assignments, permissions, gcEnabled, gcIsConnected] = await Promise.all([
    getClassWithEnrollments(classId),
    getClassLabAssignments(classId),
    getTeacherPermissionsForClass(profile.id, classId),
    checkFeatureFlag('google_classroom_sync'),
    hasGoogleConnected(profile.id),
  ])

  // Fetch linked Google course for this class if sync is enabled
  let gcLinkedCourse: { id: string; name: string } | null = null
  if (gcEnabled) {
    const { data: link } = await (supabase as any)
      .from('google_classroom_links')
      .select('google_course_id, google_course_name')
      .eq('class_id', classId)
      .maybeSingle()
    if (link) {
      gcLinkedCourse = { id: link.google_course_id, name: link.google_course_name ?? 'Linked course' }
    }
  }

  if (!cls) notFound()

  const allEnrollments = cls.class_enrollments ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeCount = allEnrollments.filter((e: any) => e.status !== 'pending').length
  const classTeachers = cls.class_teachers ?? []
  const canManageRoster = !!permissions?.can_manage_roster

  return (
    <div className="space-y-6">
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

      {/* Tabs */}
      <ClassDetailTabs activeTab={activeTab} classId={classId} />

      {/* Students tab */}
      {activeTab === 'students' && (
        <div className="space-y-8">
          {/* Teaching Team */}
          {classTeachers.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="size-5 text-muted-foreground" />
                Teaching Team
                <span className="text-sm font-normal text-muted-foreground">({classTeachers.length})</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {classTeachers.map((ct: {
                  id: string
                  class_role: string
                  profiles: { first_name: string; last_name: string } | null
                }) => (
                  <div
                    key={ct.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium">
                      {ct.profiles ? `${ct.profiles.first_name} ${ct.profiles.last_name}` : '—'}
                    </span>
                    <Badge
                      variant={ct.class_role === 'lead_teacher' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ct.class_role === 'lead_teacher' ? 'Lead' : 'Co-teacher'}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Students */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Students
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({activeCount}{allEnrollments.length > activeCount ? ` + ${allEnrollments.length - activeCount} pending` : ''})
                </span>
              </h2>
            </div>
            {canManageRoster && (
              <AddStudentForm
                classId={classId}
                orgId={profile.organization_id ?? ''}
                gcEnabled={gcEnabled}
                gcIsConnected={gcIsConnected}
                gcLinkedCourse={gcLinkedCourse}
              />
            )}
            <EnrollmentTable classId={classId} enrollments={allEnrollments} canManageRoster={canManageRoster} />
          </section>
        </div>
      )}

      {/* Labs tab */}
      {activeTab === 'labs' && (
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Monitor</th>
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
                      <td className="px-4 py-3">
                        <Link
                          href={`/teacher/labs/${assignment.labs.id}/monitor?classId=${classId}`}
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
                        >
                          <Monitor className="size-4" />
                          Monitor
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
