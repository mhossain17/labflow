'use client'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { removeEnrollmentById } from '@/features/teacher/actions'
import { UserMinus, Clock } from 'lucide-react'

interface StudentProfile {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface Enrollment {
  id: string
  student_id: string | null
  invited_email: string | null
  status: string
  profiles: StudentProfile | null
}

interface EnrollmentTableProps {
  classId: string
  enrollments: Enrollment[]
  canManageRoster?: boolean
}

function RemoveButton({ enrollmentId, classId }: { enrollmentId: string; classId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await removeEnrollmentById(enrollmentId, classId)
          } catch (err) {
            console.error(err)
          }
        })
      }}
      title="Remove from class"
    >
      <UserMinus className="size-4 text-muted-foreground" />
    </Button>
  )
}

export function EnrollmentTable({ classId, enrollments, canManageRoster = true }: EnrollmentTableProps) {
  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No students enrolled yet.
      </div>
    )
  }

  // Sort: active first, pending last
  const sorted = [...enrollments].sort((a, b) => {
    if (a.status === b.status) return 0
    return a.status === 'active' ? -1 : 1
  })

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            {canManageRoster && (
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((enrollment, idx) => {
            const isPending = enrollment.status === 'pending'
            const student = enrollment.profiles

            return (
              <tr
                key={enrollment.id}
                className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} ${isPending ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-3 font-medium">
                  {student
                    ? `${student.first_name} ${student.last_name}`
                    : enrollment.invited_email ?? '—'}
                </td>
                <td className="px-4 py-3">
                  {isPending ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <Clock className="size-3" />
                      Pending sign-up
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  )}
                </td>
                {canManageRoster && (
                  <td className="px-4 py-3 text-right">
                    <RemoveButton enrollmentId={enrollment.id} classId={classId} />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
