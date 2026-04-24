import { getProfile } from '@/lib/auth/session'
import { redirect, notFound } from 'next/navigation'
import { getClassDetailForAdmin, listTeachersByOrg, listStudentsByOrg } from '@/features/admin/class-queries'
import { AdminClassTeachersPanel } from '@/components/admin/classes/AdminClassTeachersPanel'
import { AdminClassStudentsPanel } from '@/components/admin/classes/AdminClassStudentsPanel'
import { Badge } from '@/components/ui/badge'
import { LabStatusBadge } from '@/components/teacher/lab-builder/LabStatusBadge'
import Link from 'next/link'
import { ArrowLeft, Calendar, FlaskConical } from 'lucide-react'
import type { LabStatus } from '@/types/app'

interface PageProps {
  params: Promise<{ classId: string }>
}

export default async function AdminClassDetailPage({ params }: PageProps) {
  const { classId } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!['school_admin', 'super_admin'].includes(profile.role)) redirect('/teacher/classes')
  if (!profile.organization_id) redirect('/super-admin')

  const [cls, orgTeachers, orgStudents] = await Promise.all([
    getClassDetailForAdmin(classId),
    listTeachersByOrg(profile.organization_id),
    listStudentsByOrg(profile.organization_id),
  ])

  if (!cls) notFound()

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/classes"
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

      <AdminClassTeachersPanel
        classId={classId}
        classTeachers={cls.class_teachers ?? []}
        orgTeachers={orgTeachers}
      />

      <AdminClassStudentsPanel
        classId={classId}
        enrollments={cls.class_enrollments ?? []}
        orgStudents={orgStudents}
      />

      {/* Assigned Labs (read-only view) */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">
          Assigned Labs
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({(cls.lab_assignments ?? []).length})
          </span>
        </h3>
        {(cls.lab_assignments ?? []).length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
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
                {(cls.lab_assignments ?? []).map((a: {
                  id: string
                  due_date: string | null
                  labs: { id: string; title: string; status: LabStatus }
                }, idx: number) => (
                  <tr
                    key={a.id}
                    className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <FlaskConical className="size-4 text-muted-foreground" />
                        {a.labs?.title ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.labs?.status && <LabStatusBadge status={a.labs.status} />}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.due_date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-4" />
                          {new Date(a.due_date).toLocaleDateString()}
                        </span>
                      ) : '—'}
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
