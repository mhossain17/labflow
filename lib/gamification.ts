export type XpLevel = {
  name: string
  emoji: string
  minXp: number
  maxXp: number | null
  colorClass: string
  bgClass: string
}

export const LEVELS: XpLevel[] = [
  { name: 'Novice',       emoji: '🔬', minXp: 0,    maxXp: 99,   colorClass: 'text-slate-600 dark:text-slate-400',  bgClass: 'bg-slate-100 dark:bg-slate-800' },
  { name: 'Explorer',     emoji: '🧭', minXp: 100,  maxXp: 299,  colorClass: 'text-blue-600 dark:text-blue-400',    bgClass: 'bg-blue-100 dark:bg-blue-900/40' },
  { name: 'Investigator', emoji: '🔍', minXp: 300,  maxXp: 599,  colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-100 dark:bg-purple-900/40' },
  { name: 'Scientist',    emoji: '⚗️', minXp: 600,  maxXp: 999,  colorClass: 'text-orange-600 dark:text-orange-400', bgClass: 'bg-orange-100 dark:bg-orange-900/40' },
  { name: 'Expert',       emoji: '🏆', minXp: 1000, maxXp: null, colorClass: 'text-yellow-600 dark:text-yellow-400', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40' },
]

export function getLevel(xp: number): XpLevel {
  return [...LEVELS].reverse().find((l) => xp >= l.minXp) ?? LEVELS[0]
}

export function progressToNextLevel(xp: number): number {
  const current = getLevel(xp)
  if (current.maxXp === null) return 100
  const range = current.maxXp - current.minXp + 1
  const earned = xp - current.minXp
  return Math.round((earned / range) * 100)
}

export function xpToNextLevel(xp: number): number | null {
  const current = getLevel(xp)
  if (current.maxXp === null) return null
  return current.maxXp + 1 - xp
}

export const XP_PER_STEP = 10
export const XP_PER_LAB_COMPLETE = 50
export const XP_ON_TIME_BONUS = 25
export const XP_GRADE_BONUS: Record<string, number> = {
  A: 100, B: 75, C: 50, D: 25, F: 0,
}

export function motivationalMessage(progressPct: number): string {
  if (progressPct === 0) return "Ready to start? Let's go! 💪"
  if (progressPct < 25) return 'Just getting started — great work! 🌱'
  if (progressPct < 50) return "You're making progress! Keep it up 🚀"
  if (progressPct < 75) return "Halfway there — you've got this! ⚡"
  if (progressPct < 90) return 'Almost there! Just a few more steps 🔥'
  return "Final stretch — you're crushing it! 🏁"
}
