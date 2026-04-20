import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Users, FlaskConical, ChevronRight } from 'lucide-react'

interface ClassRow {
  id: string
  name: string
  period: string | null
  school_year: string | null
  class_teachers: Array<{
    class_role: string
    profiles: { id: string; first_name: string; last_name: string } | null
  }>
  class_enrollments: Array<{ count: number }> | [{ count: number }]
  lab_assignments: Array<{ count: number }> | [{ count: number }]
}

function getCount(countField: unknown): number {
  if (Array.isArray(countField) && countField.length > 0) {
    return typeof countField[0] === 'object' ? (countField[0] as { count: number }).count : 0
  }
  return 0
}

export function AdminClassTable({ classes }: { classes: ClassRow[] }) {
  if (classes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No classes yet. Create one to get started.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Class</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teachers</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Students</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Labs</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {classes.map((cls, idx) => {
            const studentCount = getCount(cls.class_enrollments)
            const labCount = getCount(cls.lab_assignments)
            return (
              <tr
                key={cls.id}
                className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{cls.name}</div>
                  <div className="flex gap-1.5 mt-0.5">
                    {cls.period && <Badge variant="outline" className="text-xs">{cls.period}</Badge>}
                    {cls.school_year && <Badge variant="outline" className="text-xs">{cls.school_year}</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    {cls.class_teachers.map((ct, i) => (
                      <span key={i} className="text-sm text-muted-foreground">
                        {ct.profiles ? `${ct.profiles.first_name} ${ct.profiles.last_name}` : '—'}
                        {ct.class_role === 'lead_teacher' && (
                          <span className="ml-1 text-xs text-primary">(lead)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5" />
                    {studentCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <FlaskConical className="size-3.5" />
                    {labCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/classes/${cls.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Manage <ChevronRight className="size-3.5" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
