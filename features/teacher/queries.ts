import { createClient } from '@/lib/supabase/server'

export async function listClassesByTeacher(teacherId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('classes')
    .select('*, class_enrollments(count), lab_assignments(count)')
    .eq('teacher_id', teacherId)
    .eq('archived', false)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getClassWithEnrollments(classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('classes')
    .select('*, class_enrollments(*, profiles(id, first_name, last_name, avatar_url))')
    .eq('id', classId)
    .single()
  return data
}

export async function listLabsByTeacher(teacherId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('labs')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getLabWithSteps(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('labs')
    .select('*, lab_steps(*), pre_lab_questions(*)')
    .eq('id', labId)
    .single()
  return data
}

export async function getLabAssignments(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('lab_assignments')
    .select('*, classes(id, name, period)')
    .eq('lab_id', labId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function listAvailableClasses(teacherId: string, labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // Get all teacher classes
  const { data: allClasses } = await db
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('archived', false)
  // Get already-assigned class ids for this lab
  const { data: assignments } = await db
    .from('lab_assignments')
    .select('class_id')
    .eq('lab_id', labId)
  const assignedIds = new Set((assignments ?? []).map((a: { class_id: string }) => a.class_id))
  return (allClasses ?? []).filter((c: { id: string }) => !assignedIds.has(c.id))
}

export async function listAllTeacherMaterials(teacherId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('teacher_materials')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getSubmissionsForGrading(labId: string) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: assignments } = await db
    .from('lab_assignments')
    .select(`
      id, class_id,
      classes(id, name, period),
      student_lab_runs(
        id, student_id, completed_at, status, started_at,
        profiles:student_id(id, first_name, last_name),
        student_grades(id, total_score, max_score, letter_grade, graded_at)
      )
    `)
    .eq('lab_id', labId)

  return (assignments ?? []).map((a: any) => ({
    ...a,
    student_lab_runs: (a.student_lab_runs ?? []).filter((r: any) => !!r.completed_at),
  }))
}

export async function getGradingSheetData(labRunId: string) {
  const supabase = await createClient()
  const db = supabase as any

  const [{ data: run }, { data: rubricScores }] = await Promise.all([
    db.from('student_lab_runs')
      .select(`
        id, student_id, lab_id, completed_at,
        profiles:student_id(id, first_name, last_name),
        labs(id, title, lab_steps(*), pre_lab_questions(*)),
        pre_lab_responses(*),
        step_responses(*),
        student_grades(*)
      `)
      .eq('id', labRunId)
      .single(),
    db.from('rubric_scores')
      .select('*, rubric_items(*)')
      .eq('lab_run_id', labRunId),
  ])

  if (!run) return null

  const { data: rubricItems } = await db
    .from('rubric_items')
    .select('*')
    .eq('lab_id', run.lab_id)
    .order('position', { ascending: true })

  return {
    run,
    rubricItems: rubricItems ?? [],
    rubricScores: rubricScores ?? [],
    existingGrade: run.student_grades?.[0] ?? null,
  }
}

export async function getClassLabAssignments(classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('lab_assignments')
    .select('*, labs(id, title, status, estimated_minutes)')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
  return data ?? []
}
