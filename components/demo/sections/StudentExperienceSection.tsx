'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  FlaskConical,
  NotebookText,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type StudentPhase = 'dashboard' | 'prelab' | 'step1' | 'step2' | 'complete'

const PRELAB_PROMPT_1 = 'Photosynthesis converts light energy into chemical energy stored in glucose.'
const PRELAB_PROMPT_2 =
  'I predict oxygen bubble count increases as the light source moves closer to the plant.'

const STEP_1_DATA = {
  'Light Distance (cm)': '20',
  'Bubble Count (1 min)': '14',
}

const STEP_2_DATA = {
  'Light Distance (cm)': '10',
  'Bubble Count (1 min)': '24',
}

const STEP_1_REFLECTION =
  'At 20cm, photosynthesis is active but moderate. The bubble count gives us a clear baseline.'
const STEP_2_REFLECTION =
  'At 10cm, oxygen production increased, supporting the prediction that higher light intensity boosts photosynthesis rate.'

const PHASE_PROGRESS: Record<StudentPhase, number> = {
  dashboard: 8,
  prelab: 28,
  step1: 56,
  step2: 82,
  complete: 100,
}

export function StudentExperienceSection() {
  const [phase, setPhase] = useState<StudentPhase>('dashboard')
  const [labOpened, setLabOpened] = useState(false)
  const [prelabAnswers, setPrelabAnswers] = useState<[string, string]>(['', ''])
  const [dataValues, setDataValues] = useState<Record<string, string>>({})
  const [reflection, setReflection] = useState('')

  useEffect(() => {
    // Demo script: this section mimics an end-to-end student journey with timed state updates.
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

    schedule(700, () => setLabOpened(true))
    schedule(1500, () => setPhase('prelab'))

    typeText(1900, PRELAB_PROMPT_1, 15, (value) =>
      setPrelabAnswers((prev) => [value, prev[1]])
    )
    typeText(3500, PRELAB_PROMPT_2, 14, (value) =>
      setPrelabAnswers((prev) => [prev[0], value])
    )

    schedule(5600, () => setPhase('step1'))

    typeText(6000, STEP_1_DATA['Light Distance (cm)'], 80, (value) =>
      setDataValues((prev) => ({ ...prev, 'Light Distance (cm)': value }))
    )
    typeText(6450, STEP_1_DATA['Bubble Count (1 min)'], 110, (value) =>
      setDataValues((prev) => ({ ...prev, 'Bubble Count (1 min)': value }))
    )
    typeText(6900, STEP_1_REFLECTION, 8, setReflection)

    schedule(8600, () => setPhase('step2'))
    schedule(8650, () => setDataValues({}))
    schedule(8650, () => setReflection(''))

    typeText(8950, STEP_2_DATA['Light Distance (cm)'], 90, (value) =>
      setDataValues((prev) => ({ ...prev, 'Light Distance (cm)': value }))
    )
    typeText(9350, STEP_2_DATA['Bubble Count (1 min)'], 105, (value) =>
      setDataValues((prev) => ({ ...prev, 'Bubble Count (1 min)': value }))
    )
    typeText(9800, STEP_2_REFLECTION, 8, setReflection)

    schedule(11700, () => setPhase('complete'))

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const stepChecklist = [
    { label: 'Dashboard', done: phase !== 'dashboard' || labOpened },
    { label: 'Pre-Lab', done: ['step1', 'step2', 'complete'].includes(phase) },
    { label: 'Step 1', done: ['step2', 'complete'].includes(phase) },
    { label: 'Step 2', done: phase === 'complete' },
  ]

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 3: Student Experience
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Student Workflow Simulation</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Watch a student open an assigned lab, complete pre-lab prompts, enter data, and submit
          reflections as they progress through lab steps.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-primary" />
              Student Dashboard
            </CardTitle>
            <CardDescription>Avery Johnson | Biology Period 2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <motion.div
                animate={labOpened ? { scale: [1, 1.01, 1] } : {}}
                className={`rounded-xl border p-3 transition-colors ${
                  labOpened ? 'border-primary bg-primary/10' : 'border-border bg-background'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      Investigating Photosynthesis Through Light Intensity
                    </p>
                    <p className="text-xs text-muted-foreground">Due today • 45 minutes</p>
                  </div>
                  <Badge variant={labOpened ? 'default' : 'outline'}>
                    {labOpened ? 'Opened' : 'Assigned'}
                  </Badge>
                </div>
              </motion.div>

              <div className="rounded-xl border border-border bg-background p-3 opacity-75">
                <p className="text-sm font-semibold">Density Lab Review</p>
                <p className="text-xs text-muted-foreground">Completed last week</p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Journey Progress
              </p>
              <Progress value={PHASE_PROGRESS[phase]} />
              <div className="grid gap-1">
                {stepChecklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.done ? (
                      <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground" />
                    )}
                    <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookText className="size-4 text-sky-300" />
              Lab Runner
            </CardTitle>
            <CardDescription className="text-slate-300">
              {phase === 'dashboard' && 'Waiting for student to open lab...'}
              {phase === 'prelab' && 'Pre-lab prompts in progress'}
              {phase === 'step1' && 'Step 1 data entry and reflection'}
              {phase === 'step2' && 'Step 2 data entry and reflection'}
              {phase === 'complete' && 'Lab submission complete'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {phase === 'prelab' && (
                <motion.div
                  key="prelab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Pre-Lab Questions
                  </p>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm">
                    <p className="mb-2 font-medium">1. Explain photosynthesis in one sentence.</p>
                    <Textarea
                      readOnly
                      rows={3}
                      value={prelabAnswers[0]}
                      className="border-slate-700 bg-slate-900/70 text-slate-100"
                    />
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm">
                    <p className="mb-2 font-medium">
                      2. Predict what happens to oxygen output as light gets closer.
                    </p>
                    <Textarea
                      readOnly
                      rows={3}
                      value={prelabAnswers[1]}
                      className="border-slate-700 bg-slate-900/70 text-slate-100"
                    />
                  </div>
                </motion.div>
              )}

              {(phase === 'step1' || phase === 'step2') && (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {phase === 'step1' ? 'Step 1 of 2' : 'Step 2 of 2'}
                    </p>
                    <Badge variant="secondary">Auto-saving</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-300">Light Distance (cm)</p>
                      <Input
                        readOnly
                        value={dataValues['Light Distance (cm)'] ?? ''}
                        className="border-slate-700 bg-slate-900/70 text-slate-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-300">Bubble Count (1 min)</p>
                      <Input
                        readOnly
                        value={dataValues['Bubble Count (1 min)'] ?? ''}
                        className="border-slate-700 bg-slate-900/70 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-300">Reflection</p>
                    <Textarea
                      readOnly
                      rows={4}
                      value={reflection}
                      className="border-slate-700 bg-slate-900/70 text-slate-100"
                    />
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs text-slate-300">
                    <ClipboardCheck className="size-3.5 text-green-600 dark:text-green-400" />
                    Progress saved
                  </div>
                </motion.div>
              )}

              {phase === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/60 dark:bg-green-950/30"
                >
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-4" />
                    Lab Submitted Successfully
                  </p>
                  <p className="mt-2 text-sm text-green-800/90 dark:text-green-300">
                    Student completed pre-lab, two procedure steps, and evidence-backed reflection.
                  </p>
                </motion.div>
              )}

              {phase === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-dashed border-slate-600 p-4 text-sm text-slate-300"
                >
                  Student selects the assigned lab to begin.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="inline-flex items-center gap-2 text-xs text-slate-300">
              <ArrowRight className="size-3.5" />
              Guided sequence: Dashboard → Pre-Lab → Step 1 → Step 2 → Complete
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
