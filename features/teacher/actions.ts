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
  const db = supabase as any
  const { data: cls, error } = await db
    .from('classes')
    .insert({ ...data, archived: false, created_by: data.teacher_id })
    .select()
    .single()
  if (error) throw error
  // Add creator to class_teachers as lead
  await db.from('class_teachers').upsert(
    {
      class_id: cls.id,
      teacher_id: data.teacher_id,
      class_role: 'lead_teacher',
      can_edit_class_settings: true,
      added_by: data.teacher_id,
    },
    { onConflict: 'class_id,teacher_id', ignoreDuplicates: true }
  )
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
  const { data: existing } = await db
    .from('class_enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('student_id', studentId)
    .maybeSingle()
  if (existing) return { already: true }
  const { error } = await db
    .from('class_enrollments')
    .insert({ class_id: classId, student_id: studentId, status: 'active' })
  if (error) throw error
  revalidatePath(`/teacher/classes/${classId}`)
  return { ok: true }
}

export async function removeEnrollmentById(enrollmentId: string, classId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('class_enrollments')
    .delete()
    .eq('id', enrollmentId)
  if (error) throw error
  revalidatePath(`/teacher/classes/${classId}`)
}

/** @deprecated Use removeEnrollmentById instead */
export async function unenrollStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('class_enrollments')
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
  const { data } = await db
    .from('profiles')
    .select('id, first_name, last_name, role, email')
    .eq('email', email)
    .maybeSingle()
  return data
}

export async function searchStudentsByNameOrEmail(
  query: string,
  orgId: string,
  classId: string
) {
  if (!query || query.trim().length < 2) return []
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Get already-enrolled student IDs (active) for this class
  const { data: enrolled } = await db
    .from('class_enrollments')
    .select('student_id, invited_email')
    .eq('class_id', classId)

  const enrolledStudentIds = new Set<string>(
    (enrolled ?? []).filter((e: { student_id: string | null }) => e.student_id).map((e: { student_id: string }) => e.student_id)
  )
  const enrolledEmails = new Set<string>(
    (enrolled ?? []).filter((e: { invited_email: string | null }) => e.invited_email).map((e: { invited_email: string }) => e.invited_email.toLowerCase())
  )

  const term = query.trim()

  const { data } = await db
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .eq('organization_id', orgId)
    .eq('role', 'student')
    .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(10)

  return (data ?? [])
    .filter((p: { id: string; email: string | null }) =>
      !enrolledStudentIds.has(p.id) &&
      !(p.email && enrolledEmails.has(p.email.toLowerCase()))
    )
    .map((p: { id: string; first_name: string; last_name: string; email: string | null }) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email ?? '',
    }))
}

export async function enrollOrInviteByEmail(
  classId: string,
  email: string,
  orgId: string
) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const normalised = email.trim().toLowerCase()

  // Check for existing enrollment (active or pending)
  const { data: existing } = await db
    .from('class_enrollments')
    .select('id, status')
    .eq('class_id', classId)
    .or(`invited_email.eq.${normalised},student_id.eq.(select id from profiles where email = '${normalised}' limit 1)`)
    .maybeSingle()

  if (existing) return { already: true, status: existing.status as string }

  // Look up profile by email
  const { data: profile } = await db
    .from('profiles')
    .select('id, first_name, last_name, role, organization_id')
    .eq('email', normalised)
    .maybeSingle()

  if (profile) {
    if (profile.role !== 'student') return { wrongRole: profile.role as string }
    if (profile.organization_id !== orgId) return { wrongOrg: true }
    // Active enrollment
    const { data: alreadyEnrolled } = await db
      .from('class_enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', profile.id)
      .maybeSingle()
    if (alreadyEnrolled) return { already: true, status: 'active' }
    const { error } = await db.from('class_enrollments').insert({
      class_id: classId,
      student_id: profile.id,
      status: 'active',
    })
    if (error) throw error
    revalidatePath(`/teacher/classes/${classId}`)
    return {
      ok: true,
      pending: false,
      name: `${profile.first_name} ${profile.last_name}`,
    }
  }

  // No account yet — create pending enrollment
  const { data: pendingExisting } = await db
    .from('class_enrollments')
    .select('id')
    .eq('class_id', classId)
    .eq('invited_email', normalised)
    .eq('status', 'pending')
    .maybeSingle()
  if (pendingExisting) return { already: true, status: 'pending' }

  const { error } = await db.from('class_enrollments').insert({
    class_id: classId,
    student_id: null,
    invited_email: normalised,
    status: 'pending',
  })
  if (error) throw error
  revalidatePath(`/teacher/classes/${classId}`)
  return { ok: true, pending: true, name: normalised }
}

export async function bulkEnrollFromCSV(
  classId: string,
  emails: string[],
  orgId: string
) {
  const results = await Promise.all(
    emails.map(async (email) => {
      try {
        const result = await enrollOrInviteByEmail(classId, email, orgId)
        return { email, ...result }
      } catch {
        return { email, error: true }
      }
    })
  )
  revalidatePath(`/teacher/classes/${classId}`)
  return results
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

export async function saveStudentGrade(
  labRunId: string,
  teacherId: string,
  rubricScores: Array<{ rubricItemId: string; teacherScore: number; teacherComment?: string }>,
  overall: { letterGrade?: string; overallComment?: string; totalScore: number; maxScore: number }
) {
  const supabase = await createClient()
  const db = supabase as any

  if (rubricScores.length > 0) {
    await Promise.all(
      rubricScores.map((s) =>
        db.from('rubric_scores').upsert(
          {
            lab_run_id: labRunId,
            rubric_item_id: s.rubricItemId,
            teacher_score: s.teacherScore,
            teacher_comment: s.teacherComment ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'lab_run_id,rubric_item_id' }
        )
      )
    )
  }

  const { error } = await db.from('student_grades').upsert(
    {
      lab_run_id: labRunId,
      teacher_id: teacherId,
      total_score: overall.totalScore,
      max_score: overall.maxScore,
      letter_grade: overall.letterGrade ?? null,
      overall_comment: overall.overallComment ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'lab_run_id' }
  )
  if (error) throw error

  revalidatePath(`/teacher/labs`)
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
