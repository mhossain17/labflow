import { createClient } from '@/lib/supabase/server'

function isMissingClassTeachersRelation(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const message = (error as { message?: string }).message?.toLowerCase() ?? ''
  const details = (error as { details?: string }).details?.toLowerCase() ?? ''
  const hint = (error as { hint?: string }).hint?.toLowerCase() ?? ''
  return [message, details, hint].some((value) => value.includes('class_teachers'))
}

export async function listClassesByOrg(orgId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data, error } = await db
    .from('classes')
    .select(`
      id, name, description, period, school_year, archived, created_at,
      teacher_id,
      class_teachers(
        teacher_id,
        class_role,
        profiles:teacher_id(id, first_name, last_name)
      ),
      class_enrollments(count),
      lab_assignments(count)
    `)
    .eq('organization_id', orgId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (data) return data
  if (!isMissingClassTeachersRelation(error)) return data ?? []

  const { data: fallbackClasses } = await db
    .from('classes')
    .select(`
      id, name, description, period, school_year, archived, created_at,
      teacher_id,
      class_enrollments(count),
      lab_assignments(count)
    `)
    .eq('organization_id', orgId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  const teacherIds = [...new Set((fallbackClasses ?? []).map((cls: { teacher_id: string }) => cls.teacher_id))]
  const { data: teacherProfiles } = teacherIds.length > 0
    ? await db
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', teacherIds)
    : { data: [] }

  const teacherProfileMap = new Map((teacherProfiles ?? []).map((profile: { id: string }) => [profile.id, profile]))

  return (fallbackClasses ?? []).map((cls: { teacher_id: string }) => ({
    ...cls,
    class_teachers: cls.teacher_id
      ? [{
        teacher_id: cls.teacher_id,
        class_role: 'lead_teacher',
        profiles: teacherProfileMap.get(cls.teacher_id) ?? null,
      }]
      : [],
  }))
}

export async function getClassDetailForAdmin(classId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data, error } = await db
    .from('classes')
    .select(`
      id, name, description, period, school_year, archived, organization_id, teacher_id, created_at,
      class_teachers(
        id, teacher_id, class_role,
        can_manage_roster, can_manage_assignments, can_manage_grades, can_edit_class_settings,
        profiles:teacher_id(id, first_name, last_name, avatar_url)
      ),
      class_enrollments(
        id, student_id, enrolled_at,
        profiles:student_id(id, first_name, last_name, avatar_url)
      ),
      lab_assignments(
        id, due_date, created_at,
        labs(id, title, status)
      )
    `)
    .eq('id', classId)
    .single()

  if (data) return data
  if (!isMissingClassTeachersRelation(error)) return data

  const { data: fallbackClass } = await db
    .from('classes')
    .select(`
      id, name, description, period, school_year, archived, organization_id, teacher_id, created_at,
      class_enrollments(
        id, student_id, enrolled_at,
        profiles:student_id(id, first_name, last_name, avatar_url)
      ),
      lab_assignments(
        id, due_date, created_at,
        labs(id, title, status)
      )
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

export async function listTeachersByOrg(orgId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('organization_id', orgId)
    .eq('role', 'teacher')
    .order('last_name', { ascending: true })
  return (data ?? []) as Array<{
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }>
}

export async function listStudentsByOrg(orgId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('organization_id', orgId)
    .eq('role', 'student')
    .order('last_name', { ascending: true })
  return (data ?? []) as Array<{
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
  }>
}
