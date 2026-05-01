import type { StudentRunSnapshot } from '@/features/monitoring/realtime'
import { XP_PER_STEP, XP_PER_LAB_COMPLETE, getLevel } from '@/lib/gamification'
import type { StudentWorkStatus } from '@/types/app'

interface LeaderboardProps {
  runs: StudentRunSnapshot[]
  totalSteps: number
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  on_track:        { label: 'On Track',     className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  need_help:       { label: 'Need Help',    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  stuck:           { label: 'Stuck',        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  waiting_for_check: { label: 'Waiting',   className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  finished_step:   { label: 'Step Done',   className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
}

const RANK_STYLES = [
  'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400',
  'bg-slate-50 dark:bg-slate-800/40 border-l-4 border-slate-400',
  'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400',
]

const MEDALS = ['🥇', '🥈', '🥉']

function computeXp(run: StudentRunSnapshot, totalSteps: number): number {
  const completedSteps = Math.max(0, run.current_step - 1)
  const isComplete = run.current_step > totalSteps
  return completedSteps * XP_PER_STEP + (isComplete ? XP_PER_LAB_COMPLETE : 0)
}

export function Leaderboard({ runs, totalSteps }: LeaderboardProps) {
  const ranked = [...runs]
    .map((r) => ({ ...r, xp: computeXp(r, totalSteps) }))
    .sort((a, b) => b.xp - a.xp || b.current_step - a.current_step)

  if (ranked.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No students have started this lab yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Ranked by XP earned in this lab · Updates live
      </p>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-12">Rank</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Student</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Level</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Step</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">XP</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((run, idx) => {
              const level = getLevel(run.xp)
              const status = STATUS_LABELS[run.status as StudentWorkStatus] ?? STATUS_LABELS.on_track
              const rowStyle = RANK_STYLES[idx] ?? ''
              return (
                <tr
                  key={run.student_id}
                  className={`border-b border-border last:border-0 transition-colors ${rowStyle}`}
                >
                  <td className="px-4 py-3 font-bold text-center">
                    {idx < 3 ? (
                      <span className="text-lg">{MEDALS[idx]}</span>
                    ) : (
                      <span className="text-muted-foreground">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {run.first_name} {run.last_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${level.colorClass}`}>
                      {level.emoji} {level.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {run.current_step > totalSteps ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">Done</span>
                    ) : (
                      `${run.current_step} / ${totalSteps}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    {run.xp}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
