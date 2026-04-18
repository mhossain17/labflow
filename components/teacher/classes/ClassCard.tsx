import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FlaskConical, ChevronRight } from 'lucide-react'

interface ClassCardProps {
  cls: {
    id: string
    name: string
    period: string | null
    school_year: string | null
    description: string | null
    class_enrollments: Array<unknown> | { count: number } | null
    lab_assignments: Array<unknown> | { count: number } | null
  }
}

function getCount(val: Array<unknown> | { count: number } | null): number {
  if (!val) return 0
  if (Array.isArray(val)) {
    const first = val[0] as { count?: number | string } | undefined
    if (first && typeof first.count !== 'undefined') return Number(first.count)
    return val.length
  }
  return val.count ?? 0
}

export function ClassCard({ cls }: ClassCardProps) {
  const studentCount = getCount(cls.class_enrollments)
  const labCount = getCount(cls.lab_assignments)

  return (
    <Link href={`/teacher/classes/${cls.id}`} className="block group">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="group-hover:text-primary transition-colors">{cls.name}</CardTitle>
            <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {cls.period && (
              <Badge variant="outline">{cls.period}</Badge>
            )}
            {cls.school_year && (
              <Badge variant="outline">{cls.school_year}</Badge>
            )}
          </div>
          {cls.description && (
            <CardDescription className="line-clamp-2">{cls.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {studentCount} {studentCount === 1 ? 'student' : 'students'}
            </span>
            <span className="flex items-center gap-1.5">
              <FlaskConical className="size-4" />
              {labCount} active {labCount === 1 ? 'lab' : 'labs'}
            </span>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          View class details
        </CardFooter>
      </Card>
    </Link>
  )
}
