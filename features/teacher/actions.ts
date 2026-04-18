'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createClass(data: {
  name: string
  description?: string
  period?: string
  school_year?: string
  teacher_id: string
  organization_id: string
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls, error } = await (supabase as any)
    .from('classes')
    .insert({ ...data, archived: false })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/teacher/classes')
  return cls
}

export async function updateClass(
  classId: string,
  data: {
    name?: string
    description?: string
    period?: string
    school_year?: string
  }
) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('classes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', classId)
  if (error) throw error
  revalidatePath('/teacher/classes')
  revalidatePath(`/teacher/classes/${classId}`)
}

export async function archiveClass(classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('classes')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', classId)
  if (error) throw error
  revalidatePath('/teacher/classes')
}

export async function enrollStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // Check not already enrolled
  const { data: existing } = await db
    .from('enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (existing) return { already: true }
  const { error } = await db
    .from('enrollments')
    .insert({ class_id: classId, student_id: studentId })
  if (error) throw error
  revalidatePath(`/teacher/classes/${classId}`)
  return { ok: true }
}

export async function unenrollStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('enrollments')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)
  if (error) throw error
  revalidatePath(`/teacher/classes/${classId}`)
}

export async function lookupProfileByEmail(email: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // Look up auth user by email via profiles (email stored on auth.users, joined via id)
  const { data } = await db
    .from('profiles')
    .select('id, first_name, last_name, role')
    .eq('email', email)
    .maybeSingle()
  return data
}

export async function assignLabToClass(
  labId: string,
  classId: string,
  assignedBy: string,
  dueDate?: string
) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lab_assignments')
    .insert({
      lab_id: labId,
      class_id: classId,
      assigned_by: assignedBy,
      due_date: dueDate ?? null,
    })
  if (error) throw error
  revalidatePath(`/teacher/labs/${labId}`)
  revalidatePath(`/teacher/classes/${classId}`)
}

export async function unassignLab(labId: string, classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lab_assignments')
    .delete()
    .eq('lab_id', labId)
    .eq('class_id', classId)
  if (error) throw error
  revalidatePath(`/teacher/labs/${labId}`)
  revalidatePath(`/teacher/classes/${classId}`)
}
