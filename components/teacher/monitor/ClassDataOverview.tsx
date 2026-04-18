'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LabStepSummary } from './StudentDetailSheet'
import type { StudentRunSnapshot } from '@/features/monitoring/realtime'

interface StepResponse {
  lab_run_id: string
  step_id: string
  data_values: Record<string, string> | null
  flags: Array<{ field: string; message: string }> | null
}

interface ClassDataOverviewProps {
  assignmentId: string
  labSteps: LabStepSummary[]
  runs: StudentRunSnapshot[]
}

export function ClassDataOverview({ assignmentId, labSteps, runs }: ClassDataOverviewProps) {
  const [responses, setResponses] = useState<StepResponse[]>([])
  const [loadedRunIdsKey, setLoadedRunIdsKey] = useState<string | null>(null)

  const runIds = runs.map((run) => run.id)
  const runIdsKey = [...runIds].sort().join(',')
  const loading = runs.length > 0 && loadedRunIdsKey !== runIdsKey

  useEffect(() => {
    if (runs.length === 0) return
    const runIds = runs.map((run) => run.id)
    const supabase = createClient()
    supabase
      .from('step_responses')
      .select('lab_run_id, step_id, data_values, flags')
      .in('lab_run_id', runIds)
      .then(({ data }) => {
        setResponses((data as StepResponse[]) ?? [])
        setLoadedRunIdsKey(runIdsKey)
      })
  }, [assignmentId, runIdsKey, runs])

  const responseMap = new Map<string, Map<string, StepResponse>>()
  for (const r of responses) {
    if (!responseMap.has(r.lab_run_id)) responseMap.set(r.lab_run_id, new Map())
    responseMap.get(r.lab_run_id)!.set(r.step_id, r)
  }

  const stepsWithFields = [...labSteps]
    .sort((a, b) => a.step_number - b.step_number)
    .filter(s => (s.data_entry_fields ?? []).length > 0)

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground">No students have started this lab yet.</p>
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading data…</p>

  if (stepsWithFields.length === 0) {
    return <p className="text-sm text-muted-foreground">No data entry fields are defined in this lab.</p>
  }

  return (
    <div className="space-y-8">
      {stepsWithFields.map(step => {
        const fields = step.data_entry_fields ?? []
        return (
          <section key={step.id} className="space-y-3">
            <h3 className="text-sm font-semibold">
              Step {step.step_number}: {step.title}
            </h3>
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Student
                    </th>
                    {fields.map((f, i) => (
                      <th key={i} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {f.label}{f.unit ? ` (${f.unit})` : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run, idx) => {
                    const stepResp = responseMap.get(run.id)?.get(step.id)
                    return (
                      <tr
                        key={run.id}
                        className={`border-b border-border last:border-0 ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                      >
                        <td className="px-3 py-2 font-medium whitespace-nowrap">
                          {run.first_name} {run.last_name}
                        </td>
                        {fields.map((f, i) => {
                          const value = stepResp?.data_values?.[f.label]
                          const flagged = stepResp?.flags?.some(fl => fl.field === f.label)
                          return (
                            <td key={i} className="px-3 py-2 whitespace-nowrap">
                              {value !== undefined && value !== '' ? (
                                <span className={flagged ? 'text-amber-600 font-medium dark:text-amber-400' : ''}>
                                  {value}{flagged && ' ⚠'}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
