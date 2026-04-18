'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Lab CRUD ────────────────────────────────────────────────────────────────

export async function createLab(data: {
  title: string
  teacher_id: string
  organization_id: string
  overview?: string
  objectives?: string[]
  standards?: string[]
  materials_list?: string[]
  safety_notes?: string
  background?: string
  teacher_notes?: string
  estimated_minutes?: number
  ai_generated?: boolean
}) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lab, error } = await (supabase as any)
    .from('labs')
    .insert({ status: 'draft', ...data })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/teacher/labs')
  return lab
}

export async function updateLab(
  labId: string,
  data: {
    title?: string
    overview?: string
    objectives?: string[]
    standards?: string[]
    materials_list?: string[]
    safety_notes?: string
    background?: string
    teacher_notes?: string
    estimated_minutes?: number
  }
) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('labs')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', labId)
  if (error) throw error
  revalidatePath('/teacher/labs')
  revalidatePath(`/teacher/labs/${labId}`)
}

export async function deleteLab(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('labs')
    .delete()
    .eq('id', labId)
  if (error) throw error
  revalidatePath('/teacher/labs')
}

export async function publishLab(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('labs')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', labId)
  if (error) throw error
  revalidatePath('/teacher/labs')
  revalidatePath(`/teacher/labs/${labId}`)
}

export async function unpublishLab(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('labs')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', labId)
  if (error) throw error
  revalidatePath('/teacher/labs')
  revalidatePath(`/teacher/labs/${labId}`)
}

export async function archiveLab(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('labs')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', labId)
  if (error) throw error
  revalidatePath('/teacher/labs')
  revalidatePath(`/teacher/labs/${labId}`)
}

export async function createLabWithContent(data: {
  title: string
  teacher_id: string
  organization_id: string
  overview?: string
  objectives?: string[]
  standards?: string[]
  materials_list?: string[]
  safety_notes?: string
  background?: string
  ai_generated?: boolean
  steps: Array<{
    title: string
    instructions: string
    checkpoint?: string
    reflection_prompt?: string
    troubleshooting?: string
    data_entry_fields?: Array<{ label: string; type: 'text' | 'number'; unit?: string; required: boolean }>
  }>
  pre_lab_questions: Array<{
    question_text: string
    question_type: 'short_answer' | 'multiple_choice' | 'true_false'
    options?: string[]
  }>
}) {
  const supabase = await createClient()
  const db = supabase as any

  const { steps, pre_lab_questions, ...labData } = data

  const { data: lab, error: labError } = await db
    .from('labs')
    .insert({ status: 'draft', ...labData })
    .select()
    .single()
  if (labError) throw labError

  if (steps.length > 0) {
    const { error: stepsError } = await db.from('lab_steps').insert(
      steps.map((s, i) => ({
        lab_id: lab.id,
        title: s.title,
        instructions: s.instructions,
        checkpoint: s.checkpoint ?? null,
        reflection_prompt: s.reflection_prompt ?? null,
        troubleshooting: s.troubleshooting ?? null,
        data_entry_fields: s.data_entry_fields ?? null,
        step_number: i + 1,
      }))
    )
    if (stepsError) throw stepsError
  }

  if (pre_lab_questions.length > 0) {
    const { error: questionsError } = await db.from('pre_lab_questions').insert(
      pre_lab_questions.map((q, i) => ({
        lab_id: lab.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ?? null,
        required: true,
        position: i,
      }))
    )
    if (questionsError) throw questionsError
  }

  revalidatePath('/teacher/labs')
  revalidatePath(`/teacher/labs/${lab.id}/edit`)
  return lab as { id: string }
}

// ── Pre-Lab Questions ────────────────────────────────────────────────────────

export async function upsertPreLabQuestion(
  labId: string,
  question: {
    id?: string
    question_text: string
    question_type: 'short_answer' | 'multiple_choice' | 'true_false'
    options?: string[]
    required?: boolean
    position?: number
  }
) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  if (question.id) {
    const { data, error } = await db
      .from('pre_lab_questions')
      .update({
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options ?? null,
        required: question.required ?? true,
        position: question.position,
      })
      .eq('id', question.id)
      .select()
      .single()
    if (error) throw error
    revalidatePath(`/teacher/labs/${labId}/edit`)
    return data
  } else {
    // Get current max position
    const { data: existing } = await db
      .from('pre_lab_questions')
      .select('position')
      .eq('lab_id', labId)
      .order('position', { ascending: false })
      .limit(1)
    const nextPos = existing?.[0]?.position != null ? existing[0].position + 1 : 0
    const { data, error } = await db
      .from('pre_lab_questions')
      .insert({
        lab_id: labId,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options ?? null,
        required: question.required ?? true,
        position: question.position ?? nextPos,
      })
      .select()
      .single()
    if (error) throw error
    revalidatePath(`/teacher/labs/${labId}/edit`)
    return data
  }
}

export async function deletePreLabQuestion(questionId: string, labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('pre_lab_questions')
    .delete()
    .eq('id', questionId)
  if (error) throw error
  revalidatePath(`/teacher/labs/${labId}/edit`)
}

export async function reorderPreLabQuestions(labId: string, orderedIds: string[]) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await Promise.all(
    orderedIds.map((id, index) =>
      db.from('pre_lab_questions').update({ position: index }).eq('id', id)
    )
  )
  revalidatePath(`/teacher/labs/${labId}/edit`)
}

// ── Lab Steps ────────────────────────────────────────────────────────────────

export async function upsertLabStep(
  labId: string,
  step: {
    id?: string
    title: string
    instructions: string
    checkpoint?: string
    reflection_prompt?: string
    troubleshooting?: string
    data_entry_fields?: Array<{
      label: string
      type: 'text' | 'number'
      unit?: string
      min?: number
      max?: number
      required: boolean
    }>
    step_number?: number
  }
) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  if (step.id) {
    const { data, error } = await db
      .from('lab_steps')
      .update({
        title: step.title,
        instructions: step.instructions,
        checkpoint: step.checkpoint ?? null,
        reflection_prompt: step.reflection_prompt ?? null,
        troubleshooting: step.troubleshooting ?? null,
        data_entry_fields: step.data_entry_fields ?? null,
        step_number: step.step_number,
      })
      .eq('id', step.id)
      .select()
      .single()
    if (error) throw error
    revalidatePath(`/teacher/labs/${labId}/edit`)
    return data
  } else {
    const { data: existing } = await db
      .from('lab_steps')
      .select('step_number')
      .eq('lab_id', labId)
      .order('step_number', { ascending: false })
      .limit(1)
    const nextStep = existing?.[0]?.step_number != null ? existing[0].step_number + 1 : 1
    const { data, error } = await db
      .from('lab_steps')
      .insert({
        lab_id: labId,
        title: step.title,
        instructions: step.instructions,
        checkpoint: step.checkpoint ?? null,
        reflection_prompt: step.reflection_prompt ?? null,
        troubleshooting: step.troubleshooting ?? null,
        data_entry_fields: step.data_entry_fields ?? null,
        step_number: step.step_number ?? nextStep,
      })
      .select()
      .single()
    if (error) throw error
    revalidatePath(`/teacher/labs/${labId}/edit`)
    return data
  }
}

export async function deleteLabStep(stepId: string, labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('lab_steps')
    .delete()
    .eq('id', stepId)
  if (error) throw error
  revalidatePath(`/teacher/labs/${labId}/edit`)
}

export async function reorderLabSteps(labId: string, orderedIds: string[]) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await Promise.all(
    orderedIds.map((id, index) =>
      db.from('lab_steps').update({ step_number: index + 1 }).eq('id', id)
    )
  )
  revalidatePath(`/teacher/labs/${labId}/edit`)
}
