import { createClient } from '@/lib/supabase/server'

export async function listClassesByTeacher(teacherId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('classes')
    .select('*, enrollments(count), lab_assignments(count)')
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
    .select('*, enrollments(*, profiles(id, first_name, last_name, avatar_url))')
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
    .order('assigned_at', { ascending: false })
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

export async function getClassLabAssignments(classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('lab_assignments')
    .select('*, labs(id, title, status, estimated_minutes)')
    .eq('class_id', classId)
    .order('assigned_at', { ascending: false })
  return data ?? []
}
