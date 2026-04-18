'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLabRun } from '@/hooks/useLabRun'
import { markStepComplete, updateCurrentStep } from '@/features/lab-runner/actions'
import { DataEntryField } from './DataEntryField'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
} from 'lucide-react'
import type { LabStep, DataEntryField as DataEntryFieldType, DataFlag } from '@/types/app'

interface Props {
  labRunId: string
  studentId: string
  step: LabStep
  stepNumber: number
  totalSteps: number
  initialDataValues: Record<string, unknown>
  initialReflection: string
  initialFlags: DataFlag[]
}

export function StepRunner({
  labRunId,
  studentId,
  step,
  stepNumber,
  totalSteps,
  initialDataValues,
  initialReflection,
  initialFlags,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [completeError, setCompleteError] = useState<string | null>(null)

  const fields: DataEntryFieldType[] = step.data_entry_fields ?? []

  const { dataValues, reflection, flags, saveStatus, updateField, updateReflection } =
    useLabRun({
      labRunId,
      stepId: step.id,
      studentId,
      initialDataValues,
      initialReflection,
      fields,
    })

  // Merge initial flags with live flags (live take priority)
  const activeFlags = flags.length > 0 ? flags : initialFlags

  const progress = Math.round((stepNumber / totalSteps) * 100)
  const isLastStep = stepNumber === totalSteps

  function handleComplete() {
    // Validate required fields
    const missing = fields.filter(
      (f) => f.required && (!dataValues[f.label] || String(dataValues[f.label]).trim() === '')
    )
    if (missing.length > 0) {
      setCompleteError(`Please fill in required fields: ${missing.map((f) => f.label).join(', ')}`)
      return
    }
    setCompleteError(null)

    startTransition(async () => {
      await markStepComplete(labRunId, step.id, studentId)
      await updateCurrentStep(labRunId, stepNumber)
      if (isLastStep) {
        router.push(`/student/labs/${labRunId}/complete`)
      } else {
        router.push(`/student/labs/${labRunId}/step/${stepNumber + 1}`)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* Header progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {stepNumber} of {totalSteps}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step title */}
      <div>
        <h1 className="text-xl font-bold">{step.title}</h1>
      </div>

      {/* Instructions */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Instructions
        </h2>
        <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
          {step.instructions}
        </div>
      </section>

      {/* Data entry */}
      {fields.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Data Entry
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <DataEntryField
                key={field.label}
                field={field}
                value={dataValues[field.label]}
                onChange={(val) => updateField(field.label, val)}
                flags={activeFlags}
              />
            ))}
          </div>
          {saveStatus === 'saving' && (
            <p className="text-xs text-muted-foreground">Saving...</p>
          )}
          {saveStatus === 'saved' && (
            <p className="text-xs text-green-600 dark:text-green-400">Saved</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-xs text-destructive">Failed to save. Please try again.</p>
          )}
        </section>
      )}

      {/* Checkpoint */}
      {step.checkpoint && (
        <section className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4 flex gap-3">
          <Info className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-0.5">
              Checkpoint
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">{step.checkpoint}</p>
          </div>
        </section>
      )}

      {/* Reflection */}
      {step.reflection_prompt && (
        <section className="space-y-2">
          <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Reflection
          </Label>
          <p className="text-sm text-muted-foreground">{step.reflection_prompt}</p>
          <Textarea
            rows={4}
            value={reflection}
            onChange={(e) => updateReflection(e.target.value)}
            placeholder="Write your reflection here..."
          />
        </section>
      )}

      {/* Error */}
      {completeError && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-800 dark:text-red-300">
          <TriangleAlert className="size-4 mt-0.5 shrink-0" />
          {completeError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {stepNumber > 1 && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/student/labs/${labRunId}/step/${stepNumber - 1}`)
              }
            >
              <ChevronLeft className="size-4" />
              Previous Step
            </Button>
          )}
        </div>

        <Button onClick={handleComplete} disabled={isPending}>
          {isPending ? (
            'Saving...'
          ) : isLastStep ? (
            <>
              <CheckCircle2 className="size-4" />
              Mark Complete &amp; Finish
            </>
          ) : (
            <>
              Mark Step Complete
              <ChevronRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
