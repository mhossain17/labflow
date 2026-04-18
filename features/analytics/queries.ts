import { createClient } from '@/lib/supabase/server'

async function db() {
  return createClient()
}

export async function getLabAnalyticsSummary(labId: string) {
  const client = await db()
  const { data: runs } = await client
    .from('student_lab_runs')
    .select('id, current_step, status, completed_at, updated_at')
    .eq('lab_id', labId)

  if (!runs) {
    return {
      total_runs: 0,
      completed_runs: 0,
      in_progress_runs: 0,
      status_distribution: {},
      average_step: 0,
    }
  }

  const total_runs = runs.length
  const completed_runs = runs.filter((r: { completed_at: string | null }) => r.completed_at !== null).length
  const in_progress_runs = total_runs - completed_runs

  const status_distribution: Record<string, number> = {}
  let step_sum = 0
  for (const r of runs) {
    status_distribution[r.status] = (status_distribution[r.status] ?? 0) + 1
    step_sum += r.current_step
  }

  const average_step = total_runs > 0 ? step_sum / total_runs : 0

  return {
    total_runs,
    completed_runs,
    in_progress_runs,
    status_distribution,
    average_step,
  }
}

export async function getStuckStepData(labId: string) {
  const client = await db()

  // Get lab steps
  const { data: steps } = await client
    .from('lab_steps')
    .select('id, step_number, title')
    .eq('lab_id', labId)
    .order('step_number', { ascending: true })

  // Get stuck/need_help runs grouped by current_step
  const { data: stuckRuns } = await client
    .from('student_lab_runs')
    .select('current_step, status')
    .eq('lab_id', labId)
    .in('status', ['stuck', 'need_help'])

  // Get help request counts per step via lab_runs
  const { data: runs } = await client
    .from('student_lab_runs')
    .select('id')
    .eq('lab_id', labId)

  const runIds = (runs ?? []).map((r: { id: string }) => r.id)
  const helpByStep: Record<string, number> = {}

  if (runIds.length > 0 && steps && steps.length > 0) {
    const { data: helpRequests } = await client
      .from('help_requests')
      .select('step_id')
      .in('lab_run_id', runIds)

    const stepIdToNumber: Record<string, number> = {}
    for (const s of steps ?? []) {
      stepIdToNumber[s.id] = s.step_number
    }

    for (const hr of helpRequests ?? []) {
      if (hr.step_id && stepIdToNumber[hr.step_id] !== undefined) {
        const stepNum = String(stepIdToNumber[hr.step_id])
        helpByStep[stepNum] = (helpByStep[stepNum] ?? 0) + 1
      }
    }
  }

  const stuckByStep: Record<number, number> = {}
  for (const r of stuckRuns ?? []) {
    stuckByStep[r.current_step] = (stuckByStep[r.current_step] ?? 0) + 1
  }

  return (steps ?? []).map((s: { step_number: number; title: string }) => ({
    step_number: s.step_number,
    step_title: s.title,
    stuck_count: stuckByStep[s.step_number] ?? 0,
    help_count: helpByStep[String(s.step_number)] ?? 0,
  }))
}

export async function getFlaggedResponsesSummary(labId: string) {
  const client = await db()

  const { data: runs } = await client
    .from('student_lab_runs')
    .select('id')
    .eq('lab_id', labId)

  if (!runs || runs.length === 0) return []

  const runIds = runs.map((r: { id: string }) => r.id)

  const { data: responses } = await client
    .from('step_responses')
    .select('step_id, flags')
    .in('lab_run_id', runIds)

  if (!responses) return []

  const flagsByStep: Record<string, number> = {}
  for (const resp of responses) {
    const flags = Array.isArray(resp.flags) ? resp.flags : []
    if (flags.length > 0 && resp.step_id) {
      flagsByStep[resp.step_id] = (flagsByStep[resp.step_id] ?? 0) + flags.length
    }
  }

  if (Object.keys(flagsByStep).length === 0) return []

  const stepIds = Object.keys(flagsByStep)
  const { data: steps } = await client
    .from('lab_steps')
    .select('id, step_number, title')
    .in('id', stepIds)
    .order('step_number', { ascending: true })

  return (steps ?? []).map((s: { id: string; step_number: number; title: string }) => ({
    step_number: s.step_number,
    step_title: s.title,
    flag_count: flagsByStep[s.id] ?? 0,
  }))
}

export async function getTeacherAnalyticsOverview(teacherId: string) {
  const client = await db()

  const { data: labs } = await client
    .from('labs')
    .select('id, status')
    .eq('teacher_id', teacherId)

  const labCounts: Record<string, number> = {}
  const labIds: string[] = []
  for (const lab of labs ?? []) {
    labCounts[lab.status] = (labCounts[lab.status] ?? 0) + 1
    labIds.push(lab.id)
  }

  if (labIds.length === 0) {
    return {
      lab_counts: labCounts,
      active_runs_today: 0,
      students_needing_attention: 0,
    }
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: activeRuns } = await client
    .from('student_lab_runs')
    .select('id, status')
    .in('lab_id', labIds)
    .gte('updated_at', todayStart.toISOString())

  const active_runs_today = (activeRuns ?? []).length
  const students_needing_attention = (activeRuns ?? []).filter(
    (r: { status: string }) => r.status === 'stuck' || r.status === 'need_help'
  ).length

  return {
    lab_counts: labCounts,
    active_runs_today,
    students_needing_attention,
  }
}
