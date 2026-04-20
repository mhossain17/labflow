import { createClient } from '@/lib/supabase/server'

async function db() {
  return createClient()
}

export async function getLabRun(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('*, labs(*), lab_assignments(*)')
    .eq('id', labRunId)
    .single()
  return data
}

export async function getLabRunWithSteps(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('*, labs(*, lab_steps(*), pre_lab_questions(*)), lab_assignments(*)')
    .eq('id', labRunId)
    .single()
  return data
}

export async function getPreLabResponses(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('pre_lab_responses')
    .select('*')
    .eq('lab_run_id', labRunId)
  return data ?? []
}

export async function getStepResponse(labRunId: string, stepId: string) {
  const client = await db()
  const { data } = await client
    .from('step_responses')
    .select('*')
    .eq('lab_run_id', labRunId)
    .eq('step_id', stepId)
    .maybeSingle()
  return data
}

export async function getStepResponses(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('step_responses')
    .select('*')
    .eq('lab_run_id', labRunId)
  return data ?? []
}

export async function getActiveHelpRequest(labRunId: string, stepId?: string) {
  const client = await db()
  let query = client
    .from('help_requests')
    .select('*')
    .eq('lab_run_id', labRunId)
    .eq('resolved', false)

  if (stepId) {
    query = query.eq('step_id', stepId)
  }

  const { data } = await query.maybeSingle()
  return data
}

export async function listStudentLabRuns(studentId: string) {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('*, labs(*), lab_assignments(*)')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })
  return data ?? []
}

export async function checkLabRunOwnership(
  labRunId: string,
  studentId: string
): Promise<boolean> {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('id')
    .eq('id', labRunId)
    .eq('student_id', studentId)
    .maybeSingle()
  return !!data
}

export async function getStudentDashboardData(studentId: string) {
  const client = await createClient()
  const db = client as any

  const { data: enrollments } = await db
    .from('class_enrollments')
    .select(`
      class_id,
      classes(
        id, name, period, school_year, archived,
        profiles:teacher_id(first_name, last_name),
        lab_assignments(
          id, due_date, lab_id,
          labs(id, title, overview, estimated_minutes, status)
        )
      )
    `)
    .eq('student_id', studentId)

  const { data: runs } = await db
    .from('student_lab_runs')
    .select('id, assignment_id, current_step, prelab_completed, status, completed_at, lab_id, labs(title, lab_steps(id))')
    .eq('student_id', studentId)

  const runsByAssignment = new Map<string, typeof runs[0]>()
  for (const run of (runs ?? [])) {
    if (run.assignment_id) runsByAssignment.set(run.assignment_id, run)
  }

  const classes = (enrollments ?? [])
    .map((e: any) => e.classes)
    .filter(Boolean)
    .filter((c: any) => !c.archived)
    .map((cls: any) => ({
      ...cls,
      lab_assignments: (cls.lab_assignments ?? [])
        .filter((a: any) => a.labs?.status === 'published')
        .map((a: any) => ({
          ...a,
          lab_run: runsByAssignment.get(a.id) ?? null,
        })),
    }))

  return classes
}

export async function getAllGradesForStudent(studentId: string) {
  const client = await createClient()
  const db = client as any

  const { data: runs } = await db
    .from('student_lab_runs')
    .select(`
      id, assignment_id, completed_at, status,
      lab_assignments!inner(
        class_id,
        classes!inner(id, name, period),
        labs!inner(id, title)
      )
    `)
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })

  if (!runs || runs.length === 0) return []

  const runIds = runs.map((r: any) => r.id)
  const { data: grades } = await db
    .from('student_grades')
    .select('lab_run_id, letter_grade, total_score, max_score, graded_at')
    .in('lab_run_id', runIds)

  const gradeMap = new Map<string, {
    letter_grade: string | null
    total_score: number
    max_score: number
    graded_at: string
  }>()
  for (const g of grades ?? []) {
    gradeMap.set(g.lab_run_id, g)
  }

  return runs.map((run: any) => {
    const assignment = run.lab_assignments
    const cls = assignment?.classes
    const lab = assignment?.labs
    return {
      lab_run_id: run.id,
      class_id: cls?.id ?? '',
      class_name: cls?.name ?? '—',
      class_period: cls?.period ?? null,
      lab_id: lab?.id ?? '',
      lab_title: lab?.title ?? '—',
      completed_at: run.completed_at,
      status: run.status,
      grade: gradeMap.get(run.id) ?? null,
    }
  })
}

export async function getGradeForRun(labRunId: string) {
  const client = await createClient()
  const db = client as any

  const [{ data: grade }, { data: scores }] = await Promise.all([
    db.from('student_grades').select('*').eq('lab_run_id', labRunId).maybeSingle(),
    db.from('rubric_scores')
      .select('*, rubric_items(id, title, description, max_points, position)')
      .eq('lab_run_id', labRunId),
  ])

  return { grade: grade ?? null, scores: scores ?? [] }
}
