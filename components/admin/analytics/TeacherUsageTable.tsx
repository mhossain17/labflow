import type { TeacherUsageStat } from '@/features/analytics/admin-queries'

export function TeacherUsageTable({ stats }: { stats: TeacherUsageStat[] }) {
  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No teacher activity data yet.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Teacher</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Labs Created</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Classes</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Students</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Graded</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Escalations</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((t, idx) => (
            <tr
              key={t.teacher_id}
              className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
            >
              <td className="px-4 py-3 font-medium">{t.teacher_name}</td>
              <td className="px-4 py-3 text-right tabular-nums">{t.labs_created}</td>
              <td className="px-4 py-3 text-right tabular-nums">{t.classes_taught}</td>
              <td className="px-4 py-3 text-right tabular-nums">{t.total_students}</td>
              <td className="px-4 py-3 text-right tabular-nums">{t.submissions_graded}</td>
              <td className="px-4 py-3 text-right tabular-nums">{t.help_escalations_received}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
