'use client'
import { useState } from 'react'
import { Control, UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DataFieldEditor } from './DataFieldEditor'
import type { LabBuilderFormValues } from './LabBuilderForm'
import { Sparkles, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepEditorProps {
  stepIndex: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<LabBuilderFormValues, any>
  register: UseFormRegister<LabBuilderFormValues>
  watch: UseFormWatch<LabBuilderFormValues>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<LabBuilderFormValues>
}

interface GeneratedStep {
  title?: string
  instructions?: string
  checkpoint?: string
  reflection_prompt?: string
  troubleshooting?: string
  data_entry_fields?: Array<{ label: string; type: 'text' | 'number'; unit?: string; required: boolean }>
}

export function StepEditor({ stepIndex, control, register, watch, setValue }: StepEditorProps) {
  const [aiOpen, setAiOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const labTitle = watch('title')

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          labTitle,
          stepNumber: stepIndex + 1,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Generation failed.')
        return
      }
      const step: GeneratedStep = json.step
      // Fill all step fields with generated content
      if (step.title) setValue(`steps.${stepIndex}.title`, step.title)
      if (step.instructions) setValue(`steps.${stepIndex}.instructions`, step.instructions)
      if (step.checkpoint) setValue(`steps.${stepIndex}.checkpoint`, step.checkpoint)
      if (step.reflection_prompt) setValue(`steps.${stepIndex}.reflection_prompt`, step.reflection_prompt)
      if (step.troubleshooting) setValue(`steps.${stepIndex}.troubleshooting`, step.troubleshooting)
      if (step.data_entry_fields?.length) {
        setValue(`steps.${stepIndex}.data_entry_fields`, step.data_entry_fields.map(f => ({
          label: f.label,
          type: f.type,
          unit: f.unit ?? '',
          min: undefined,
          max: undefined,
          required: f.required,
        })))
      }
      setAiOpen(false)
      setPrompt('')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t border-border">

      {/* AI generation panel */}
      <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setAiOpen(o => !o)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <span className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            Generate with AI
          </span>
          <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', aiOpen && 'rotate-180')} />
        </button>

        {aiOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Describe what you want students to do in this step. Be as specific as you like — mention measurements, equipment, or expected observations.
            </p>
            <Textarea
              placeholder="e.g. Have students measure the mass of each rock sample using a digital scale, record values in grams, then calculate density using the water displacement method"
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="text-sm"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              type="button"
              size="sm"
              disabled={loading || !prompt.trim()}
              onClick={handleGenerate}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Generate Step
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Manual fields */}
      <div className="space-y-1.5">
        <Label>Step Title</Label>
        <Input
          placeholder="e.g. Prepare the solution"
          {...register(`steps.${stepIndex}.title`)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          Instructions <span className="text-destructive">*</span>
        </Label>
        <Textarea
          placeholder="Write clear, step-by-step instructions for the student..."
          rows={4}
          {...register(`steps.${stepIndex}.instructions`, { required: true })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1">
          Checkpoint
          <span className="text-xs font-normal text-muted-foreground">(teacher check-in note)</span>
        </Label>
        <Textarea
          placeholder="Note for teacher to check student work before proceeding..."
          rows={2}
          {...register(`steps.${stepIndex}.checkpoint`)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1">
          Reflection Prompt
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          placeholder="What did you observe? Why do you think that happened?"
          rows={2}
          {...register(`steps.${stepIndex}.reflection_prompt`)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1">
          Troubleshooting Tips
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          placeholder="Common issues students encounter and how to resolve them..."
          rows={2}
          {...register(`steps.${stepIndex}.troubleshooting`)}
        />
      </div>
      <DataFieldEditor
        stepIndex={stepIndex}
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
      />
    </div>
  )
}
