import { createClient } from '@/lib/supabase/server'

export async function listClassesByOrg(orgId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data } = await db
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
  return data ?? []
}

export async function getClassDetailForAdmin(classId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data } = await db
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
  return data
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
