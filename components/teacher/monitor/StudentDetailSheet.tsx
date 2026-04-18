'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface DataEntryField {
  label: string
  unit?: string
}

export interface LabStepSummary {
  id: string
  step_number: number
  title: string
  data_entry_fields: DataEntryField[] | null
}

interface StepResponse {
  step_id: string
  data_values: Record<string, string> | null
  reflection_text: string | null
  flags: Array<{ field: string; message: string }> | null
  completed: boolean
}

interface StudentDetailSheetProps {
  runId: string | null
  studentName: string
  labSteps: LabStepSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentDetailSheet({
  runId,
  studentName,
  labSteps,
  open,
  onOpenChange,
}: StudentDetailSheetProps) {
  const [responses, setResponses] = useState<StepResponse[]>([])
  const [loadedRunId, setLoadedRunId] = useState<string | null>(null)
  const loading = open && !!runId && loadedRunId !== runId

  useEffect(() => {
    if (!runId || !open) return
    const supabase = createClient()
    supabase
      .from('step_responses')
      .select('step_id, data_values, reflection_text, flags, completed')
      .eq('lab_run_id', runId)
      .then(({ data }) => {
        setResponses((data as StepResponse[]) ?? [])
        setLoadedRunId(runId)
      })
  }, [runId, open])

  const responseByStep = new Map(responses.map(r => [r.step_id, r]))
  const sortedSteps = [...labSteps].sort((a, b) => a.step_number - b.step_number)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{studentName} — Lab Data</SheetTitle>
        </SheetHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground mt-6">Loading…</p>
        ) : (
          <div className="mt-6 space-y-6">
            {sortedSteps.map(step => {
              const resp = responseByStep.get(step.id)
              const fields = step.data_entry_fields ?? []

              return (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Step {step.step_number}
                    </span>
                    {resp?.completed && (
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Completed</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>

                  {fields.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Field</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((field, i) => {
                            const value = resp?.data_values?.[field.label]
                            const flagged = resp?.flags?.some(f => f.field === field.label)
                            return (
                              <tr key={i} className="border-b border-border last:border-0">
                                <td className="px-3 py-2 text-muted-foreground">
                                  {field.label}
                                  {field.unit && <span className="ml-1 text-xs">({field.unit})</span>}
                                </td>
                                <td className="px-3 py-2">
                                  {value !== undefined && value !== '' ? (
                                    <span className={flagged ? 'text-amber-600 font-medium dark:text-amber-400' : ''}>
                                      {value}
                                      {flagged && <span className="ml-1">⚠</span>}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground italic">—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No data fields for this step.</p>
                  )}

                  {resp?.reflection_text && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Reflection: </span>
                      <span className="italic">{resp.reflection_text}</span>
                    </p>
                  )}

                  {!resp && (
                    <p className="text-xs text-muted-foreground italic">Student has not reached this step yet.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
