import { createClient } from '@/lib/supabase/server'

async function db() {
  return createClient()
}

export async function getLabRun(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('*, labs(*), lab_assignments(*)')
    .eq('id', labRunId)
    .single()
  return data
}

export async function getLabRunWithSteps(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('*, labs(*, lab_steps(*), pre_lab_questions(*)), lab_assignments(*)')
    .eq('id', labRunId)
    .single()
  return data
}

export async function getPreLabResponses(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('pre_lab_responses')
    .select('*')
    .eq('lab_run_id', labRunId)
  return data ?? []
}

export async function getStepResponse(labRunId: string, stepId: string) {
  const client = await db()
  const { data } = await client
    .from('step_responses')
    .select('*')
    .eq('lab_run_id', labRunId)
    .eq('step_id', stepId)
    .maybeSingle()
  return data
}

export async function getStepResponses(labRunId: string) {
  const client = await db()
  const { data } = await client
    .from('step_responses')
    .select('*')
    .eq('lab_run_id', labRunId)
  return data ?? []
}

export async function getActiveHelpRequest(labRunId: string, stepId?: string) {
  const client = await db()
  let query = client
    .from('help_requests')
    .select('*')
    .eq('lab_run_id', labRunId)
    .eq('resolved', false)

  if (stepId) {
    query = query.eq('step_id', stepId)
  }

  const { data } = await query.maybeSingle()
  return data
}

export async function listStudentLabRuns(studentId: string) {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('*, labs(*), lab_assignments(*)')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false })
  return data ?? []
}

export async function checkLabRunOwnership(
  labRunId: string,
  studentId: string
): Promise<boolean> {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('id')
    .eq('id', labRunId)
    .eq('student_id', studentId)
    .maybeSingle()
  return !!data
}
