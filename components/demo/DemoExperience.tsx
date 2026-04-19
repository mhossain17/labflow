'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { DEMO_SECTIONS } from './demo-sections'
import { IntroLandingSection } from './sections/IntroLandingSection'
import { TeacherLabCreationSection } from './sections/TeacherLabCreationSection'
import { StudentExperienceSection } from './sections/StudentExperienceSection'
import { StudentGetsStuckSection } from './sections/StudentGetsStuckSection'
import { TeacherDashboardSection } from './sections/TeacherDashboardSection'
import { RubricGradingSection } from './sections/RubricGradingSection'
import { AdminBrandingSection } from './sections/AdminBrandingSection'
import { AnalyticsImpactSection } from './sections/AnalyticsImpactSection'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

const LAST_SECTION_INDEX = DEMO_SECTIONS.length - 1

export function DemoExperience() {
  const [sectionIndex, setSectionIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(false)

  const currentSection = DEMO_SECTIONS[sectionIndex]

  useEffect(() => {
    if (!autoplay) return
    if (sectionIndex === 0) return
    if (sectionIndex >= LAST_SECTION_INDEX) return

    const timerId = window.setTimeout(() => {
      setSectionIndex((prev) => Math.min(prev + 1, LAST_SECTION_INDEX))
    }, currentSection.autoAdvanceMs)

    return () => window.clearTimeout(timerId)
  }, [autoplay, currentSection.autoAdvanceMs, sectionIndex])

  const implementedCount = useMemo(
    () => DEMO_SECTIONS.filter((section) => section.implemented).length,
    []
  )

  function handleStartDemo() {
    setSectionIndex(1)
    setAutoplay(true)
  }

  function handleNextStep() {
    setSectionIndex((prev) => {
      if (prev === 0) return 1
      return Math.min(prev + 1, LAST_SECTION_INDEX)
    })
  }

  function handleReset() {
    setAutoplay(false)
    setSectionIndex(0)
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(220,38,38,0.12),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(180,0,0,0.08),transparent_28%),linear-gradient(to_bottom,#000000,#111111_40%,#000000)] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1300px] space-y-6">

        {/* Top navigation bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white/70 transition-colors hover:text-white">
              <Image src="/icon.svg" alt="LabFlow" width={28} height={28} className="h-7 w-7 rounded-md" />
              <span className="text-sm font-semibold tracking-tight">LabFlow</span>
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-sm font-medium text-white/60">Interactive Demo</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-white/60 hover:text-white hover:bg-white/10"
              render={<Link href="/" />}
            >
              <ArrowLeft className="size-3.5" />
              Back to Home
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0"
              render={<Link href="/demo/try" />}
            >
              Try it Live
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </header>

        {/* Demo header / controls */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-400">
                Guided Walkthrough
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                LabFlow in Action
              </h1>
              <p className="mt-2 text-sm text-white/50">
                {implementedCount} interactive sections — teacher, student, and admin workflows.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                <Switch checked={autoplay} onCheckedChange={setAutoplay} />
                Autoplay
              </label>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setAutoplay((v) => !v)}
              >
                {autoplay ? <Pause className="size-4" /> : <Play className="size-4" />}
                {autoplay ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={handleReset}
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0"
                onClick={handleNextStep}
              >
                <SkipForward className="size-4" />
                Next Step
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Timeline sidebar */}
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              Demo Timeline
            </h2>
            <ol className="space-y-1.5">
              {DEMO_SECTIONS.map((section, index) => {
                const isActive = index === sectionIndex
                const isPast = index < sectionIndex
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setSectionIndex(index)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                        isActive
                          ? 'border-red-500/50 bg-red-500/10'
                          : isPast
                            ? 'border-white/10 bg-white/5 opacity-60'
                            : 'border-white/8 bg-white/3 hover:bg-white/8 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-xs font-medium ${isActive ? 'text-red-400' : 'text-white/40'}`}>
                            {section.label}
                          </p>
                          <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-white' : 'text-white/70'}`}>
                            {section.title}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            section.implemented
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {section.implemented ? 'Live' : 'Scaffold'}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>
          </aside>

          {/* Main content */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {currentSection.id === 'intro' && <IntroLandingSection onStartDemo={handleStartDemo} />}
                {currentSection.id === 'teacher_lab_creation' && <TeacherLabCreationSection />}
                {currentSection.id === 'student_experience' && <StudentExperienceSection />}
                {currentSection.id === 'student_gets_stuck' && <StudentGetsStuckSection />}
                {currentSection.id === 'teacher_dashboard' && <TeacherDashboardSection />}
                {currentSection.id === 'rubric_grading' && <RubricGradingSection />}
                {currentSection.id === 'admin_branding' && <AdminBrandingSection />}
                {currentSection.id === 'analytics_impact' && <AnalyticsImpactSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
          <p className="text-sm font-medium text-white/60">Ready to explore the real app?</p>
          <p className="mt-1 text-lg font-semibold text-white">Log in as a teacher, student, or admin — no setup needed.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              render={<Link href="/demo/try" />}
            >
              Try it Live
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              render={<Link href="/" />}
            >
              Back to Home
            </Button>
          </div>
        </div>

      </div>
    </main>
  )
}
