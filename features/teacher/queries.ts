import { createClient } from '@/lib/supabase/server'

function isMissingClassTeachersRelation(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const message = (error as { message?: string }).message?.toLowerCase() ?? ''
  const details = (error as { details?: string }).details?.toLowerCase() ?? ''
  const hint = (error as { hint?: string }).hint?.toLowerCase() ?? ''
  return [message, details, hint].some((value) => value.includes('class_teachers'))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTeacherClassIds(db: any, teacherId: string) {
  const [{ data: memberships }, { data: ownedClasses }] = await Promise.all([
    db.from('class_teachers').select('class_id').eq('teacher_id', teacherId),
    db.from('classes').select('id').eq('teacher_id', teacherId),
  ])

  const classIds = new Set<string>()

  for (const membership of memberships ?? []) {
    if (membership.class_id) classIds.add(membership.class_id)
  }

  for (const ownedClass of ownedClasses ?? []) {
    if (ownedClass.id) classIds.add(ownedClass.id)
  }

  return [...classIds]
}

export async function listClassesByTeacher(teacherId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // Supports both class_teachers memberships and legacy classes.teacher_id ownership.
  const classIds = await getTeacherClassIds(db, teacherId)
  if (classIds.length === 0) return []
  const { data } = await db
    .from('classes')
    .select('*, class_enrollments(count), lab_assignments(count)')
    .in('id', classIds)
    .eq('archived', false)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getTeacherPermissionsForClass(teacherId: string, classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: membership } = await db
    .from('class_teachers')
    .select('id, class_role, can_manage_roster, can_manage_assignments, can_manage_grades, can_edit_class_settings')
    .eq('teacher_id', teacherId)
    .eq('class_id', classId)
    .maybeSingle()

  if (membership) return membership

  const { data: cls } = await db
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .maybeSingle()

  if (cls?.teacher_id === teacherId) {
    return {
      id: null,
      class_role: 'lead_teacher',
      can_manage_roster: true,
      can_manage_assignments: true,
      can_manage_grades: true,
      can_edit_class_settings: true,
    }
  }

  return null
}

export async function getClassWithEnrollments(classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('classes')
    .select(`
      *,
      class_enrollments(id, student_id, invited_email, status, enrolled_at, profiles(id, first_name, last_name, avatar_url)),
      class_teachers(
        id, teacher_id, class_role,
        can_manage_roster, can_manage_assignments, can_manage_grades, can_edit_class_settings,
        profiles:teacher_id(id, first_name, last_name, avatar_url)
      )
    `)
    .eq('id', classId)
    .single()

  if (data) return data
  if (!isMissingClassTeachersRelation(error)) return data

  const { data: fallbackClass } = await db
    .from('classes')
    .select(`
      *,
      class_enrollments(id, student_id, invited_email, status, enrolled_at, profiles(id, first_name, last_name, avatar_url))
    `)
    .eq('id', classId)
    .single()

  if (!fallbackClass) return null

  const { data: teacherProfile } = await db
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('id', fallbackClass.teacher_id)
    .maybeSingle()

  return {
    ...fallbackClass,
    class_teachers: teacherProfile
      ? [{
        id: null,
        teacher_id: fallbackClass.teacher_id,
        class_role: 'lead_teacher',
        can_manage_roster: true,
        can_manage_assignments: true,
        can_manage_grades: true,
        can_edit_class_settings: true,
        profiles: teacherProfile,
      }]
      : [],
  }
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
  const classIds = await getTeacherClassIds(db, teacherId)
  if (classIds.length === 0) return []
  const { data: allClasses } = await db
    .from('classes')
    .select('*')
    .in('id', classIds)
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

export async function getAllGradesForTeacher(teacherId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const classIds = await getTeacherClassIds(db, teacherId)
  if (classIds.length === 0) return []

  // Get all assignments for those classes
  const { data: assignments } = await db
    .from('lab_assignments')
    .select('id, class_id, lab_id, classes(id, name, period), labs(id, title)')
    .in('class_id', classIds)
  if (!assignments || assignments.length === 0) return []

  const assignmentIds = assignments.map((a: { id: string }) => a.id)

  // Get all completed runs for those assignments
  const { data: runs } = await db
    .from('student_lab_runs')
    .select('id, assignment_id, student_id, completed_at, profiles:student_id(id, first_name, last_name)')
    .in('assignment_id', assignmentIds)
    .not('completed_at', 'is', null)
  if (!runs || runs.length === 0) return []

  const runIds = runs.map((r: { id: string }) => r.id)

  // Get grades for those runs
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

  const assignmentMap = new Map<string, { class_id: string; classes: { name: string; period: string | null }; labs: { id: string; title: string } }>()
  for (const a of assignments) {
    assignmentMap.set(a.id, a)
  }

  return runs.map((run: any) => {
    const assignment = assignmentMap.get(run.assignment_id)
    const grade = gradeMap.get(run.id) ?? null
    return {
      lab_run_id: run.id,
      student_id: run.student_id,
      student_name: run.profiles ? `${run.profiles.first_name} ${run.profiles.last_name}` : '—',
      class_id: assignment?.class_id ?? '',
      class_name: assignment?.classes?.name ?? '—',
      class_period: assignment?.classes?.period ?? null,
      lab_id: assignment?.labs?.id ?? '',
      lab_title: assignment?.labs?.title ?? '—',
      completed_at: run.completed_at,
      grade: grade,
    }
  })
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
