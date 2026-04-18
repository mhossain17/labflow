'use client'
import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { LabStatusBadge } from './LabStatusBadge'
import { LabMetaSection } from './LabMetaSection'
import { PreLabSection } from './PreLabSection'
import { StepList } from './StepList'
import {
  updateLab,
  publishLab,
  unpublishLab,
  upsertLabStep,
  upsertPreLabQuestion,
} from '@/features/lab-builder/actions'
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  BookOpen,
  ClipboardList,
  Beaker,
  FileText,
  Rocket,
} from 'lucide-react'
import Link from 'next/link'
import type { LabWithSteps, LabStatus, DataEntryField } from '@/types/app'
import { cn } from '@/lib/utils'

// ── Form types ────────────────────────────────────────────────────────────────

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

// ── Wizard step definitions ───────────────────────────────────────────────────

const WIZARD_STEPS = [
  { num: 1, label: 'Overview', icon: FileText },
  { num: 2, label: 'Materials & Safety', icon: Beaker },
  { num: 3, label: 'Background', icon: BookOpen },
  { num: 4, label: 'Pre-Lab', icon: ClipboardList },
  { num: 5, label: 'Procedure', icon: FlaskConical },
  { num: 6, label: 'Review & Publish', icon: Rocket },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface LabBuilderFormProps {
  lab: LabWithSteps
  initialStep?: number
}

export function LabBuilderForm({ lab, initialStep = 1 }: LabBuilderFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [autoSaveStatus, setAutoSaveStatus] = useState<SaveStatus>('idle')
  const [stepSaving, setStepSaving] = useState(false)
  const [stepError, setStepError] = useState<string | null>(null)
  const [status, setStatus] = useState<LabStatus>(lab.status)
  const [, startPublishTransition] = useTransition()
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>('')

  const form = useForm<LabBuilderFormValues>({ defaultValues: toFormValues(lab) })
  const { register, control, watch, getValues, setValue } = form

  const {
    fields: materialFields,
    append: addMaterial,
    remove: removeMaterial,
  } = useFieldArray({ control, name: 'materials_list' })

  // ── Metadata auto-save ────────────────────────────────────────────────────

  const saveMetadata = useCallback(
    async (values: LabBuilderFormValues) => {
      setAutoSaveStatus('saving')
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
        setAutoSaveStatus('saved')
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } catch {
        setAutoSaveStatus('error')
      }
    },
    [lab.id]
  )

  const scheduleAutoSave = useCallback(
    (values: LabBuilderFormValues) => {
      const serialized = JSON.stringify({
        title: values.title,
        overview: values.overview,
        objectives: values.objectives,
        standards: values.standards,
        estimated_minutes: values.estimated_minutes,
        materials_list: values.materials_list,
        safety_notes: values.safety_notes,
        background: values.background,
        teacher_notes: values.teacher_notes,
      })
      if (serialized === lastSavedRef.current) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        lastSavedRef.current = serialized
        saveMetadata(values)
      }, 2000)
    },
    [saveMetadata]
  )

  useEffect(() => {
    const sub = watch((values) => scheduleAutoSave(values as LabBuilderFormValues))
    return () => sub.unsubscribe()
  }, [watch, scheduleAutoSave])

  // ── Step navigation ───────────────────────────────────────────────────────

  function goToStep(n: number) {
    const clamped = Math.max(1, Math.min(WIZARD_STEPS.length, n))
    setCurrentStep(clamped)
    setStepError(null)
    router.replace(`/teacher/labs/${lab.id}/edit?step=${clamped}`, { scroll: false })
  }

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function savePreLabQuestions(values: LabBuilderFormValues) {
    if (!values.pre_lab_questions.length) return
    await Promise.all(
      values.pre_lab_questions.map((q, idx) =>
        upsertPreLabQuestion(lab.id, {
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options.length ? q.options : undefined,
          required: q.required,
          position: idx,
        })
      )
    )
  }

  async function saveProcedureSteps(values: LabBuilderFormValues) {
    if (!values.steps.length) return
    await Promise.all(
      values.steps.map((step, idx) =>
        upsertLabStep(lab.id, {
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
  }

  async function saveAll(values: LabBuilderFormValues) {
    await Promise.all([
      saveMetadata(values),
      savePreLabQuestions(values),
      saveProcedureSteps(values),
    ])
  }

  // ── Save & Continue ───────────────────────────────────────────────────────

  async function handleSaveAndContinue() {
    setStepSaving(true)
    setStepError(null)
    const values = getValues()
    try {
      await saveMetadata(values)
      if (currentStep === 4) await savePreLabQuestions(values)
      if (currentStep === 5) await saveProcedureSteps(values)
      goToStep(currentStep + 1)
    } catch {
      setStepError('Failed to save. Please try again.')
    } finally {
      setStepSaving(false)
    }
  }

  // ── Publish / draft ───────────────────────────────────────────────────────

  async function handlePublish() {
    setStepSaving(true)
    setStepError(null)
    const values = getValues()
    try {
      await saveAll(values)
      startPublishTransition(async () => {
        await publishLab(lab.id)
        setStatus('published')
        setStepSaving(false)
        router.push('/teacher/labs')
      })
    } catch {
      setStepError('Failed to publish. Please try again.')
      setStepSaving(false)
    }
  }

  async function handleSaveDraft() {
    setStepSaving(true)
    setStepError(null)
    const values = getValues()
    try {
      await saveAll(values)
      router.push('/teacher/labs')
    } catch {
      setStepError('Failed to save. Please try again.')
      setStepSaving(false)
    }
  }

  async function handleUnpublish() {
    startPublishTransition(async () => {
      await unpublishLab(lab.id)
      setStatus('draft')
      router.refresh()
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isLastStep = currentStep === WIZARD_STEPS.length

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center gap-4">
        <Link href="/teacher/labs" className="text-muted-foreground hover:text-foreground shrink-0">
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
          <span className="text-xs text-muted-foreground min-w-14 text-right">
            {autoSaveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Saving…
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="size-3" />
                Saved
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-destructive">Save error</span>
            )}
          </span>
          {status === 'published' && (
            <Button variant="outline" size="sm" onClick={handleUnpublish}>
              Unpublish
            </Button>
          )}
        </div>
      </div>

      {/* ── Step progress indicator ───────────────────────────────────────── */}
      <div className="border-b border-border bg-muted/20 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon = step.icon
            const isDone = currentStep > step.num
            const isCurrent = currentStep === step.num
            return (
              <div key={step.num} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => goToStep(step.num)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium rounded-md px-1.5 py-1 transition-colors whitespace-nowrap',
                    isCurrent
                      ? 'text-primary'
                      : isDone
                      ? 'text-green-600 dark:text-green-400 hover:text-green-700'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isDone
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                        : 'bg-muted-foreground/15 text-muted-foreground'
                    )}
                  >
                    {isDone ? <Check className="size-2.5" /> : step.num}
                  </span>
                  <span className="hidden md:block">{step.label}</span>
                  <Icon className="size-3 md:hidden" />
                </button>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-px mx-1',
                      isDone ? 'bg-green-300 dark:bg-green-700' : 'bg-border'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-8">

        {/* Step 1 — Overview */}
        {currentStep === 1 && (
          <div className="space-y-2">
            <div>
              <h2 className="text-lg font-semibold">Overview</h2>
              <p className="text-sm text-muted-foreground">
                Describe the lab and set learning objectives and standards.
              </p>
            </div>
            <LabMetaSection control={control} register={register} />
          </div>
        )}

        {/* Step 2 — Materials & Safety */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Materials & Safety</h2>
              <p className="text-sm text-muted-foreground">
                List everything students need and any safety requirements.
              </p>
            </div>
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
                    placeholder="e.g. 250 ml beaker"
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
                placeholder="List any safety precautions students must follow…"
                rows={4}
                {...register('safety_notes')}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Background */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Background Knowledge</h2>
              <p className="text-sm text-muted-foreground">
                Provide context students should understand before beginning.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="background">Background Information</Label>
              <Textarea
                id="background"
                placeholder="Provide background knowledge students need before starting the lab…"
                rows={14}
                {...register('background')}
              />
            </div>
          </div>
        )}

        {/* Step 4 — Pre-Lab Questions */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Pre-Lab Questions</h2>
              <p className="text-sm text-muted-foreground">
                Questions students answer before beginning the lab.
              </p>
            </div>
            <PreLabSection control={control} register={register} watch={watch} />
          </div>
        )}

        {/* Step 5 — Procedure */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Lab Procedure</h2>
              <p className="text-sm text-muted-foreground">
                Add steps students will follow. Drag to reorder. Use AI to fill in details.
              </p>
            </div>
            <StepList control={control} register={register} watch={watch} setValue={setValue} />
          </div>
        )}

        {/* Step 6 — Review & Publish */}
        {currentStep === 6 && (
          <ReviewAndPublishStep
            lab={lab}
            status={status}
            register={register}
            watch={watch}
          />
        )}

        {/* ── Navigation bar ─────────────────────────────────────────────── */}
        {stepError && (
          <p className="text-sm text-destructive">{stepError}</p>
        )}

        <div className="pt-6 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 1 || stepSaving}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>

          {isLastStep ? (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={stepSaving}
              >
                {stepSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Draft & Exit
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={stepSaving}
              >
                {stepSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Rocket className="size-4" />
                )}
                {status === 'published' ? 'Save & Stay Published' : 'Publish to Students'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={stepSaving}
            >
              {stepSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {stepSaving ? 'Saving…' : 'Save & Continue'}
              {!stepSaving && <ChevronRight className="size-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Review & Publish step ─────────────────────────────────────────────────────

function ReviewAndPublishStep({
  lab,
  status,
  register,
  watch,
}: {
  lab: LabWithSteps
  status: LabStatus
  register: ReturnType<typeof useForm<LabBuilderFormValues>>['register']
  watch: ReturnType<typeof useForm<LabBuilderFormValues>>['watch']
}) {
  const steps = watch('steps')
  const questions = watch('pre_lab_questions')
  const materials = watch('materials_list')
  const objectives = watch('objectives')

  const stats = [
    { label: 'Procedure steps', value: steps.length },
    { label: 'Pre-lab questions', value: questions.length },
    { label: 'Materials', value: materials.filter((m) => m.value.trim()).length },
    { label: 'Learning objectives', value: objectives.filter((o) => o.value.trim()).length },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Review & Publish</h2>
        <p className="text-sm text-muted-foreground">
          Review your lab summary, add private notes, then publish when ready.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Lab Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        {status === 'published' && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-sm text-green-800 dark:text-green-300">
            <Check className="size-4 shrink-0" />
            This lab is currently published and visible to assigned students.
          </div>
        )}
      </div>

      {/* Teacher notes */}
      <div className="space-y-1.5">
        <Label htmlFor="teacher_notes">
          Teacher Notes
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (private — students never see this)
          </span>
        </Label>
        <Textarea
          id="teacher_notes"
          placeholder="Prep tips, common student mistakes, differentiation ideas, timing notes…"
          rows={8}
          {...register('teacher_notes')}
        />
      </div>
    </div>
  )
}
