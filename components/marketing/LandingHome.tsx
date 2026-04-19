'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { LoginBox } from '@/components/auth/LoginBox'
import { Button } from '@/components/ui/button'

type LiveTabId = 'teacher_monitor' | 'student_runner' | 'analytics'
type MonitorStatus = 'on_track' | 'needs_help' | 'stuck'

const FEATURE_CARDS: Array<{
  title: string
  description: string
  detail: string
  icon: LucideIcon
}> = [
  {
    title: 'Build Labs In Minutes',
    description: 'Generate complete lab drafts with AI prompts, materials, and rubric criteria.',
    detail: 'Teachers start from a full draft instead of a blank page, then edit and publish.',
    icon: Sparkles,
  },
  {
    title: 'Guide Every Student Step',
    description: 'Students move through pre-lab, data collection, and reflection in one workflow.',
    detail: 'Every response is saved to the run so evidence and writing stay organized.',
    icon: ClipboardList,
  },
  {
    title: 'Intervene In Real Time',
    description: 'Live monitoring highlights who is on track, who needs help, and where to pause.',
    detail: 'Teachers can focus support on the right learners before frustration builds.',
    icon: Users,
  },
  {
    title: 'Grade Faster With Better Feedback',
    description: 'Rubric-aligned grading keeps comments consistent and easy to share.',
    detail: 'Admins and teams get a clearer view of progress without extra spreadsheets.',
    icon: ShieldCheck,
  },
]

const IMPACT_POINTS = [
  {
    label: 'Teacher Prep Time',
    value: '-40%',
    note: 'AI-assisted setup and reusable templates reduce prep overhead.',
    icon: Clock3,
  },
  {
    label: 'Lab Completion Visibility',
    value: 'Live',
    note: 'Student status and stuck moments update while class is running.',
    icon: Activity,
  },
  {
    label: 'Instructional Insights',
    value: 'Actionable',
    note: 'Analytics surface trends by class, step, and rubric criteria.',
    icon: TrendingUp,
  },
]

const LIVE_TABS: Array<{ id: LiveTabId; label: string; description: string }> = [
  {
    id: 'teacher_monitor',
    label: 'Teacher Monitor',
    description: 'See classroom status updates as they happen.',
  },
  {
    id: 'student_runner',
    label: 'Student Workflow',
    description: 'Watch assignment progress from pre-lab to submission.',
  },
  {
    id: 'analytics',
    label: 'Analytics View',
    description: 'Track trends that inform reteaching and support.',
  },
]

const MONITOR_STUDENTS = ['Avery Johnson', 'Noah Patel', 'Emma Collins', 'Liam Brooks']
const STUDENT_STEPS = ['Pre-Lab', 'Step 1', 'Step 2', 'Reflection']
const ANALYTICS_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today']

const STATUS_CLASS: Record<MonitorStatus, string> = {
  on_track: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  needs_help: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  stuck: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
}

const STATUS_LABEL: Record<MonitorStatus, string> = {
  on_track: 'On Track',
  needs_help: 'Needs Help',
  stuck: 'Stuck',
}

export function LandingHome() {
  const [activeTab, setActiveTab] = useState<LiveTabId>('teacher_monitor')
  const [liveTick, setLiveTick] = useState(0)

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveTab((current) => {
        const index = LIVE_TABS.findIndex((tab) => tab.id === current)
        return LIVE_TABS[(index + 1) % LIVE_TABS.length].id
      })
    }, 7000)
    return () => window.clearInterval(timerId)
  }, [])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setLiveTick((value) => value + 1)
    }, 1900)
    return () => window.clearInterval(timerId)
  }, [])

  const monitorRows = useMemo(
    () =>
      MONITOR_STUDENTS.map((name, index) => {
        const cycle = (liveTick + index * 2) % 10
        let status: MonitorStatus = 'on_track'
        if (cycle > 6) status = 'needs_help'
        if (cycle > 8) status = 'stuck'
        const step = 2 + ((liveTick + index) % 3)
        const progress = Math.min(100, 36 + step * 13 + ((liveTick + index * 3) % 16))
        return { name, status, step, progress }
      }),
    [liveTick]
  )

  const monitorCounts = useMemo(
    () => ({
      onTrack: monitorRows.filter((row) => row.status === 'on_track').length,
      needsHelp: monitorRows.filter((row) => row.status === 'needs_help').length,
      stuck: monitorRows.filter((row) => row.status === 'stuck').length,
    }),
    [monitorRows]
  )

  const studentStepIndex = liveTick % STUDENT_STEPS.length
  const studentProgress = Math.min(98, 24 + studentStepIndex * 23 + ((liveTick + 1) % 5) * 4)
  const reflectionSeed =
    'The results supported our prediction — as the variable changed, the measured output shifted consistently across all trials.'
  const reflectionLength = Math.min(reflectionSeed.length, 28 + (liveTick % 8) * 10)
  const reflectionPreview = reflectionSeed.slice(0, reflectionLength)

  const analyticsBars = useMemo(
    () =>
      ANALYTICS_LABELS.map((label, index) => ({
        label,
        value: Math.min(98, 56 + index * 6 + ((liveTick + index) % 7)),
      })),
    [liveTick]
  )

  const avgCompletion = Math.round(
    analyticsBars.reduce((total, item) => total + item.value, 0) / analyticsBars.length
  )
  const avgFeedbackTurnaround = 11 - (liveTick % 3)
  const interventionAlerts = 2 + ((liveTick + 2) % 3)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_30%_0%,rgba(220,38,38,0.15),transparent_40%),linear-gradient(to_bottom,#000000,#0d0d0d_50%,#000000)] text-white">

      {/* Nav */}
      <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/icon.svg" alt="LabFlow logo" width={30} height={30} className="h-[30px] w-[30px] rounded-md" />
            <span className="text-base font-semibold tracking-tight">LabFlow</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#features" className="text-sm font-medium text-white/50 transition-colors hover:text-white">Features</a>
            <a href="#preview" className="text-sm font-medium text-white/50 transition-colors hover:text-white">Live Views</a>
            <Button
              variant="ghost"
              size="sm"
              className="border border-white/15 bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
              render={<Link href="/demo" />}
            >
              Watch Demo
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              render={<Link href="/demo/try" />}
            >
              Try it Live
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="grid gap-10 pb-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-400">
              Classroom Lab Manager
            </p>
            <h1 className="text-balance font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-5xl font-bold leading-[1.08] text-white sm:text-6xl">
              One place to plan, run, monitor, and assess classroom labs.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/55">
              LabFlow gives teachers, students, and school admins a single platform for AI-assisted lab creation, guided student workflows, live classroom monitoring, and performance analytics.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white border-0 gap-2"
                render={<Link href="/demo" />}
              >
                See Interactive Demo
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="border border-white/20 bg-transparent text-white/70 hover:bg-white/8 hover:text-white"
                render={<Link href="/demo/try" />}
              >
                Try it Live
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {IMPACT_POINTS.map((item, index) => (
                <motion.article
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 + index * 0.07 }}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <item.icon className="size-4 text-red-500" />
                  <p className="mt-2.5 text-sm font-medium text-white/60">{item.label}</p>
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/40">{item.note}</p>
                </motion.article>
              ))}
            </div>
          </motion.div>

          {/* Login */}
          <motion.div
            id="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.18 }}
            className="space-y-3 lg:sticky lg:top-6"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                <BarChart3 className="size-4 text-red-500" />
                Live Classroom Platform
              </p>
              <p className="mt-1 text-sm text-white/50">
                Sign in to continue with your classes, labs, and student progress.
              </p>
            </div>

            <LoginBox
              title="Sign In To LabFlow"
              description="Use your existing school account credentials."
              className="max-w-none"
            />
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="mt-20 space-y-6 pb-4">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-red-400">Features</p>
            <h2 className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-4xl font-bold text-white sm:text-5xl">
              What LabFlow does for your classroom
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Designed for teachers, students, and school admins who need clear lab workflows and better visibility into student progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURE_CARDS.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <feature.icon className="size-5 text-red-500" />
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-white/60">{feature.description}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/40">{feature.detail}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Live Views */}
        <section id="preview" className="mt-20 mb-20 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-400">Live Views</p>
              <h2 className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-3xl font-bold text-white sm:text-4xl">
                Real-time previews of how the app works
              </h2>
              <p className="mt-2 text-sm text-white/50">
                These views animate automatically to show the flows teachers and students see inside LabFlow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {LIVE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-red-500/50 bg-red-600 text-white'
                      : 'border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-3 text-sm text-white/40">
            {LIVE_TABS.find((tab) => tab.id === activeTab)?.description}
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {activeTab === 'teacher_monitor' && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3">
                        <p className="text-xs text-emerald-400">On Track</p>
                        <p className="text-2xl font-bold text-white">{monitorCounts.onTrack}</p>
                      </div>
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3">
                        <p className="text-xs text-amber-400">Needs Help</p>
                        <p className="text-2xl font-bold text-white">{monitorCounts.needsHelp}</p>
                      </div>
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 p-3">
                        <p className="text-xs text-rose-400">Stuck</p>
                        <p className="text-2xl font-bold text-white">{monitorCounts.stuck}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      {monitorRows.map((row) => (
                        <motion.article
                          key={row.name}
                          layout
                          transition={{ duration: 0.25 }}
                          className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{row.name}</p>
                              <p className="text-xs text-white/40">Step {row.step} of 5</p>
                            </div>
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[row.status]}`}>
                              {STATUS_LABEL[row.status]}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${row.progress}%` }}
                              className="h-full rounded-full bg-red-500"
                            />
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'student_runner' && (
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold text-white">Current Lab Assignment</p>
                      <p className="mt-1 text-xs text-white/40">
                        Progress updates as the student completes each step.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {STUDENT_STEPS.map((step, index) => {
                          const isComplete = index < studentStepIndex
                          const isActive = index === studentStepIndex
                          return (
                            <span
                              key={step}
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                isComplete
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                  : isActive
                                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                                    : 'border-white/10 bg-white/5 text-white/40'
                              }`}
                            >
                              {isComplete && <CheckCircle2 className="mr-1 inline size-3" />}
                              {step}
                            </span>
                          )
                        })}
                      </div>

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-xs text-white/40">
                          <span>Submission Progress</span>
                          <span>{studentProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${studentProgress}%` }}
                            className="h-full rounded-full bg-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                        Live Student Entry
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                          <p className="text-[11px] text-white/40">Trial Distance (cm)</p>
                          <p className="text-sm font-semibold text-white">{12 - (liveTick % 3)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                          <p className="text-[11px] text-white/40">Data Count (avg)</p>
                          <p className="text-sm font-semibold text-white">{18 + ((liveTick + 2) % 6)}</p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] text-white/40">Reflection</p>
                        <p className="mt-1 min-h-14 text-sm leading-relaxed text-white/70">
                          {reflectionPreview}
                          <span className="inline-block h-4 w-1 animate-pulse rounded bg-white/30 align-[-2px]" />
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold text-white">Weekly Completion Trend</p>
                      <div className="mt-4 flex h-44 items-end gap-2">
                        {analyticsBars.map((bar) => (
                          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                            <div className="relative flex h-36 w-full items-end rounded-md bg-white/8">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${bar.value}%` }}
                                className="w-full rounded-md bg-gradient-to-t from-red-600 to-red-400"
                              />
                            </div>
                            <span className="text-xs text-white/40">{bar.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs text-white/40">Average Completion</p>
                        <p className="mt-1 text-3xl font-bold text-white">{avgCompletion}%</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs text-white/40">Feedback Turnaround</p>
                        <p className="mt-1 text-3xl font-bold text-white">{avgFeedbackTurnaround} min</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs text-white/40">Intervention Alerts</p>
                        <p className="mt-1 text-3xl font-bold text-white">{interventionAlerts}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  )
}
