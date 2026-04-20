'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  C: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  D: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  F: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

function GradeBadge({ letter }: { letter: string | null }) {
  if (!letter) return <span className="text-muted-foreground text-xs">—</span>
  const color = GRADE_COLORS[letter[0].toUpperCase()] ?? 'bg-muted text-muted-foreground'
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${color}`}>{letter}</span>
}

interface GradeRow {
  lab_run_id: string
  student_id: string
  student_name: string
  class_id: string
  class_name: string
  class_period: string | null
  lab_id: string
  lab_title: string
  completed_at: string
  grade: {
    letter_grade: string | null
    total_score: number
    max_score: number
    graded_at: string
  } | null
}

interface TeacherGradeOverviewProps {
  rows: GradeRow[]
}

export function TeacherGradeOverview({ rows }: TeacherGradeOverviewProps) {
  const [filter, setFilter] = useState<'all' | 'needs_grading'>('all')

  const filtered = rows.filter(r => {
    if (filter === 'needs_grading') return !r.grade
    return true
  })

  const needsGradingCount = rows.filter(r => !r.grade).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          All Submissions ({rows.length})
        </button>
        <button
          onClick={() => setFilter('needs_grading')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'needs_grading' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          Needs Grading
          {needsGradingCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs size-5">
              {needsGradingCount}
            </span>
          )}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {filter === 'needs_grading' ? 'All submissions have been graded.' : 'No completed submissions yet.'}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Class</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lab</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Grade</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr
                  key={row.lab_run_id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                >
                  <td className="px-4 py-3 font-medium">{row.student_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.class_name}
                    {row.class_period && <span className="text-xs ml-1">({row.class_period})</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.lab_title}</td>
                  <td className="px-4 py-3">
                    {row.grade ? (
                      <GradeBadge letter={row.grade.letter_grade} />
                    ) : (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                        Needs Grading
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.grade ? (
                      <>
                        {row.grade.total_score}/{row.grade.max_score}
                        <span className="text-xs ml-1">
                          ({row.grade.max_score > 0 ? Math.round(row.grade.total_score / row.grade.max_score * 100) : 0}%)
                        </span>
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/teacher/labs/${row.lab_id}/grade/${row.lab_run_id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {row.grade ? 'View' : 'Grade'}
                    </Link>
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
