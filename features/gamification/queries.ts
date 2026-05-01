import { createClient } from '@/lib/supabase/server'
import {
  XP_PER_STEP,
  XP_PER_LAB_COMPLETE,
  XP_ON_TIME_BONUS,
  XP_GRADE_BONUS,
} from '@/lib/gamification'

export async function getStudentXp(studentId: string): Promise<number> {
  const supabase = await createClient()

  const [{ count: stepCount }, { data: runs }] = await Promise.all([
    supabase
      .from('step_responses')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('completed', true),
    supabase
      .from('student_lab_runs')
      .select('completed_at, lab_assignments(due_date), student_grades(letter_grade)')
      .eq('student_id', studentId)
      .not('completed_at', 'is', null),
  ])

  let xp = (stepCount ?? 0) * XP_PER_STEP

  for (const run of runs ?? []) {
    xp += XP_PER_LAB_COMPLETE

    const dueDate = (run.lab_assignments as { due_date: string | null } | null)?.due_date
    if (dueDate && run.completed_at) {
      const due = new Date(dueDate)
      due.setHours(23, 59, 59)
      if (new Date(run.completed_at) <= due) xp += XP_ON_TIME_BONUS
    }

    const grades = run.student_grades as { letter_grade: string | null }[] | null
    const letterGrade = grades?.[0]?.letter_grade?.charAt(0)
    if (letterGrade && XP_GRADE_BONUS[letterGrade] !== undefined) {
      xp += XP_GRADE_BONUS[letterGrade]
    }
  }

  return xp
}

export async function getStudentXpWithRank(
  studentId: string,
  orgId: string
): Promise<{ xp: number; rank: number | null; total: number }> {
  const supabase = await createClient()

  // Get all students in org
  const { data: students } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .eq('role', 'student')
    .eq('status', 'active')

  if (!students || students.length === 0) {
    const xp = await getStudentXp(studentId)
    return { xp, rank: 1, total: 1 }
  }

  // Get completed step counts for all org students in one query
  const { data: stepRows } = await supabase
    .from('step_responses')
    .select('student_id')
    .in(
      'student_id',
      students.map((s) => s.id)
    )
    .eq('completed', true)

  const stepCounts: Record<string, number> = {}
  for (const row of stepRows ?? []) {
    stepCounts[row.student_id] = (stepCounts[row.student_id] ?? 0) + 1
  }

  // Sort by step count descending, find this student's rank
  const sorted = students
    .map((s) => ({ id: s.id, steps: stepCounts[s.id] ?? 0 }))
    .sort((a, b) => b.steps - a.steps)

  const rank = sorted.findIndex((s) => s.id === studentId) + 1
  const xp = await getStudentXp(studentId)

  return { xp, rank: rank > 0 ? rank : null, total: students.length }
}
