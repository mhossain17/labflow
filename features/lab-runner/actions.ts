'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  StudentWorkStatus,
  DataFlag,
  HelpConversationTurn,
  StepDataValues,
} from '@/types/app'
import type { Json } from '@/types/database'

async function db() {
  return createClient()
}

function normalizeConversation(value: Json | null): HelpConversationTurn[] {
  if (!Array.isArray(value)) return []

  const turns: HelpConversationTurn[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const role = item.role
    const content = item.content
    const ts = item.ts

    if (role !== 'user' && role !== 'assistant') continue
    if (typeof content !== 'string' || typeof ts !== 'string') continue

    turns.push({ role, content, ts })
  }
  return turns
}

export async function createLabRun(
  assignmentId: string,
  studentId: string,
  labId: string
) {
  const client = await db()
  const { data, error } = await client
    .from('student_lab_runs')
    .insert({
      assignment_id: assignmentId,
      student_id: studentId,
      lab_id: labId,
      current_step: 0,
      prelab_completed: false,
      status: 'on_track',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  revalidatePath('/student/labs')
  return data
}

export async function updateRunStatus(
  labRunId: string,
  status: StudentWorkStatus
) {
  const client = await db()
  const { error } = await client
    .from('student_lab_runs')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', labRunId)
  if (error) throw error
  revalidatePath(`/student/labs/${labRunId}`)
}

export async function updateCurrentStep(
  labRunId: string,
  stepNumber: number
) {
  const client = await db()
  const { error } = await client
    .from('student_lab_runs')
    .update({ current_step: stepNumber, updated_at: new Date().toISOString() })
    .eq('id', labRunId)
  if (error) throw error
  revalidatePath(`/student/labs/${labRunId}`)
}

export async function updateQuickNote(
  labRunId: string,
  note: string
) {
  const client = await db()
  const { error } = await client
    .from('student_lab_runs')
    .update({ quick_note: note, updated_at: new Date().toISOString() })
    .eq('id', labRunId)
  if (error) throw error
}

export async function markPrelabComplete(labRunId: string) {
  const client = await db()
  const { error } = await client
    .from('student_lab_runs')
    .update({
      prelab_completed: true,
      current_step: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', labRunId)
  if (error) throw error
  revalidatePath(`/student/labs/${labRunId}`)
}

export async function savePreLabResponse(
  labRunId: string,
  questionId: string,
  studentId: string,
  responseText: string
) {
  const client = await db()
  const { error } = await client
    .from('pre_lab_responses')
    .upsert(
      {
        lab_run_id: labRunId,
        question_id: questionId,
        student_id: studentId,
        response_text: responseText,
      },
      { onConflict: 'lab_run_id,question_id' }
    )
  if (error) throw error
}

export async function saveStepResponse(
  labRunId: string,
  stepId: string,
  studentId: string,
  dataValues: StepDataValues,
  reflectionText: string,
  flags: DataFlag[]
) {
  const client = await db()
  const { error } = await client
    .from('step_responses')
    .upsert(
      {
        lab_run_id: labRunId,
        step_id: stepId,
        student_id: studentId,
        data_values: dataValues,
        reflection_text: reflectionText,
        flags,
      },
      { onConflict: 'lab_run_id,step_id' }
    )
  if (error) throw error
}

export async function markStepComplete(
  labRunId: string,
  stepId: string,
  studentId: string
) {
  const client = await db()
  const { error } = await client
    .from('step_responses')
    .upsert(
      {
        lab_run_id: labRunId,
        step_id: stepId,
        student_id: studentId,
        completed: true,
      },
      { onConflict: 'lab_run_id,step_id' }
    )
  if (error) throw error
  revalidatePath(`/student/labs/${labRunId}`)
}

export async function submitLab(labRunId: string) {
  const client = await db()
  const { error } = await client
    .from('student_lab_runs')
    .update({
      completed_at: new Date().toISOString(),
      status: 'on_track',
      updated_at: new Date().toISOString(),
    })
    .eq('id', labRunId)
  if (error) throw error
  revalidatePath(`/student/labs/${labRunId}`)
  revalidatePath('/student/labs')
}

export async function createHelpRequest(
  labRunId: string,
  studentId: string,
  stepId?: string
) {
  const client = await db()
  const { data, error } = await client
    .from('help_requests')
    .insert({
      lab_run_id: labRunId,
      student_id: studentId,
      step_id: stepId ?? null,
      conversation: [],
      resolved: false,
      escalated_to_teacher: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addHelpConversationTurn(
  helpRequestId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const client = await db()
  // First fetch the current conversation
  const { data: existing, error: fetchError } = await client
    .from('help_requests')
    .select('conversation')
    .eq('id', helpRequestId)
    .single()
  if (fetchError) throw fetchError

  const turn: HelpConversationTurn = {
    role,
    content,
    ts: new Date().toISOString(),
  }
  const updated = [...normalizeConversation(existing?.conversation ?? null), turn]

  const { error } = await client
    .from('help_requests')
    .update({ conversation: updated })
    .eq('id', helpRequestId)
  if (error) throw error
}

export async function resolveHelpRequest(helpRequestId: string) {
  const client = await db()
  const { error } = await client
    .from('help_requests')
    .update({ resolved: true })
    .eq('id', helpRequestId)
  if (error) throw error
}

export async function escalateHelpRequest(helpRequestId: string) {
  const client = await db()
  const { error } = await client
    .from('help_requests')
    .update({ escalated_to_teacher: true })
    .eq('id', helpRequestId)
  if (error) throw error
}

export async function startLabRun(assignmentId: string, labId: string, studentId: string) {
  const run = await createLabRun(assignmentId, studentId, labId)
  revalidatePath('/student')
  return run.id
}

export async function saveSelfAssessment(
  labRunId: string,
  scores: Array<{ rubricItemId: string; selfScore: number }>
) {
  const client = await db()
  await Promise.all(
    scores.map((s) =>
      client.from('rubric_scores' as any).upsert(
        {
          lab_run_id: labRunId,
          rubric_item_id: s.rubricItemId,
          self_score: s.selfScore,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'lab_run_id,rubric_item_id' }
      )
    )
  )
  revalidatePath(`/student/labs/${labRunId}/complete`)
}
