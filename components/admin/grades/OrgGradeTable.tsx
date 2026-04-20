'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { OrgGradeRow } from '@/features/admin/grade-queries'

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

interface FilterState {
  classId: string
  labId: string
}

interface ClassOption { id: string; name: string; period: string | null }
interface LabOption { id: string; title: string }

interface OrgGradeTableProps {
  rows: OrgGradeRow[]
  classOptions: ClassOption[]
  labOptions: LabOption[]
}

export function OrgGradeTable({ rows, classOptions, labOptions }: OrgGradeTableProps) {
  const [filters, setFilters] = useState<FilterState>({ classId: '', labId: '' })

  const filtered = rows.filter(r => {
    if (filters.classId && r.class_id !== filters.classId) return false
    if (filters.labId && r.lab_id !== filters.labId) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <select
            value={filters.classId}
            onChange={e => setFilters(f => ({ ...f, classId: e.target.value }))}
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Classes</option>
            {classOptions.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.period ? ` (${c.period})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Lab</label>
          <select
            value={filters.labId}
            onChange={e => setFilters(f => ({ ...f, labId: e.target.value }))}
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Labs</option>
            {labOptions.map(l => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        </div>
        {(filters.classId || filters.labId) && (
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ classId: '', labId: '' })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear filters
            </button>
          </div>
        )}
        <div className="flex items-end ml-auto">
          <span className="text-sm text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No graded submissions match the selected filters.
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Graded By</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr
                  key={row.grade_id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                >
                  <td className="px-4 py-3 font-medium">{row.student_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.class_name}
                    {row.class_period && <span className="text-xs ml-1">({row.class_period})</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.lab_title}</td>
                  <td className="px-4 py-3"><GradeBadge letter={row.letter_grade} /></td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.total_score}/{row.max_score}
                    <span className="text-xs ml-1">
                      ({row.max_score > 0 ? Math.round(row.total_score / row.max_score * 100) : 0}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{row.graded_by_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(row.graded_at).toLocaleDateString()}
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
