'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, WandSparkles, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type GenerationStatus = 'waiting' | 'analyzing' | 'drafting' | 'complete'

const PROMPT_TEXT =
  'Create a 45-minute 9th grade biology lab on photosynthesis with measurable data collection and reflection prompts.'

const GENERATED_LAB = {
  title: 'Investigating Photosynthesis Through Light Intensity',
  objectives: [
    'Collect quantitative oxygen production data from aquatic plants.',
    'Compare outcomes across low, medium, and high light conditions.',
    'Use evidence to explain the relationship between light intensity and photosynthesis rate.',
  ],
  materials: [
    'Elodea sprigs',
    'Beakers (250mL)',
    'Light source with adjustable distance',
    'Timer',
    'Data table handout',
    'Ruler',
  ],
  steps: [
    {
      title: 'Set Up Baseline',
      instructions:
        'Position Elodea in water and record bubble count for 1 minute at baseline distance.',
      reflection: 'What pattern do you notice in your baseline observations?',
    },
    {
      title: 'Adjust Light Distance',
      instructions:
        'Move light source to 20cm, 10cm, and 5cm. Record oxygen bubble count for each trial.',
      reflection: 'How does changing distance appear to impact oxygen production?',
    },
    {
      title: 'Interpret Results',
      instructions:
        'Graph your data and identify the strongest evidence for your claim about light intensity.',
      reflection: 'What conclusion can you defend with your data?',
    },
  ],
}

const START_DELAY_MS = 450
const PROMPT_TYPING_INTERVAL_MS = 16
const TITLE_TYPING_INTERVAL_MS = 22

export function TeacherLabCreationSection() {
  const [typedPrompt, setTypedPrompt] = useState('')
  const [generatePressed, setGeneratePressed] = useState(false)
  const [status, setStatus] = useState<GenerationStatus>('waiting')
  const [typedTitle, setTypedTitle] = useState('')
  const [visibleObjectives, setVisibleObjectives] = useState(0)
  const [visibleMaterials, setVisibleMaterials] = useState(0)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [visibleReflections, setVisibleReflections] = useState(0)

  useEffect(() => {
    // This timer-based sequence powers the "live" demo and avoids any API/database calls.
    const timers: number[] = []

    const schedule = (delayMs: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delayMs)
      timers.push(timerId)
    }

    PROMPT_TEXT.split('').forEach((_, index) => {
      schedule(START_DELAY_MS + index * PROMPT_TYPING_INTERVAL_MS, () => {
        setTypedPrompt(PROMPT_TEXT.slice(0, index + 1))
      })
    })

    const promptEndMs = START_DELAY_MS + PROMPT_TEXT.length * PROMPT_TYPING_INTERVAL_MS
    schedule(promptEndMs + 200, () => setGeneratePressed(true))
    schedule(promptEndMs + 520, () => setStatus('analyzing'))
    schedule(promptEndMs + 1600, () => setStatus('drafting'))

    GENERATED_LAB.title.split('').forEach((_, index) => {
      schedule(promptEndMs + 1860 + index * TITLE_TYPING_INTERVAL_MS, () => {
        setTypedTitle(GENERATED_LAB.title.slice(0, index + 1))
      })
    })

    const titleEndMs =
      promptEndMs + 1860 + GENERATED_LAB.title.length * TITLE_TYPING_INTERVAL_MS

    GENERATED_LAB.objectives.forEach((_, index) => {
      schedule(titleEndMs + 380 + index * 380, () => {
        setVisibleObjectives(index + 1)
      })
    })

    const objectivesEndMs = titleEndMs + 380 + GENERATED_LAB.objectives.length * 380

    GENERATED_LAB.materials.forEach((_, index) => {
      schedule(objectivesEndMs + 140 + index * 230, () => {
        setVisibleMaterials(index + 1)
      })
    })

    const materialsEndMs = objectivesEndMs + 140 + GENERATED_LAB.materials.length * 230

    GENERATED_LAB.steps.forEach((_, index) => {
      schedule(materialsEndMs + 240 + index * 620, () => {
        setVisibleSteps(index + 1)
      })
      schedule(materialsEndMs + 540 + index * 620, () => {
        setVisibleReflections(index + 1)
      })
    })

    const completeMs = materialsEndMs + 640 + GENERATED_LAB.steps.length * 620
    schedule(completeMs, () => setStatus('complete'))

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 2: Teacher Lab Creation
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">AI Lab Builder Walkthrough</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The demo simulates a teacher prompt and shows LabFlow AI filling objectives, materials,
          step instructions, and reflection prompts in real time.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-sky-300" />
              AI Prompt Input
            </CardTitle>
            <CardDescription className="text-slate-300">
              Simulated teacher request to generate a complete lab draft.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <Textarea
                rows={7}
                readOnly
                value={typedPrompt}
                className="resize-none border-none bg-transparent p-0 text-sm leading-relaxed text-slate-100 shadow-none focus-visible:ring-0"
              />
            </div>

            <motion.div whileTap={{ scale: 0.98 }} animate={generatePressed ? { scale: [1, 1.02, 1] } : {}}>
              <Button
                className="w-full gap-2"
                disabled={!generatePressed}
                aria-label="Generate lab"
              >
                <WandSparkles className="size-4" />
                {generatePressed ? 'Generate Lab' : 'Waiting for prompt...'}
              </Button>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
              >
                {status === 'waiting' && 'Preparing prompt...'}
                {status === 'analyzing' && 'Analyzing standards alignment and grade level...'}
                {status === 'drafting' && 'Drafting lab structure and classroom-ready steps...'}
                {status === 'complete' && (
                  <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="size-4" />
                    Lab draft generated and ready to review.
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle>Lab Builder Preview</CardTitle>
            <CardDescription>Auto-filled fields as they appear during generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lab Title
              </p>
              <Input readOnly value={typedTitle} placeholder="AI-generated title will appear here..." />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Learning Objectives
              </p>
              <ul className="space-y-2">
                <AnimatePresence>
                  {GENERATED_LAB.objectives.slice(0, visibleObjectives).map((objective) => (
                    <motion.li
                      key={objective}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="rounded-lg border border-border/80 bg-background px-3 py-2 text-sm"
                    >
                      {objective}
                    </motion.li>
                  ))}
                </AnimatePresence>
                {visibleObjectives === 0 && (
                  <li className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                    Waiting for objectives...
                  </li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Materials
              </p>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {GENERATED_LAB.materials.slice(0, visibleMaterials).map((material) => (
                    <motion.span
                      key={material}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {material}
                    </motion.span>
                  ))}
                </AnimatePresence>
                {visibleMaterials === 0 && (
                  <span className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                    Waiting for materials...
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Procedure + Reflection Prompts
              </p>
              <div className="space-y-2">
                <AnimatePresence>
                  {GENERATED_LAB.steps.slice(0, visibleSteps).map((step, index) => (
                    <motion.article
                      key={step.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="rounded-xl border border-border bg-background p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Step {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-medium">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.instructions}</p>
                      {index < visibleReflections && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-2 rounded-md bg-muted px-2.5 py-2 text-xs text-foreground/90"
                        >
                          Reflection prompt: {step.reflection}
                        </motion.p>
                      )}
                    </motion.article>
                  ))}
                </AnimatePresence>
                {visibleSteps === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Waiting for procedure steps...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
