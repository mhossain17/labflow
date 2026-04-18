'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleHelp,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type HelpStatus = 'on_track' | 'stuck' | 'requesting_help' | 'guided' | 'recovered'

const AI_GUIDANCE_STEPS = [
  'Let’s isolate one variable: keep plant species and water volume constant.',
  'Measure bubble count for exactly 60 seconds at each distance.',
  'If counts seem inconsistent, run a second trial and average the values.',
  'Use your graph slope to justify your final claim before moving to Step 4.',
]

export function StudentGetsStuckSection() {
  const [status, setStatus] = useState<HelpStatus>('on_track')
  const [difficultyHighlighted, setDifficultyHighlighted] = useState(false)
  const [helpButtonPressed, setHelpButtonPressed] = useState(false)
  const [visibleGuidanceCount, setVisibleGuidanceCount] = useState(0)

  useEffect(() => {
    // Scripted behavior: student gets stuck, requests help, then receives guided AI coaching.
    const timers: number[] = []
    const schedule = (delayMs: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delayMs)
      timers.push(timerId)
    }

    schedule(900, () => setStatus('stuck'))
    schedule(1200, () => setDifficultyHighlighted(true))
    schedule(1900, () => setHelpButtonPressed(true))
    schedule(2200, () => setStatus('requesting_help'))
    schedule(3000, () => setStatus('guided'))

    AI_GUIDANCE_STEPS.forEach((_, index) => {
      schedule(3400 + index * 900, () => {
        setVisibleGuidanceCount(index + 1)
      })
    })

    schedule(7600, () => setStatus('recovered'))

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const statusBadge = {
    on_track: { label: 'On Track', className: 'bg-green-500/15 text-green-700 dark:text-green-400' },
    stuck: { label: 'Stuck', className: 'bg-red-500/15 text-red-700 dark:text-red-400' },
    requesting_help: {
      label: 'Need Help',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
    guided: { label: 'AI Coaching', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
    recovered: {
      label: 'Back on Track',
      className: 'bg-green-500/15 text-green-700 dark:text-green-400',
    },
  }[status]

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 4: Student Gets Stuck
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Intervention in Real Time</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          This sequence demonstrates a student hitting difficulty, requesting help, and receiving
          contextual AI guidance one step at a time.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              Student Step Context
            </CardTitle>
            <CardDescription>Step 3: Data interpretation and claim justification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
              <div>
                <p className="text-sm font-semibold">Status</p>
                <p className="text-xs text-muted-foreground">Riley Martinez • Biology Period 3</p>
              </div>
              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            </div>

            <motion.div
              animate={
                difficultyHighlighted
                  ? { borderColor: ['#ef4444', '#f97316', '#ef4444'] }
                  : { borderColor: '#e5e7eb' }
              }
              transition={{
                duration: 1.8,
                repeat: difficultyHighlighted && status !== 'recovered' ? Infinity : 0,
              }}
              className="rounded-xl border bg-background p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Difficulty Highlight
              </p>
              <p className="mt-1 text-sm font-medium">
                Student is unsure how to interpret inconsistent trial data.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Trial 1 and Trial 2 differ by 40%</li>
                <li>• Reflection prompt asks for evidence-backed claim</li>
                <li>• Student has paused for 3+ minutes on this step</li>
              </ul>
            </motion.div>

            <motion.div
              animate={helpButtonPressed ? { scale: [1, 0.98, 1] } : {}}
              className="inline-flex w-full"
            >
              <Button
                className={`w-full gap-2 ${
                  helpButtonPressed ? 'bg-amber-600 text-white hover:bg-amber-700' : ''
                }`}
              >
                <CircleHelp className="size-4" />
                {helpButtonPressed ? 'Help Requested' : 'Get Help on This Step'}
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4 text-sky-300" />
              AI Guidance Thread
            </CardTitle>
            <CardDescription className="text-slate-300">
              Adaptive support generated from student context and step data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {visibleGuidanceCount === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-dashed border-slate-600 p-3 text-sm text-slate-300"
                >
                  Waiting for help request...
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {AI_GUIDANCE_STEPS.slice(0, visibleGuidanceCount).map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900/70 dark:bg-blue-950/40"
                >
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    <Sparkles className="size-3.5" />
                    Guidance {index + 1}
                  </p>
                  <p className="mt-1 text-blue-900 dark:text-blue-100">{step}</p>
                </motion.div>
              ))}
            </div>

            {status === 'recovered' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
              >
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4" />
                  Student recovered and advanced after AI support
                </p>
                <p className="mt-1">
                  Riley updated their claim using averaged trials and moved forward confidently.
                </p>
              </motion.div>
            )}

            <p className="inline-flex items-center gap-1.5 text-xs text-slate-300">
              <Lightbulb className="size-3.5" />
              Guidance is generated from step content, response history, and detected struggle
              signals.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
