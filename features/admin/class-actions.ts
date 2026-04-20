'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth/session'
import { logAuditEvent } from '@/lib/audit'

export async function adminCreateClass(data: {
  name: string
  description?: string
  period?: string
  school_year?: string
  organization_id: string
  primaryTeacherId: string
}) {
  const supabase = await createClient()
  const db = supabase as any
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  const { primaryTeacherId, ...classData } = data
  const { data: cls, error } = await db
    .from('classes')
    .insert({
      ...classData,
      teacher_id: primaryTeacherId,
      created_by: actor.id,
      archived: false,
    })
    .select()
    .single()
  if (error) throw error

  // Add primary teacher to class_teachers as lead
  const { error: ctError } = await db
    .from('class_teachers')
    .insert({
      class_id: cls.id,
      teacher_id: primaryTeacherId,
      class_role: 'lead_teacher',
      can_edit_class_settings: true,
      added_by: actor.id,
    })
  if (ctError) throw ctError

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'class_created',
    targetTable: 'classes',
    targetId: cls.id,
    metadata: { name: data.name, primaryTeacherId },
  })

  revalidatePath('/admin/classes')
  revalidatePath('/teacher/classes')
  return cls
}

export async function adminUpdateClass(
  classId: string,
  data: { name?: string; description?: string; period?: string; school_year?: string }
) {
  const supabase = await createClient()
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('classes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', classId)
  if (error) throw error

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'class_settings_updated',
    targetTable: 'classes',
    targetId: classId,
  })

  revalidatePath('/admin/classes')
  revalidatePath(`/admin/classes/${classId}`)
}

export async function adminArchiveClass(classId: string) {
  const supabase = await createClient()
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('classes')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', classId)
  if (error) throw error

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'class_archived',
    targetTable: 'classes',
    targetId: classId,
  })

  revalidatePath('/admin/classes')
}

export async function adminAssignTeacher(
  classId: string,
  teacherId: string,
  classRole: 'lead_teacher' | 'co_teacher' = 'co_teacher',
  permissions?: {
    can_manage_roster?: boolean
    can_manage_assignments?: boolean
    can_manage_grades?: boolean
    can_edit_class_settings?: boolean
  }
) {
  const supabase = await createClient()
  const db = supabase as any
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  const { error } = await db.from('class_teachers').insert({
    class_id: classId,
    teacher_id: teacherId,
    class_role: classRole,
    can_manage_roster: permissions?.can_manage_roster ?? true,
    can_manage_assignments: permissions?.can_manage_assignments ?? true,
    can_manage_grades: permissions?.can_manage_grades ?? true,
    can_edit_class_settings:
      permissions?.can_edit_class_settings ?? classRole === 'lead_teacher',
    added_by: actor.id,
  })
  if (error) throw error

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'teacher_assigned_to_class',
    targetTable: 'class_teachers',
    targetId: classId,
    metadata: { teacherId, classRole },
  })

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath('/teacher/classes')
}

export async function adminRemoveTeacher(classId: string, teacherId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  const { error } = await db
    .from('class_teachers')
    .delete()
    .eq('class_id', classId)
    .eq('teacher_id', teacherId)
  if (error) throw error

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'teacher_removed_from_class',
    targetTable: 'class_teachers',
    targetId: classId,
    metadata: { teacherId },
  })

  revalidatePath(`/admin/classes/${classId}`)
  revalidatePath('/teacher/classes')
}

export async function adminUpdateTeacherPermissions(
  classTeacherId: string,
  classId: string,
  permissions: {
    can_manage_roster: boolean
    can_manage_assignments: boolean
    can_manage_grades: boolean
    can_edit_class_settings: boolean
  }
) {
  const supabase = await createClient()
  const db = supabase as any
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  const { error } = await db
    .from('class_teachers')
    .update(permissions)
    .eq('id', classTeacherId)
  if (error) throw error

  revalidatePath(`/admin/classes/${classId}`)
}

export async function adminEnrollStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  // Validate target is a student
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', studentId)
    .single()
  if (!profile || profile.role !== 'student') {
    throw new Error('Target user is not a student')
  }

  const { data: existing } = await db
    .from('class_enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (existing) return { already: true }

  const { error } = await db
    .from('class_enrollments')
    .insert({ class_id: classId, student_id: studentId })
  if (error) throw error

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'student_enrolled_by_admin',
    targetTable: 'class_enrollments',
    targetId: classId,
    metadata: { studentId },
  })

  revalidatePath(`/admin/classes/${classId}`)
  return { ok: true }
}

export async function adminUnenrollStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  const { error } = await db
    .from('class_enrollments')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)
  if (error) throw error

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'student_unenrolled_by_admin',
    targetTable: 'class_enrollments',
    targetId: classId,
    metadata: { studentId },
  })

  revalidatePath(`/admin/classes/${classId}`)
}
