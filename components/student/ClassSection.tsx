import { AssignmentCard } from './AssignmentCard'
import { BookOpen } from 'lucide-react'

interface ClassSectionProps {
  cls: {
    id: string
    name: string
    period: string | null
    school_year: string | null
    profiles: { first_name: string; last_name: string } | null
    lab_assignments: any[]
  }
  studentId: string
}

export function ClassSection({ cls, studentId }: ClassSectionProps) {
  const teacher = cls.profiles
    ? `${cls.profiles.first_name} ${cls.profiles.last_name}`
    : null

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-muted-foreground" />
        <div>
          <h2 className="font-semibold text-base">
            {cls.name}
            {cls.period && <span className="text-muted-foreground font-normal text-sm ml-1.5">· {cls.period}</span>}
          </h2>
          {teacher && (
            <p className="text-xs text-muted-foreground">{teacher}</p>
          )}
        </div>
      </div>

      {cls.lab_assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-6">No assignments yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 pl-6">
          {cls.lab_assignments.map((a: any) => (
            <AssignmentCard key={a.id} assignment={a} studentId={studentId} />
          ))}
        </div>
      )}
    </section>
  )
}
