'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  ListChecks,
  Loader2,
  Sparkles,
  Star,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DEMO_FINAL_GRADE,
  DEMO_RUBRIC_CRITERIA,
  DEMO_RUBRIC_SCORES,
  DEMO_STUDENT_PROFILE,
} from '@/components/demo/demo-data'

type RubricPhase = 'authoring' | 'self_assessment' | 'teacher_grading' | 'final_grade'

interface TeacherScoreState {
  score: string
  comment: string
}

export function RubricGradingSection() {
  const [phase, setPhase] = useState<RubricPhase>('authoring')
  const [visibleCriteria, setVisibleCriteria] = useState(0)
  const [selfScores, setSelfScores] = useState<Record<string, string>>({})
  const [teacherScores, setTeacherScores] = useState<Record<string, TeacherScoreState>>({})
  const [selfSaved, setSelfSaved] = useState(false)
  const [queueGraded, setQueueGraded] = useState(false)

  useEffect(() => {
    // Scripted sequence: rubric authoring -> self assessment -> teacher grading -> final grade.
    const timers: number[] = []
    const schedule = (delayMs: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delayMs)
      timers.push(timerId)
    }

    DEMO_RUBRIC_CRITERIA.forEach((_, index) => {
      schedule(450 + index * 430, () => setVisibleCriteria(index + 1))
    })

    schedule(2500, () => setPhase('self_assessment'))

    DEMO_RUBRIC_SCORES.forEach((item, index) => {
      schedule(3000 + index * 520, () => {
        setSelfScores((current) => ({ ...current, [item.criterionId]: item.selfScore.toString() }))
      })
    })

    schedule(5200, () => setSelfSaved(true))
    schedule(5900, () => setPhase('teacher_grading'))

    DEMO_RUBRIC_SCORES.forEach((item, index) => {
      schedule(6400 + index * 700, () => {
        setTeacherScores((current) => ({
          ...current,
          [item.criterionId]: {
            score: item.teacherScore.toString(),
            comment: item.teacherComment,
          },
        }))
      })
    })

    schedule(9600, () => {
      setPhase('final_grade')
      setQueueGraded(true)
    })

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const visibleRubric = DEMO_RUBRIC_CRITERIA.slice(0, visibleCriteria)

  const totalPoints = useMemo(
    () => visibleRubric.reduce((sum, item) => sum + item.maxPoints, 0),
    [visibleRubric]
  )

  const phaseLabel: Record<RubricPhase, string> = {
    authoring: 'Authoring rubric',
    self_assessment: 'Student self-assessment',
    teacher_grading: 'Teacher grading',
    final_grade: 'Final grade published',
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 6: Rubric & Grading System
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">End-to-End Assessment Workflow</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          This sequence demonstrates rubric setup, student self-scoring, teacher grading, and a
          final grade reveal exactly as a presentation walkthrough.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-4 text-sky-300" />
                Teacher Rubric Builder
              </CardTitle>
              <Badge className="bg-slate-700 text-slate-100">{phaseLabel[phase]}</Badge>
            </div>
            <CardDescription className="text-slate-300">
              Criteria are created and weighted before students submit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <AnimatePresence>
                {visibleRubric.map((criterion, index) => (
                  <motion.article
                    key={criterion.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-slate-700 bg-slate-950/65 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Criterion {index + 1}
                        </p>
                        <p className="text-sm font-semibold">{criterion.title}</p>
                        <p className="mt-1 text-xs text-slate-300">{criterion.description}</p>
                      </div>
                      <Badge className="bg-sky-500/20 text-sky-200">{criterion.maxPoints} pts</Badge>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
              {visibleCriteria === 0 && (
                <div className="rounded-xl border border-dashed border-slate-600 p-3 text-sm text-slate-300">
                  Waiting for rubric criteria...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/65 px-3 py-2">
              <p className="text-sm text-slate-300">Rubric Total</p>
              <p className="text-lg font-semibold text-sky-200">{totalPoints} points</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-sky-300" />
              Student + Teacher Grading
            </CardTitle>
            <CardDescription className="text-slate-300">
              Submission queue and criterion-level scoring updates in real time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-700 bg-slate-950/65 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{DEMO_STUDENT_PROFILE.studentName}</p>
                  <p className="text-xs text-slate-400">Submitted 1:42 PM • Photosynthesis Lab</p>
                </div>
                <Badge
                  className={
                    queueGraded ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-200'
                  }
                >
                  {queueGraded ? 'Graded' : 'Ungraded'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              {DEMO_RUBRIC_CRITERIA.map((criterion) => {
                const selfScore = selfScores[criterion.id]
                const teacher = teacherScores[criterion.id]

                return (
                  <motion.div
                    key={criterion.id}
                    layout
                    className="rounded-xl border border-slate-700 bg-slate-950/65 p-3"
                  >
                    <p className="text-sm font-semibold">{criterion.title}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Self Score</p>
                        <p className="text-sm font-semibold text-sky-200">
                          {selfScore ? `${selfScore} / ${criterion.maxPoints}` : '—'}
                        </p>
                      </div>
                      <div className="rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Teacher Score</p>
                        <p className="text-sm font-semibold text-green-200">
                          {teacher?.score ? `${teacher.score} / ${criterion.maxPoints}` : '—'}
                        </p>
                      </div>
                    </div>
                    {teacher?.comment && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-2 text-xs text-slate-300"
                      >
                        {teacher.comment}
                      </motion.p>
                    )}
                  </motion.div>
                )
              })}
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/65 px-3 py-2">
              <p className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                {selfSaved ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-green-400" />
                    Self-assessment saved
                  </>
                ) : (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-sky-300" />
                    Saving self-assessment...
                  </>
                )}
              </p>
            </div>

            <AnimatePresence>
              {phase === 'final_grade' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-green-500/40 bg-green-500/15 p-4"
                >
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-300">
                    <FileCheck className="size-4" />
                    Student Completion View
                  </p>
                  <p className="mt-1 text-lg font-semibold text-green-100">
                    {DEMO_FINAL_GRADE.totalScore}/{DEMO_FINAL_GRADE.maxScore} pts •{' '}
                    {DEMO_FINAL_GRADE.letterGrade}
                  </p>
                  <p className="mt-1 text-sm text-green-100/90">{DEMO_FINAL_GRADE.overallComment}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-green-200">
                    <Star className="size-3.5" />
                    Final grade published to student and teacher dashboards
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="inline-flex items-center gap-1.5 text-xs text-slate-300">
              <Sparkles className="size-3.5" />
              Live flow: rubric authoring, self assessment, teacher grading, then graded status
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
