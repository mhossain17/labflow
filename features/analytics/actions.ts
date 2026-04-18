'use server'

import { getLabAnalyticsSummary, getStuckStepData } from './queries'
import { toStatusDistributionData, toStuckStepChartData, toCompletionProgressData } from './transforms'
import { createClient } from '@/lib/supabase/server'

export async function getLabAnalyticsAction(labId: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Fetch raw runs for transforms
  const { data: runs } = await db
    .from('student_lab_runs')
    .select('current_step, status, completed_at')
    .eq('lab_id', labId)

  // Get total steps for this lab
  const { data: steps } = await db
    .from('lab_steps')
    .select('id')
    .eq('lab_id', labId)

  const totalSteps = (steps ?? []).length

  const [summary, stuckStepRaw] = await Promise.all([
    getLabAnalyticsSummary(labId),
    getStuckStepData(labId),
  ])

  const statusData = toStatusDistributionData(runs ?? [])
  const stuckData = toStuckStepChartData(stuckStepRaw)
  const completionData = toCompletionProgressData(runs ?? [], totalSteps)

  return {
    completionData,
    statusData,
    stuckData,
    summary: {
      total_runs: summary.total_runs,
      completed_runs: summary.completed_runs,
      in_progress_runs: summary.in_progress_runs,
    },
  }
}
