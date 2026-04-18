'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Beaker,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  Loader2,
  Rocket,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type NewLabPhase = 'idle' | 'generating' | 'saving' | 'done'
type SaveStatus = 'idle' | 'saving' | 'saved'
type BuilderStep = 1 | 2 | 6 | 7

const WIZARD_STEPS = [
  { num: 1, label: 'Overview', icon: FileText },
  { num: 2, label: 'Materials & Safety', icon: Beaker },
  { num: 3, label: 'Background', icon: BookOpen },
  { num: 4, label: 'Pre-Lab', icon: ClipboardList },
  { num: 5, label: 'Procedure', icon: FlaskConical },
  { num: 6, label: 'Rubric', icon: ClipboardCheck },
  { num: 7, label: 'Review & Publish', icon: Rocket },
] as const

const PHASE_LABELS: Record<NewLabPhase, string> = {
  idle: 'Ready to generate lab draft',
  generating: 'Generating your lab with AI…',
  saving: 'Saving your lab…',
  done: 'Done! Opening editor…',
}

const PROMPT_TEXT =
  'A lab where 9th grade chemistry students mix household acids and bases, measure pH changes using litmus paper, and graph their results.'

const GENERATED_DRAFT = {
  title: 'Investigating Acids and Bases Through pH Changes',
  overview:
    'Students mix common acids and bases, measure pH with indicators, and use data trends to explain neutralization.',
  objectives: [
    'Measure pH values for multiple acid/base mixtures.',
    'Identify neutralization points using observed pH changes.',
    'Support conclusions with graphed evidence.',
  ],
  materials: [
    'Beakers (250mL)',
    'Litmus paper',
    'Household vinegar',
    'Baking soda solution',
    'Dropper pipettes',
    'Safety goggles',
  ],
  safetyNotes:
    'Wear goggles throughout the lab, avoid skin contact with solutions, and dispose of mixtures in the designated sink station.',
  rubric: [
    { title: 'Claim and Hypothesis Quality', points: 10 },
    { title: 'Data Collection Accuracy', points: 10 },
    { title: 'Data Analysis and Reasoning', points: 10 },
    { title: 'Reflection and Communication', points: 10 },
  ],
}

const START_DELAY_MS = 420
const PROMPT_TYPING_INTERVAL_MS = 14

export function TeacherLabCreationSection() {
  const [typedPrompt, setTypedPrompt] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [gradeLevel, setGradeLevel] = useState('6-8')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('')
  const [materialsInput, setMaterialsInput] = useState('')
  const [phase, setPhase] = useState<NewLabPhase>('idle')
  const [generatePressed, setGeneratePressed] = useState(false)

  const [builderStep, setBuilderStep] = useState<BuilderStep>(1)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [typedTitle, setTypedTitle] = useState('')
  const [typedOverview, setTypedOverview] = useState('')
  const [visibleObjectives, setVisibleObjectives] = useState(0)
  const [sectionAIOpen, setSectionAIOpen] = useState(false)
  const [sectionAIGenerating, setSectionAIGenerating] = useState(false)
  const [visibleMaterials, setVisibleMaterials] = useState(0)
  const [safetyNotes, setSafetyNotes] = useState('')
  const [visibleRubric, setVisibleRubric] = useState(0)
  const [publishPressed, setPublishPressed] = useState(false)
  const [published, setPublished] = useState(false)

  useEffect(() => {
    // Scripted timeline mirrors the real flow: create prompt -> generate -> open wizard -> rubric -> publish.
    const timers: number[] = []

    const schedule = (delayMs: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delayMs)
      timers.push(timerId)
    }

    const typeText = (
      startMs: number,
      content: string,
      intervalMs: number,
      onUpdate: (value: string) => void
    ) => {
      content.split('').forEach((_, index) => {
        schedule(startMs + index * intervalMs, () => {
          onUpdate(content.slice(0, index + 1))
        })
      })
    }

    typeText(START_DELAY_MS, PROMPT_TEXT, PROMPT_TYPING_INTERVAL_MS, setTypedPrompt)

    const promptEndMs = START_DELAY_MS + PROMPT_TEXT.length * PROMPT_TYPING_INTERVAL_MS

    schedule(promptEndMs + 180, () => setShowDetails(true))
    schedule(promptEndMs + 280, () => setGradeLevel('9-10'))
    typeText(promptEndMs + 420, 'Chemistry', 35, setSubject)
    typeText(promptEndMs + 450, '50', 140, setDuration)
    typeText(promptEndMs + 500, 'beakers, litmus paper, vinegar, baking soda', 18, setMaterialsInput)

    schedule(promptEndMs + 1500, () => setGeneratePressed(true))
    schedule(promptEndMs + 1850, () => setPhase('generating'))
    schedule(promptEndMs + 3050, () => setPhase('saving'))
    schedule(promptEndMs + 4300, () => {
      setPhase('done')
      setBuilderStep(1)
      setSaveStatus('saving')
    })

    typeText(promptEndMs + 4550, GENERATED_DRAFT.title, 18, setTypedTitle)
    typeText(promptEndMs + 5350, GENERATED_DRAFT.overview, 7, setTypedOverview)
    GENERATED_DRAFT.objectives.forEach((_, index) => {
      schedule(promptEndMs + 7000 + index * 340, () => {
        setVisibleObjectives(index + 1)
      })
    })
    schedule(promptEndMs + 8200, () => setSaveStatus('saved'))

    schedule(promptEndMs + 9000, () => {
      setBuilderStep(2)
      setSaveStatus('saving')
      setSectionAIOpen(true)
    })
    schedule(promptEndMs + 9400, () => setSectionAIGenerating(true))
    schedule(promptEndMs + 10150, () => setSectionAIGenerating(false))

    GENERATED_DRAFT.materials.forEach((_, index) => {
      schedule(promptEndMs + 10400 + index * 220, () => {
        setVisibleMaterials(index + 1)
      })
    })
    typeText(promptEndMs + 11600, GENERATED_DRAFT.safetyNotes, 8, setSafetyNotes)
    schedule(promptEndMs + 12800, () => setSaveStatus('saved'))

    schedule(promptEndMs + 13350, () => {
      setBuilderStep(6)
      setSaveStatus('idle')
    })
    GENERATED_DRAFT.rubric.forEach((_, index) => {
      schedule(promptEndMs + 13700 + index * 360, () => {
        setVisibleRubric(index + 1)
      })
    })

    schedule(promptEndMs + 15400, () => setBuilderStep(7))
    schedule(promptEndMs + 15900, () => setPublishPressed(true))
    schedule(promptEndMs + 16500, () => setPublished(true))

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const rubricTotal = useMemo(
    () =>
      GENERATED_DRAFT.rubric
        .slice(0, visibleRubric)
        .reduce((sum, criterion) => sum + criterion.points, 0),
    [visibleRubric]
  )

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 2: Teacher Lab Creation
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Current Lab Builder Workflow</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          This demo now matches the live flow: AI draft generation from the new lab page, then a
          guided 7-step editor with rubric and review publish.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-sky-300" />
              Create New Lab
            </CardTitle>
            <CardDescription className="text-slate-300">
              Prompt plus optional details before AI generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                What should this lab be about?
              </p>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <Textarea
                  rows={6}
                  readOnly
                  value={typedPrompt}
                  className="resize-none border-none bg-transparent p-0 text-sm leading-relaxed text-slate-100 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-slate-300"
            >
              <ChevronDown className={`size-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              Add details (optional)
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="grid gap-3 rounded-xl border border-slate-700 bg-slate-950/65 p-3 sm:grid-cols-2"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Grade Level</p>
                    <div className="h-9 rounded-md border border-slate-700 bg-slate-900/70 px-3 text-sm leading-9">
                      {gradeLevel}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Subject</p>
                    <Input readOnly value={subject} className="border-slate-700 bg-slate-900/70 text-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Duration (minutes)</p>
                    <Input
                      readOnly
                      value={duration}
                      className="border-slate-700 bg-slate-900/70 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Available Materials</p>
                    <Input
                      readOnly
                      value={materialsInput}
                      className="border-slate-700 bg-slate-900/70 text-slate-100"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div animate={generatePressed ? { scale: [1, 1.02, 1] } : { scale: 1 }}>
              <Button className="w-full gap-2" disabled={!generatePressed}>
                <WandSparkles className="size-4" />
                {generatePressed ? 'Generate Lab with AI' : 'Waiting for prompt...'}
              </Button>
            </motion.div>

            <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200">
              <p className="inline-flex items-center gap-1.5">
                {(phase === 'generating' || phase === 'saving') && (
                  <Loader2 className="size-3.5 animate-spin text-sky-300" />
                )}
                {phase === 'done' && <CheckCircle2 className="size-3.5 text-green-400" />}
                {PHASE_LABELS[phase]}
              </p>
            </div>

            <p className="text-xs text-slate-300">
              Demo script mirrors `createLabWithContent` style generation and save phases.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle>Lab Builder Wizard</CardTitle>
            <CardDescription className="text-slate-300">
              7-step flow including Rubric and Review Publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <div className="flex min-w-max items-center gap-2">
                {WIZARD_STEPS.map((step) => {
                  const Icon = step.icon
                  const done = builderStep > step.num
                  const current = builderStep === step.num
                  return (
                    <div key={step.num} className="inline-flex items-center gap-1.5">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                          current
                            ? 'border-sky-400/60 bg-sky-500/20 text-sky-100'
                            : done
                              ? 'border-green-400/50 bg-green-500/20 text-green-100'
                              : 'border-slate-700 bg-slate-900/70 text-slate-300'
                        }`}
                      >
                        {done ? <Check className="size-3" /> : <Icon className="size-3" />}
                        {step.label}
                      </div>
                      {step.num < WIZARD_STEPS.length && (
                        <ChevronRight className="size-3 text-slate-500" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/65 px-3 py-2 text-xs">
              <p className="text-slate-300">Current step: {WIZARD_STEPS.find((s) => s.num === builderStep)?.label}</p>
              <p className="text-slate-300">
                {saveStatus === 'saving' && 'Auto-save: Saving…'}
                {saveStatus === 'saved' && 'Auto-save: Saved'}
                {saveStatus === 'idle' && 'Auto-save: Idle'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {builderStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step 1: Overview</p>
                  <Input
                    readOnly
                    value={typedTitle}
                    placeholder="Lab title"
                    className="border-slate-700 bg-slate-900/70 text-slate-100"
                  />
                  <Textarea
                    readOnly
                    rows={3}
                    value={typedOverview}
                    placeholder="Overview"
                    className="border-slate-700 bg-slate-900/70 text-slate-100"
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Objectives</p>
                    {GENERATED_DRAFT.objectives.slice(0, visibleObjectives).map((objective) => (
                      <motion.div
                        key={objective}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm"
                      >
                        {objective}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {builderStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Step 2: Materials &amp; Safety
                  </p>
                  <div className="rounded-lg border border-purple-400/40 bg-purple-500/10 px-3 py-2">
                    <p className="inline-flex items-center gap-1.5 text-sm text-purple-100">
                      <Sparkles className="size-3.5" />
                      Generate materials list and safety notes with AI
                    </p>
                    {sectionAIOpen && (
                      <div className="mt-2 text-xs text-purple-200/90">
                        {sectionAIGenerating ? 'Generating section content…' : 'AI content inserted into fields'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {GENERATED_DRAFT.materials.slice(0, visibleMaterials).map((material) => (
                      <motion.span
                        key={material}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-full border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-xs text-sky-100"
                      >
                        {material}
                      </motion.span>
                    ))}
                  </div>

                  <Textarea
                    readOnly
                    rows={3}
                    value={safetyNotes}
                    placeholder="Safety notes"
                    className="border-slate-700 bg-slate-900/70 text-slate-100"
                  />
                </motion.div>
              )}

              {builderStep === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step 6: Rubric</p>
                  {GENERATED_DRAFT.rubric.slice(0, visibleRubric).map((criterion, index) => (
                    <motion.div
                      key={criterion.title}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-slate-700 bg-slate-950/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          Criterion {index + 1}: {criterion.title}
                        </p>
                        <Badge className="bg-slate-700 text-slate-100">{criterion.points} pts</Badge>
                      </div>
                    </motion.div>
                  ))}
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm">
                    <span className="text-slate-300">Rubric Total</span>
                    <span className="font-semibold text-sky-100">{rubricTotal} points</span>
                  </div>
                </motion.div>
              )}

              {builderStep === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Step 7: Review &amp; Publish
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-200">
                    <p className="font-medium">Summary complete for publish</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Overview, materials, procedure, and rubric are all ready for students.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-600 text-slate-100">
                      Save Draft &amp; Exit
                    </Button>
                    <motion.div animate={publishPressed ? { scale: [1, 0.98, 1] } : { scale: 1 }}>
                      <Button className="gap-2">
                        <Rocket className="size-4" />
                        Publish to Students
                      </Button>
                    </motion.div>
                  </div>
                  {published && (
                    <div className="rounded-lg border border-green-500/40 bg-green-500/15 px-3 py-2 text-sm text-green-100">
                      <p className="inline-flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="size-4 text-green-300" />
                        Lab published successfully
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

