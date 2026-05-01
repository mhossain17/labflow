'use client'
import { getLevel, progressToNextLevel, xpToNextLevel } from '@/lib/gamification'

interface XpDisplayProps {
  xp: number
  rank?: number | null
  total?: number
  compact?: boolean
}

export function XpDisplay({ xp, rank, total, compact = false }: XpDisplayProps) {
  const level = getLevel(xp)
  const progress = progressToNextLevel(xp)
  const toNext = xpToNextLevel(xp)

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${level.bgClass} ${level.colorClass}`}
      >
        {level.emoji} {level.name} · {xp} XP
      </span>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{level.emoji}</span>
          <div>
            <p className={`font-bold text-sm ${level.colorClass}`}>{level.name}</p>
            <p className="text-xs text-muted-foreground">{xp} XP total</p>
          </div>
        </div>
        {rank != null && total != null && (
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground">
              #{rank} <span className="text-muted-foreground font-normal">of {total}</span>
            </p>
            <p className="text-xs text-muted-foreground">class rank</p>
          </div>
        )}
      </div>

      {/* Progress to next level */}
      {toNext !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to next level</span>
            <span>{toNext} XP to go</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${level.colorClass.replace('text-', 'bg-').replace(' dark:text-', ' dark:bg-')}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {toNext === null && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
          🏆 Maximum level reached!
        </p>
      )}
    </div>
  )
}
