import { createClient } from '@/lib/supabase/server'

export type OrgGradeRow = {
  grade_id: string
  lab_run_id: string
  student_id: string
  student_name: string
  class_id: string
  class_name: string
  class_period: string | null
  lab_id: string
  lab_title: string
  graded_by_id: string | null
  graded_by_name: string | null
  letter_grade: string | null
  total_score: number
  max_score: number
  graded_at: string
}

export async function getOrgGradeSummary(
  orgId: string,
  filters?: { classId?: string; labId?: string }
): Promise<OrgGradeRow[]> {
  const supabase = await createClient()
  const db = supabase as any

  let query = db
    .from('student_grades')
    .select(`
      id,
      lab_run_id,
      total_score,
      max_score,
      letter_grade,
      graded_at,
      teacher_id,
      student_lab_runs!inner(
        id, student_id,
        profiles:student_id(id, first_name, last_name),
        lab_assignments!inner(
          lab_id, class_id,
          classes!inner(id, name, period, organization_id),
          labs!inner(id, title)
        )
      )
    `)
    .eq('student_lab_runs.lab_assignments.classes.organization_id', orgId)

  if (filters?.classId) {
    query = query.eq('student_lab_runs.lab_assignments.class_id', filters.classId)
  }
  if (filters?.labId) {
    query = query.eq('student_lab_runs.lab_assignments.lab_id', filters.labId)
  }

  const { data } = await query.order('graded_at', { ascending: false })
  if (!data) return []

  // Fetch grader profiles in one batch
  const graderIds = [...new Set((data as any[]).map((r: any) => r.teacher_id).filter(Boolean))]
  const graderMap = new Map<string, string>()
  if (graderIds.length > 0) {
    const { data: graders } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', graderIds)
    for (const g of graders ?? []) {
      graderMap.set(g.id, `${g.first_name} ${g.last_name}`)
    }
  }

  return (data as any[]).map((row: any) => {
    const run = row.student_lab_runs
    const assignment = run?.lab_assignments
    const cls = assignment?.classes
    const lab = assignment?.labs
    const student = run?.profiles
    return {
      grade_id: row.id,
      lab_run_id: row.lab_run_id,
      student_id: run?.student_id ?? '',
      student_name: student ? `${student.first_name} ${student.last_name}` : '—',
      class_id: cls?.id ?? '',
      class_name: cls?.name ?? '—',
      class_period: cls?.period ?? null,
      lab_id: lab?.id ?? '',
      lab_title: lab?.title ?? '—',
      graded_by_id: row.teacher_id ?? null,
      graded_by_name: row.teacher_id ? (graderMap.get(row.teacher_id) ?? null) : null,
      letter_grade: row.letter_grade,
      total_score: row.total_score,
      max_score: row.max_score,
      graded_at: row.graded_at,
    }
  })
}

export async function listClassesForGradeFilter(orgId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('classes')
    .select('id, name, period')
    .eq('organization_id', orgId)
    .eq('archived', false)
    .order('name', { ascending: true })
  return (data ?? []) as Array<{ id: string; name: string; period: string | null }>
}

export async function listLabsForGradeFilter(orgId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('labs')
    .select('id, title')
    .eq('organization_id', orgId)
    .order('title', { ascending: true })
  return (data ?? []) as Array<{ id: string; title: string }>
}
