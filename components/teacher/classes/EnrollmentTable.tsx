'use client'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { unenrollStudent } from '@/features/teacher/actions'
import { UserMinus } from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface Enrollment {
  id: string
  student_id: string
  profiles: Student
}

interface EnrollmentTableProps {
  classId: string
  enrollments: Enrollment[]
}

function UnenrollButton({ classId, studentId }: { classId: string; studentId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await unenrollStudent(classId, studentId)
          } catch (err) {
            console.error(err)
          }
        })
      }}
      title="Unenroll student"
    >
      <UserMinus className="size-4 text-muted-foreground" />
    </Button>
  )
}

export function EnrollmentTable({ classId, enrollments }: EnrollmentTableProps) {
  if (enrollments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No students enrolled yet.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment, idx) => {
            const student = enrollment.profiles
            return (
              <tr
                key={enrollment.id}
                className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
              >
                <td className="px-4 py-3 font-medium">
                  {student.first_name} {student.last_name}
                </td>
                <td className="px-4 py-3 text-right">
                  <UnenrollButton classId={classId} studentId={enrollment.student_id} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
