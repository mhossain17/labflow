import type { StudentUsageStat } from '@/features/analytics/admin-queries'

export function StudentUsageTable({ stats }: { stats: StudentUsageStat[] }) {
  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No student activity data yet.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Student</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Attempted</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Completed</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg Grade</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Help Requests</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s, idx) => (
            <tr
              key={s.student_id}
              className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
            >
              <td className="px-4 py-3 font-medium">{s.student_name}</td>
              <td className="px-4 py-3 text-right tabular-nums">{s.labs_attempted}</td>
              <td className="px-4 py-3 text-right tabular-nums">{s.labs_completed}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {s.avg_grade_pct !== null ? `${s.avg_grade_pct}%` : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{s.help_requests_sent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
