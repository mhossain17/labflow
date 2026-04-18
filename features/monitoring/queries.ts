import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  const supabase = await createClient()
  return supabase as any
}

export async function getLabAssignmentForMonitor(labId: string) {
  const client = await db()
  const { data } = await client
    .from('lab_assignments')
    .select('*, classes(id, name, period)')
    .eq('lab_id', labId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function getStudentRunsForMonitor(assignmentId: string) {
  const client = await db()
  const { data: runs } = await client
    .from('student_lab_runs')
    .select('*, profiles(first_name, last_name)')
    .eq('assignment_id', assignmentId)
    .order('updated_at', { ascending: false })

  if (!runs) return []

  // Get flag counts per run
  const runIds: string[] = runs.map((r: { id: string }) => r.id)
  let flagCounts: Record<string, number> = {}

  if (runIds.length > 0) {
    const { data: responses } = await client
      .from('step_responses')
      .select('lab_run_id, flags')
      .in('lab_run_id', runIds)

    if (responses) {
      for (const resp of responses) {
        const flags = resp.flags
        const count = Array.isArray(flags) ? flags.length : 0
        if (count > 0) {
          flagCounts[resp.lab_run_id] = (flagCounts[resp.lab_run_id] ?? 0) + count
        }
      }
    }
  }

  return runs.map((run: {
    id: string
    student_id: string
    current_step: number
    status: string
    quick_note: string | null
    updated_at: string
    profiles: { first_name: string; last_name: string } | null
  }) => ({
    id: run.id,
    student_id: run.student_id,
    first_name: run.profiles?.first_name ?? '',
    last_name: run.profiles?.last_name ?? '',
    current_step: run.current_step,
    status: run.status,
    quick_note: run.quick_note,
    flag_count: flagCounts[run.id] ?? 0,
    updated_at: run.updated_at,
  }))
}

export async function getEscalatedHelpRequests(assignmentId: string) {
  const client = await db()
  // Get all lab run ids for this assignment first
  const { data: runs } = await client
    .from('student_lab_runs')
    .select('id, student_id, profiles(first_name, last_name)')
    .eq('assignment_id', assignmentId)

  if (!runs || runs.length === 0) return []

  const runIds = runs.map((r: { id: string }) => r.id)
  const { data: helpRequests } = await client
    .from('help_requests')
    .select('*')
    .in('lab_run_id', runIds)
    .eq('escalated_to_teacher', true)
    .eq('resolved', false)

  if (!helpRequests) return []

  // Attach student info
  type RunInfo = { student_id: string; first_name: string; last_name: string }
  const runMap = new Map<string, RunInfo>(
    runs.map((r: { id: string; student_id: string; profiles: { first_name: string; last_name: string } | null }) => [
      r.id,
      { student_id: r.student_id, first_name: r.profiles?.first_name ?? '', last_name: r.profiles?.last_name ?? '' },
    ])
  )

  return helpRequests.map((hr: { id: string; lab_run_id: string; [key: string]: unknown }) => {
    const studentInfo = runMap.get(hr.lab_run_id)
    return {
      ...hr,
      student_id: studentInfo?.student_id ?? '',
      first_name: studentInfo?.first_name ?? '',
      last_name: studentInfo?.last_name ?? '',
    }
  })
}

export async function getStuckStepSummary(assignmentId: string) {
  const client = await db()
  const { data } = await client
    .from('student_lab_runs')
    .select('current_step, status')
    .eq('assignment_id', assignmentId)
    .in('status', ['stuck', 'need_help'])

  if (!data) return []

  const stepCounts: Record<number, number> = {}
  for (const run of data) {
    const step = run.current_step as number
    stepCounts[step] = (stepCounts[step] ?? 0) + 1
  }

  return Object.entries(stepCounts).map(([step, count]) => ({
    step_number: Number(step),
    student_count: count,
  }))
}
