'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { adminAssignTeacher } from '@/features/admin/class-actions'
import { UserPlus } from 'lucide-react'

interface Teacher {
  id: string
  first_name: string
  last_name: string
}

interface AssignTeacherDialogProps {
  classId: string
  availableTeachers: Teacher[]
}

export function AssignTeacherDialog({ classId, availableTeachers }: AssignTeacherDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const teacherId = fd.get('teacherId') as string
    const classRole = fd.get('classRole') as 'lead_teacher' | 'co_teacher'
    const can_manage_roster = fd.get('can_manage_roster') === 'on'
    const can_manage_assignments = fd.get('can_manage_assignments') === 'on'
    const can_manage_grades = fd.get('can_manage_grades') === 'on'
    const can_edit_class_settings = fd.get('can_edit_class_settings') === 'on'
    if (!teacherId) return

    setError(null)
    startTransition(async () => {
      try {
        await adminAssignTeacher(classId, teacherId, classRole, {
          can_manage_roster,
          can_manage_assignments,
          can_manage_grades,
          can_edit_class_settings,
        })
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign teacher')
      }
    })
  }

  if (availableTeachers.length === 0 && !open) {
    return <p className="text-xs text-muted-foreground">All org teachers are already assigned.</p>
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="size-4 mr-1.5" />
        Add Teacher
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add Teacher to Class</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Teacher <span className="text-destructive">*</span></label>
            <select name="teacherId" required className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select a teacher…</option>
              {availableTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Role</label>
            <select name="classRole" defaultValue="co_teacher" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="co_teacher">Co-teacher</option>
              <option value="lead_teacher">Lead Teacher</option>
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Permissions (all on by default)</legend>
            {[
              { name: 'can_manage_roster', label: 'Manage student roster' },
              { name: 'can_manage_assignments', label: 'Assign & unassign labs' },
              { name: 'can_manage_grades', label: 'Grade student submissions' },
              { name: 'can_edit_class_settings', label: 'Edit class settings (name, period, etc.)' },
            ].map(p => (
              <label key={p.name} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name={p.name}
                  defaultChecked={p.name !== 'can_edit_class_settings'}
                  className="rounded border-input"
                />
                {p.label}
              </label>
            ))}
          </fieldset>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Adding…' : 'Add Teacher'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
