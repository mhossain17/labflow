import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, PlayCircle } from 'lucide-react'

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  D: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  F: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

interface GradeEntry {
  lab_run_id: string
  class_id: string
  class_name: string
  class_period: string | null
  lab_id: string
  lab_title: string
  completed_at: string | null
  status: string
  grade: {
    letter_grade: string | null
    total_score: number
    max_score: number
    graded_at: string
  } | null
}

interface StudentGradeCardProps {
  entries: GradeEntry[]
}

function GradeChip({ entry }: { entry: GradeEntry }) {
  if (!entry.completed_at) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <PlayCircle className="size-3.5" />
        In Progress
      </div>
    )
  }
  if (!entry.grade) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <Clock className="size-3.5" />
        Pending
      </div>
    )
  }
  const { letter_grade, total_score, max_score } = entry.grade
  const pct = max_score > 0 ? Math.round(total_score / max_score * 100) : 0
  const color = letter_grade ? (GRADE_COLORS[letter_grade[0].toUpperCase()] ?? 'bg-muted text-muted-foreground') : ''
  return (
    <div className="flex items-center gap-2">
      {letter_grade && (
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${color}`}>
          {letter_grade}
        </span>
      )}
      <span className="text-xs text-muted-foreground">
        {total_score}/{max_score} ({pct}%)
      </span>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <CheckCircle className="size-3.5 text-green-600" />
        Graded
      </div>
    </div>
  )
}

export function StudentGradeCard({ entries }: StudentGradeCardProps) {
  // Group by class
  const classMap = new Map<string, { name: string; period: string | null; entries: GradeEntry[] }>()
  for (const entry of entries) {
    if (!classMap.has(entry.class_id)) {
      classMap.set(entry.class_id, { name: entry.class_name, period: entry.class_period, entries: [] })
    }
    classMap.get(entry.class_id)!.entries.push(entry)
  }

  if (classMap.size === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No lab submissions yet. Complete a lab to see your grades here.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Array.from(classMap.entries()).map(([classId, cls]) => (
        <div key={classId} className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
            <span className="font-semibold">{cls.name}</span>
            {cls.period && <Badge variant="outline" className="text-xs">{cls.period}</Badge>}
          </div>
          <div className="divide-y divide-border">
            {cls.entries.map(entry => (
              <div key={entry.lab_run_id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{entry.lab_title}</p>
                  {entry.completed_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted {new Date(entry.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <GradeChip entry={entry} />
                  <Link
                    href={`/student/labs/${entry.lab_run_id}/complete`}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
