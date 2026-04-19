'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FlaskConical,
  NotebookText,
  Play,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DEMO_PRELAB_ITEMS,
  DEMO_STEP_ENTRIES,
  DEMO_STUDENT_ASSIGNMENTS,
  DEMO_STUDENT_PROFILE,
  assignmentProgressPercent,
  summarizeAssignments,
  type DemoDashboardAssignment,
} from '@/components/demo/demo-data'

type StudentPhase = 'dashboard' | 'prelab' | 'step1' | 'step2' | 'complete'

const ACTIVE_ASSIGNMENT_ID = 'variables_lab'

const PHASE_PROGRESS: Record<StudentPhase, number> = {
  dashboard: 10,
  prelab: 30,
  step1: 58,
  step2: 84,
  complete: 100,
}

function updateAssignment(
  assignments: DemoDashboardAssignment[],
  assignmentId: string,
  updates: Partial<DemoDashboardAssignment>
) {
  return assignments.map((assignment) =>
    assignment.id === assignmentId ? { ...assignment, ...updates } : assignment
  )
}

export function StudentExperienceSection() {
  const [phase, setPhase] = useState<StudentPhase>('dashboard')
  const [showSummary, setShowSummary] = useState(false)
  const [startLabPressed, setStartLabPressed] = useState(false)
  const [assignments, setAssignments] =
    useState<DemoDashboardAssignment[]>(DEMO_STUDENT_ASSIGNMENTS)
  const [prelabAnswers, setPrelabAnswers] = useState<string[]>(
    DEMO_PRELAB_ITEMS.map(() => '')
  )
  const [dataValues, setDataValues] = useState<Record<string, string>>({})
  const [reflection, setReflection] = useState('')

  useEffect(() => {
    // Scripted demo timeline: dashboard -> start lab -> pre-lab -> step work -> complete.
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

    const typePrelab = (questionIndex: number, startMs: number) => {
      const answer = DEMO_PRELAB_ITEMS[questionIndex].answer
      typeText(startMs, answer, 14, (value) => {
        setPrelabAnswers((prev) => prev.map((item, index) => (index === questionIndex ? value : item)))
      })
    }

    const typeStepEntry = (entryIndex: number, startMs: number) => {
      const entry = DEMO_STEP_ENTRIES[entryIndex]
      let fieldDelay = startMs

      entry.dataFields.forEach((field, index) => {
        typeText(fieldDelay, field.value, 90 + index * 15, (value) => {
          setDataValues((prev) => ({ ...prev, [field.label]: value }))
        })
        fieldDelay += 460
      })

      typeText(fieldDelay + 160, entry.reflection, 8, setReflection)
    }

    schedule(400, () => setShowSummary(true))
    schedule(900, () => setStartLabPressed(true))
    schedule(1300, () =>
      setAssignments((current) =>
        updateAssignment(current, ACTIVE_ASSIGNMENT_ID, {
          status: 'in_progress',
          currentStep: 1,
        })
      )
    )
    schedule(1650, () => setPhase('prelab'))

    typePrelab(0, 2000)
    typePrelab(1, 3750)

    schedule(5750, () => {
      setPhase('step1')
      setDataValues({})
      setReflection('')
    })
    typeStepEntry(0, 6150)

    schedule(8650, () => {
      setPhase('step2')
      setDataValues({})
      setReflection('')
      setAssignments((current) =>
        updateAssignment(current, ACTIVE_ASSIGNMENT_ID, {
          status: 'in_progress',
          currentStep: 2,
        })
      )
    })
    typeStepEntry(1, 9000)

    schedule(11800, () => {
      setPhase('complete')
      setAssignments((current) =>
        updateAssignment(current, ACTIVE_ASSIGNMENT_ID, {
          status: 'complete',
          currentStep: 2,
        })
      )
    })

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const assignmentSummary = useMemo(() => summarizeAssignments(assignments), [assignments])

  const stepChecklist = [
    { label: 'Dashboard', done: phase !== 'dashboard' || startLabPressed },
    { label: 'Pre-Lab', done: ['step1', 'step2', 'complete'].includes(phase) },
    { label: 'Step 1', done: ['step2', 'complete'].includes(phase) },
    { label: 'Step 2', done: phase === 'complete' },
  ]

  const activeStepEntry =
    phase === 'step2'
      ? DEMO_STEP_ENTRIES[1]
      : phase === 'step1'
        ? DEMO_STEP_ENTRIES[0]
        : null

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 3: Student Experience
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Dashboard-First Student Workflow
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Watch the student dashboard update live as a learner starts an assigned lab, completes
          pre-lab prompts, enters evidence, and submits a full lab response.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-sky-300" />
              Student Dashboard
            </CardTitle>
            <CardDescription className="text-slate-300">
              {DEMO_STUDENT_PROFILE.studentName} | {DEMO_STUDENT_PROFILE.classLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {showSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-2 rounded-xl border border-slate-700 bg-slate-950/65 p-3 sm:grid-cols-3"
                >
                  <div>
                    <p className="text-xs text-slate-400">Classes</p>
                    <p className="text-xl font-semibold">{DEMO_STUDENT_PROFILE.classCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">In Progress</p>
                    <p className="text-xl font-semibold text-sky-300">{assignmentSummary.inProgress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Complete</p>
                    <p className="text-xl font-semibold text-green-300">{assignmentSummary.complete}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {assignments.map((assignment) => {
                const isActive = assignment.id === ACTIVE_ASSIGNMENT_ID
                const isNotStarted = assignment.status === 'not_started'
                const isInProgress = assignment.status === 'in_progress'
                const isComplete = assignment.status === 'complete'
                const progress = assignmentProgressPercent(assignment)

                return (
                  <motion.article
                    key={assignment.id}
                    layout
                    transition={{ duration: 0.3 }}
                    className={`rounded-xl border p-3 ${
                      isActive
                        ? 'border-sky-500/60 bg-sky-500/10'
                        : 'border-slate-700 bg-slate-950/65'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{assignment.title}</p>
                        <p className="text-xs text-slate-300">
                          {assignment.estimatedMinutes} min • {assignment.dueText}
                        </p>
                      </div>
                      <Badge
                        className={
                          isComplete
                            ? 'bg-green-500/20 text-green-300'
                            : isInProgress
                              ? 'bg-sky-500/20 text-sky-200'
                              : 'bg-slate-700 text-slate-200'
                        }
                      >
                        {isComplete
                          ? 'Complete'
                          : isInProgress
                            ? 'In Progress'
                            : 'Not Started'}
                      </Badge>
                    </div>

                    {isActive && isNotStarted && (
                      <motion.div
                        animate={startLabPressed ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-900/80 px-2 py-1 text-xs text-slate-200"
                      >
                        <Play className="size-3.5" />
                        Start Lab
                      </motion.div>
                    )}

                    {isInProgress && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>
                            Step {assignment.currentStep} of {assignment.totalSteps}
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full rounded-full bg-sky-400"
                          />
                        </div>
                      </div>
                    )}
                  </motion.article>
                )
              })}
            </div>

            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/65 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Journey Progress
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                <motion.div
                  key={phase}
                  initial={{ width: 0 }}
                  animate={{ width: `${PHASE_PROGRESS[phase]}%` }}
                  className="h-full rounded-full bg-sky-400"
                />
              </div>
              <div className="grid gap-1">
                {stepChecklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.done ? (
                      <CheckCircle2 className="size-3.5 text-green-400" />
                    ) : (
                      <Circle className="size-3.5 text-slate-500" />
                    )}
                    <span className={item.done ? 'text-slate-100' : 'text-slate-400'}>{item.label}</span>
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
              {phase === 'dashboard' && 'Waiting for student to open the assigned lab'}
              {phase === 'prelab' && 'Pre-lab questions in progress'}
              {phase === 'step1' && 'Step 1 data entry and reflection'}
              {phase === 'step2' && 'Step 2 data entry and reflection'}
              {phase === 'complete' && 'Submission complete and synced to dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {phase === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-dashed border-slate-600 p-4 text-sm text-slate-300"
                >
                  Student selects the highlighted assignment card and launches the lab.
                </motion.div>
              )}

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
                  {DEMO_PRELAB_ITEMS.map((item, index) => (
                    <div key={item.question} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm">
                      <p className="mb-2 font-medium">{index + 1}. {item.question}</p>
                      <Textarea
                        readOnly
                        rows={3}
                        value={prelabAnswers[index] ?? ''}
                        className="border-slate-700 bg-slate-900/70 text-slate-100"
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {(phase === 'step1' || phase === 'step2') && activeStepEntry && (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Step {activeStepEntry.stepNumber} of {DEMO_STEP_ENTRIES.length}
                    </p>
                    <Badge className="bg-slate-700 text-slate-100">Auto-saving</Badge>
                  </div>

                  <p className="text-sm font-medium">{activeStepEntry.title}</p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeStepEntry.dataFields.map((field) => (
                      <div key={field.label} className="space-y-1.5">
                        <p className="text-xs text-slate-300">{field.label}</p>
                        <Input
                          readOnly
                          value={dataValues[field.label] ?? ''}
                          className="border-slate-700 bg-slate-900/70 text-slate-100"
                        />
                      </div>
                    ))}
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
                    <ClipboardCheck className="size-3.5 text-green-400" />
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
                  className="rounded-2xl border border-green-500/40 bg-green-500/15 p-5"
                >
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-green-300">
                    <CheckCircle2 className="size-4" />
                    Lab Submitted Successfully
                  </p>
                  <p className="mt-2 text-sm text-green-100">
                    Dashboard status updated from In Progress to Complete for this assignment.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="inline-flex items-center gap-2 text-xs text-slate-300">
              <ArrowRight className="size-3.5" />
              Guided sequence: Dashboard summary, then Start Lab, Pre-Lab, Step 1, Step 2, and Complete
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
