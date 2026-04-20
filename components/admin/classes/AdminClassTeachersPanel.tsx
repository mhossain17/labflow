'use client'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { adminRemoveTeacher } from '@/features/admin/class-actions'
import { AssignTeacherDialog } from './AssignTeacherDialog'
import { UserMinus } from 'lucide-react'

interface ClassTeacherRow {
  id: string
  teacher_id: string
  class_role: string
  can_manage_roster: boolean
  can_manage_assignments: boolean
  can_manage_grades: boolean
  can_edit_class_settings: boolean
  profiles: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  } | null
}

interface OrgTeacher {
  id: string
  first_name: string
  last_name: string
}

interface AdminClassTeachersPanelProps {
  classId: string
  classTeachers: ClassTeacherRow[]
  orgTeachers: OrgTeacher[]
}

function RemoveButton({ classId, teacherId }: { classId: string; teacherId: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => startTransition(() => adminRemoveTeacher(classId, teacherId))}
      title="Remove from class"
    >
      <UserMinus className="size-4 text-muted-foreground" />
    </Button>
  )
}

const PERM_LABELS: Record<string, string> = {
  can_manage_roster: 'Roster',
  can_manage_assignments: 'Labs',
  can_manage_grades: 'Grades',
  can_edit_class_settings: 'Settings',
}

export function AdminClassTeachersPanel({ classId, classTeachers, orgTeachers }: AdminClassTeachersPanelProps) {
  const assignedIds = new Set(classTeachers.map(ct => ct.teacher_id))
  const available = orgTeachers.filter(t => !assignedIds.has(t.id))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          Teaching Team
          <span className="ml-2 text-sm font-normal text-muted-foreground">({classTeachers.length})</span>
        </h3>
        <AssignTeacherDialog classId={classId} availableTeachers={available} />
      </div>
      {classTeachers.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No teachers assigned yet.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teacher</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Permissions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {classTeachers.map((ct, idx) => (
                <tr
                  key={ct.id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                >
                  <td className="px-4 py-3 font-medium">
                    {ct.profiles ? `${ct.profiles.first_name} ${ct.profiles.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ct.class_role === 'lead_teacher' ? 'default' : 'secondary'}>
                      {ct.class_role === 'lead_teacher' ? 'Lead' : 'Co-teacher'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(PERM_LABELS).map(([key, label]) => {
                        const hasPermission = ct[key as keyof ClassTeacherRow] as boolean
                        return hasPermission ? (
                          <Badge key={key} variant="outline" className="text-xs">{label}</Badge>
                        ) : null
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RemoveButton classId={classId} teacherId={ct.teacher_id} />
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
