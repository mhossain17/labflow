'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { adminEnrollStudent, adminUnenrollStudent } from '@/features/admin/class-actions'
import { UserMinus, UserPlus } from 'lucide-react'

interface Student {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface EnrollmentRow {
  id: string
  student_id: string
  enrolled_at: string
  profiles: Student | null
}

interface AdminClassStudentsPanelProps {
  classId: string
  enrollments: EnrollmentRow[]
  orgStudents: Student[]
}

function UnenrollButton({ classId, studentId }: { classId: string; studentId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => startTransition(() => adminUnenrollStudent(classId, studentId))}
      title="Remove student"
    >
      <UserMinus className="size-4 text-muted-foreground" />
    </Button>
  )
}

function AddStudentSelect({ classId, enrolled, orgStudents }: {
  classId: string
  enrolled: Set<string>
  orgStudents: Student[]
}) {
  const [studentId, setStudentId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const available = orgStudents.filter(s => !enrolled.has(s.id))

  function handleAdd() {
    if (!studentId) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await adminEnrollStudent(classId, studentId)
        if (result && 'already' in result) setError('Student already enrolled')
        else setStudentId('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to enroll student')
      }
    })
  }

  if (available.length === 0) return null

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Add Student</label>
        <select
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a student…</option>
          {available.map(s => (
            <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
          ))}
        </select>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <Button size="sm" disabled={!studentId || isPending} onClick={handleAdd}>
        <UserPlus className="size-4 mr-1.5" />
        Enroll
      </Button>
    </div>
  )
}

export function AdminClassStudentsPanel({ classId, enrollments, orgStudents }: AdminClassStudentsPanelProps) {
  const enrolledIds = new Set(enrollments.map(e => e.student_id))

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">
        Students
        <span className="ml-2 text-sm font-normal text-muted-foreground">({enrollments.length})</span>
      </h3>
      <AddStudentSelect classId={classId} enrolled={enrolledIds} orgStudents={orgStudents} />
      {enrollments.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No students enrolled yet.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Enrolled</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e, idx) => (
                <tr
                  key={e.id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                >
                  <td className="px-4 py-3 font-medium">
                    {e.profiles ? `${e.profiles.first_name} ${e.profiles.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(e.enrolled_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UnenrollButton classId={classId} studentId={e.student_id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
