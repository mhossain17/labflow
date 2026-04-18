'use client'
import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { LabStatusBadge } from './LabStatusBadge'
import { LabMetaSection } from './LabMetaSection'
import { PreLabSection } from './PreLabSection'
import { StepList } from './StepList'
import { updateLab, publishLab, unpublishLab, upsertLabStep, upsertPreLabQuestion } from '@/features/lab-builder/actions'
import { ArrowLeft, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { LabWithSteps, LabStatus, DataEntryField } from '@/types/app'
import { useRouter } from 'next/navigation'

// ── Form types ───────────────────────────────────────────────────────────────

export interface LabBuilderFormValues {
  title: string
  overview: string
  objectives: Array<{ value: string }>
  standards: Array<{ value: string }>
  estimated_minutes: number | null
  materials_list: Array<{ value: string }>
  safety_notes: string
  background: string
  teacher_notes: string
  pre_lab_questions: Array<{
    id?: string
    question_text: string
    question_type: 'short_answer' | 'multiple_choice' | 'true_false'
    options: string[]
    required: boolean
    position: number
  }>
  steps: Array<{
    id?: string
    title: string
    instructions: string
    checkpoint: string
    reflection_prompt: string
    troubleshooting: string
    data_entry_fields: Array<DataEntryField & { id?: string }>
    step_number: number
  }>
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function toFormValues(lab: LabWithSteps): LabBuilderFormValues {
  return {
    title: lab.title,
    overview: lab.overview ?? '',
    objectives: (lab.objectives ?? []).map((v) => ({ value: v })),
    standards: (lab.standards ?? []).map((v) => ({ value: v })),
    estimated_minutes: lab.estimated_minutes ?? null,
    materials_list: (lab.materials_list ?? []).map((v) => ({ value: v })),
    safety_notes: lab.safety_notes ?? '',
    background: lab.background ?? '',
    teacher_notes: lab.teacher_notes ?? '',
    pre_lab_questions: (lab.pre_lab_questions ?? [])
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options ?? [],
        required: q.required,
        position: q.position,
      })),
    steps: (lab.lab_steps ?? [])
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => ({
        id: s.id,
        title: s.title,
        instructions: s.instructions,
        checkpoint: s.checkpoint ?? '',
        reflection_prompt: s.reflection_prompt ?? '',
        troubleshooting: s.troubleshooting ?? '',
        data_entry_fields: (s.data_entry_fields ?? []) as Array<DataEntryField>,
        step_number: s.step_number,
      })),
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface LabBuilderFormProps {
  lab: LabWithSteps
}

export function LabBuilderForm({ lab }: LabBuilderFormProps) {
  const router = useRouter()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [status, setStatus] = useState<LabStatus>(lab.status)
  const [publishPending, startPublishTransition] = useTransition()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  const form = useForm<LabBuilderFormValues>({
    defaultValues: toFormValues(lab),
  })
  const { register, control, watch, getValues } = form

  // ── Auto-save ────────────────────────────────────────────────────────────

  const performSave = useCallback(async (values: LabBuilderFormValues) => {
    setSaveStatus('saving')
    try {
      await updateLab(lab.id, {
        title: values.title,
        overview: values.overview || undefined,
        objectives: values.objectives.map((o) => o.value).filter(Boolean),
        standards: values.standards.map((s) => s.value).filter(Boolean),
        estimated_minutes: values.estimated_minutes ?? undefined,
        materials_list: values.materials_list.map((m) => m.value).filter(Boolean),
        safety_notes: values.safety_notes || undefined,
        background: values.background || undefined,
        teacher_notes: values.teacher_notes || undefined,
      })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }, [lab.id])

  const scheduleAutoSave = useCallback((values: LabBuilderFormValues) => {
    const serialized = JSON.stringify(values)
    if (serialized === lastSavedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      lastSavedRef.current = serialized
      performSave(values)
    }, 2000)
  }, [performSave])

  useEffect(() => {
    const subscription = watch((values) => {
      scheduleAutoSave(values as LabBuilderFormValues)
    })
    return () => subscription.unsubscribe()
  }, [watch, scheduleAutoSave])

  // ── Publish toggle ───────────────────────────────────────────────────────

  function handlePublishToggle() {
    // Save immediately first then toggle
    const values = getValues()
    performSave(values).then(() => {
      startPublishTransition(async () => {
        try {
          if (status === 'published') {
            await unpublishLab(lab.id)
            setStatus('draft')
          } else {
            await publishLab(lab.id)
            setStatus('published')
          }
          router.refresh()
        } catch {
          // ignore
        }
      })
    })
  }

  // ── Materials field array ────────────────────────────────────────────────
  const {
    fields: materialFields,
    append: addMaterial,
    remove: removeMaterial,
  } = useFieldArray({ control, name: 'materials_list' })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-4">
        <Link
          href="/teacher/labs"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Untitled Lab"
            className="w-full text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 truncate"
            {...register('title')}
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <LabStatusBadge status={status} />
          {/* Save indicator */}
          <span className="text-xs text-muted-foreground min-w-16 text-right">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="size-3" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-destructive">Error saving</span>
            )}
          </span>
          <Button
            type="button"
            variant={status === 'published' ? 'outline' : 'default'}
            size="sm"
            disabled={publishPending}
            onClick={handlePublishToggle}
          >
            {publishPending
              ? 'Saving...'
              : status === 'published'
              ? 'Unpublish'
              : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials & Safety</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
            <TabsTrigger value="prelab">Pre-Lab</TabsTrigger>
            <TabsTrigger value="procedure">Procedure</TabsTrigger>
            <TabsTrigger value="notes">Teacher Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <LabMetaSection control={control} register={register} />
          </TabsContent>

          <TabsContent value="materials">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Materials List</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => addMaterial({ value: '' })}
                  >
                    <Plus className="size-3.5" />
                    Add Material
                  </Button>
                </div>
                {materialFields.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No materials added yet.</p>
                )}
                {materialFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder={`e.g. 250ml beaker`}
                      {...register(`materials_list.${index}.value`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeMaterial(index)}
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="safety_notes">Safety Notes</Label>
                <Textarea
                  id="safety_notes"
                  placeholder="List any safety precautions students must follow..."
                  rows={4}
                  {...register('safety_notes')}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="background">
            <div className="space-y-1.5">
              <Label htmlFor="background">Background Information</Label>
              <Textarea
                id="background"
                placeholder="Provide background knowledge students need before starting the lab..."
                rows={12}
                {...register('background')}
              />
            </div>
          </TabsContent>

          <TabsContent value="prelab">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Pre-Lab Questions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions students answer before beginning the lab.
                </p>
              </div>
              <PreLabSection control={control} register={register} watch={watch} />
            </div>
          </TabsContent>

          <TabsContent value="procedure">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Lab Procedure</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add steps students will follow. Drag to reorder.
                </p>
              </div>
              <StepList control={control} register={register} watch={watch} />
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-1.5">
              <Label htmlFor="teacher_notes">
                Teacher Notes
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (private — only visible to you)
                </span>
              </Label>
              <Textarea
                id="teacher_notes"
                placeholder="Notes for yourself: prep tips, common mistakes, differentiation ideas..."
                rows={12}
                {...register('teacher_notes')}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Save steps & questions explicitly on blur */}
        <div className="mt-8 pt-6 border-t border-border">
          <SaveStepsButton labId={lab.id} getValues={getValues} />
        </div>
      </div>
    </div>
  )
}

// Button to explicitly persist steps/questions to DB (auto-save only persists lab metadata)
function SaveStepsButton({
  labId,
  getValues,
}: {
  labId: string
  getValues: () => LabBuilderFormValues
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function handleSave() {
    setStatus('saving')
    try {
      const values = getValues()
      // Save all steps
      await Promise.all(
        values.steps.map((step, idx) =>
          upsertLabStep(labId, {
            id: step.id,
            title: step.title,
            instructions: step.instructions,
            checkpoint: step.checkpoint || undefined,
            reflection_prompt: step.reflection_prompt || undefined,
            troubleshooting: step.troubleshooting || undefined,
            data_entry_fields: step.data_entry_fields,
            step_number: idx + 1,
          })
        )
      )
      // Save all pre-lab questions
      await Promise.all(
        values.pre_lab_questions.map((q, idx) =>
          upsertPreLabQuestion(labId, {
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options.length ? q.options : undefined,
            required: q.required,
            position: idx,
          })
        )
      )
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSave}
      disabled={status === 'saving'}
      className="w-full"
    >
      {status === 'saving' && <Loader2 className="size-4 animate-spin" />}
      {status === 'saved' && <Check className="size-4 text-green-600" />}
      {status === 'saving' ? 'Saving Steps & Questions...' : status === 'saved' ? 'Saved!' : 'Save Steps & Questions'}
    </Button>
  )
}
