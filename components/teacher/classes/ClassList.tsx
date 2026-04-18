import { ClassCard } from './ClassCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { GraduationCap } from 'lucide-react'

interface ClassListProps {
  classes: Array<{
    id: string
    name: string
    period: string | null
    school_year: string | null
    description: string | null
    class_enrollments: Array<unknown> | { count: number } | null
    lab_assignments: Array<unknown> | { count: number } | null
  }>
}

export function ClassList({ classes }: ClassListProps) {
  if (classes.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="size-12" />}
        title="No classes yet"
        description="No classes yet. Create your first class to get started."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((cls) => (
        <ClassCard key={cls.id} cls={cls} />
      ))}
    </div>
  )
}
