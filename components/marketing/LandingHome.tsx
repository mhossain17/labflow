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
  FlaskConical,
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
    icon: FlaskConical,
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
const STUDENT_STEPS = ['Pre-Lab', 'Step 1 Data', 'Step 2 Data', 'Reflection']
const ANALYTICS_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today']

const STATUS_CLASS: Record<MonitorStatus, string> = {
  on_track: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  needs_help: 'border-amber-200 bg-amber-50 text-amber-700',
  stuck: 'border-rose-200 bg-rose-50 text-rose-700',
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
    'Our evidence shows oxygen production increased as the lamp moved closer, which supports the hypothesis.'
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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#1e293b_0%,#0b1220_42%,#020617_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ y: [0, -14, 0], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-500/18 blur-3xl"
          animate={{ y: [0, 16, 0], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/icon.svg"
              alt="LabFlow logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg"
            />
            <span className="text-lg font-semibold tracking-tight">LabFlow</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#preview"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Live Views
            </a>
            <Button variant="outline" render={<Link href="/demo" />}>
              Watch Full Demo
            </Button>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="rounded-3xl border border-sky-100 bg-white/78 p-6 shadow-xl shadow-sky-900/5 backdrop-blur sm:p-8"
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
              Classroom Lab Manager
            </p>
            <h1 className="text-balance font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-4xl leading-tight font-semibold text-slate-900 sm:text-5xl">
              One place to plan, run, monitor, and assess science labs.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              LabFlow helps schools run stronger lab instruction by combining AI lab creation,
              student workflow support, real-time classroom monitoring, and performance analytics
              into a single platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/demo" />}>
                See Interactive Demo
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg" render={<a href="#preview" />}>
                Explore Live Views
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {IMPACT_POINTS.map((item) => (
                <motion.article
                  key={item.label}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-slate-200 bg-white/85 p-4"
                >
                  <item.icon className="size-4 text-sky-700" />
                  <p className="mt-2 text-sm font-medium text-slate-600">{item.label}</p>
                  <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.note}</p>
                </motion.article>
              ))}
            </div>
          </motion.div>

          <motion.div
            id="login"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            className="space-y-4 lg:sticky lg:top-6"
          >
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-4">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-900">
                <BarChart3 className="size-4" />
                Live Classroom Platform
              </p>
              <p className="mt-1 text-sm text-sky-800/80">
                Sign in to continue with your classes, labs, and student progress.
              </p>
            </div>

            <LoginBox
              title="Sign In To LabFlow"
              description="Use your existing school account credentials."
              forceBlackText
              className="max-w-none border-slate-200/90 bg-white/90 shadow-xl shadow-sky-900/10 backdrop-blur"
            />
          </motion.div>
        </section>

        <section id="features" className="mt-16 space-y-4">
          <div className="max-w-3xl">
            <h2 className="font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-3xl font-semibold text-slate-100 sm:text-4xl">
              What LabFlow does for your classroom
            </h2>
            <p className="mt-3 text-slate-300">
              Designed for teachers, students, and school admins who need clear lab workflows and
              better visibility into student progress.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURE_CARDS.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.05 }}
                className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm"
              >
                <feature.icon className="size-5 text-sky-700" />
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{feature.description}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{feature.detail}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section
          id="preview"
          className="mt-16 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-xl shadow-sky-900/5 sm:p-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">
                Live Views
              </p>
              <h2 className="mt-1 font-['Iowan_Old_Style','Palatino_Linotype','Book_Antiqua',serif] text-3xl font-semibold text-slate-900">
                Real-time previews of how the app works
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                These views animate automatically to show the same types of flows teachers and
                students see inside LabFlow.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {LIVE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            {LIVE_TABS.find((tab) => tab.id === activeTab)?.description}
          </p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
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
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-700">On Track</p>
                        <p className="text-2xl font-semibold text-emerald-800">
                          {monitorCounts.onTrack}
                        </p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-700">Needs Help</p>
                        <p className="text-2xl font-semibold text-amber-800">
                          {monitorCounts.needsHelp}
                        </p>
                      </div>
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <p className="text-xs text-rose-700">Stuck</p>
                        <p className="text-2xl font-semibold text-rose-800">{monitorCounts.stuck}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      {monitorRows.map((row) => (
                        <motion.article
                          key={row.name}
                          layout
                          transition={{ duration: 0.25 }}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                              <p className="text-xs text-slate-500">Step {row.step} of 5</p>
                            </div>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                                STATUS_CLASS[row.status]
                              }`}
                            >
                              {STATUS_LABEL[row.status]}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${row.progress}%` }}
                              className="h-full rounded-full bg-sky-500"
                            />
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'student_runner' && (
                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Photosynthesis Lab Assignment
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
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
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : isActive
                                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                                    : 'border-slate-200 bg-white text-slate-500'
                              }`}
                            >
                              {isComplete && <CheckCircle2 className="mr-1 inline size-3" />}
                              {step}
                            </span>
                          )
                        })}
                      </div>

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                          <span>Submission Progress</span>
                          <span>{studentProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${studentProgress}%` }}
                            className="h-full rounded-full bg-cyan-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Live Student Entry
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                          <p className="text-[11px] text-slate-500">Light Distance (cm)</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {12 - (liveTick % 3)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                          <p className="text-[11px] text-slate-500">Bubble Count / min</p>
                          <p className="text-sm font-semibold text-slate-900">
                            {18 + ((liveTick + 2) % 6)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">Reflection</p>
                        <p className="mt-1 min-h-14 text-sm leading-relaxed text-slate-700">
                          {reflectionPreview}
                          <span className="inline-block h-4 w-1 animate-pulse rounded bg-slate-400/70 align-[-2px]" />
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Weekly Completion Trend
                      </p>
                      <div className="mt-4 flex h-44 items-end gap-2">
                        {analyticsBars.map((bar) => (
                          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                            <div className="relative flex h-36 w-full items-end rounded-md bg-slate-100">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${bar.value}%` }}
                                className="w-full rounded-md bg-gradient-to-t from-sky-500 to-cyan-400"
                              />
                            </div>
                            <span className="text-xs text-slate-500">{bar.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Average Completion</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">
                          {avgCompletion}%
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Feedback Turnaround</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">
                          {avgFeedbackTurnaround} min
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs text-slate-500">Current Intervention Alerts</p>
                        <p className="mt-1 text-3xl font-semibold text-slate-900">
                          {interventionAlerts}
                        </p>
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
