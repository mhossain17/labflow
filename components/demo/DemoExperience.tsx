'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { DEMO_PERSONAS, type DemoPersona } from '@/lib/demo/accounts'

const LAST_SECTION_INDEX = DEMO_SECTIONS.length - 1

export function DemoExperience() {
  // Demo progression is fully local state-driven with timed transitions.
  const router = useRouter()
  const [sectionIndex, setSectionIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const [switchError, setSwitchError] = useState<string | null>(null)

  const [selectedRole, setSelectedRole] = useState<DemoPersona['role']>('student')
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    DEMO_PERSONAS.find((persona) => persona.role === 'student')?.id ?? ''
  )

  const currentSection = DEMO_SECTIONS[sectionIndex]
  const personasForRole = DEMO_PERSONAS.filter((persona) => persona.role === selectedRole)
  const selectedPersona =
    personasForRole.find((persona) => persona.id === selectedPersonaId) ?? personasForRole[0]

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

  async function handleSwitchDemoUser() {
    if (!selectedPersona) return
    setSwitchError(null)
    setSwitchingId(selectedPersona.id)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: selectedPersona.email,
      password: selectedPersona.password,
    })

    if (error) {
      setSwitchError(`Could not switch to ${selectedPersona.email}. Check demo seed data.`)
      setSwitchingId(null)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(20,184,166,0.1),transparent_28%),linear-gradient(to_bottom,#0b1220,#111827_40%,#0b1220)] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <section className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[190px]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                DEMO - Switch User
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pick a role and user persona.
              </p>
            </div>

            <label className="min-w-[170px] flex-1 space-y-1">
              <span className="text-xs text-muted-foreground">Role</span>
              <select
                value={selectedRole}
                onChange={(event) => {
                  const nextRole = event.target.value as DemoPersona['role']
                  setSelectedRole(nextRole)
                  const nextPersona = DEMO_PERSONAS.find((persona) => persona.role === nextRole)
                  setSelectedPersonaId(nextPersona?.id ?? '')
                }}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="school_admin">School Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </label>

            <label className="min-w-[260px] flex-[1.3] space-y-1">
              <span className="text-xs text-muted-foreground">User</span>
              <select
                value={selectedPersona?.id ?? ''}
                onChange={(event) => setSelectedPersonaId(event.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
              >
                {personasForRole.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.label}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              className="min-w-[140px]"
              disabled={!selectedPersona || switchingId !== null}
              onClick={() => void handleSwitchDemoUser()}
            >
              {switchingId ? 'Switching...' : 'Switch User'}
            </Button>
          </div>
          {switchError && (
            <p className="mt-2 text-xs text-destructive">{switchError}</p>
          )}
        </section>

        <header className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                LabFlow AI Demo Mode
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                Guided Interactive Walkthrough
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {implementedCount} of {DEMO_SECTIONS.length} sections are fully interactive with
                simulated workflows, transitions, and presentation-ready storytelling.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <Switch checked={autoplay} onCheckedChange={setAutoplay} />
                Autoplay
              </label>
              <Button variant="outline" className="gap-1.5" onClick={() => setAutoplay((v) => !v)}>
                {autoplay ? <Pause className="size-4" /> : <Play className="size-4" />}
                {autoplay ? 'Pause' : 'Play'}
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={handleReset}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
              <Button className="gap-1.5" onClick={handleNextStep}>
                <SkipForward className="size-4" />
                Next Step
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border/70 bg-card/75 p-4 backdrop-blur">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Demo Timeline
            </h2>
            <ol className="space-y-2">
              {DEMO_SECTIONS.map((section, index) => {
                const isActive = index === sectionIndex
                const isPast = index < sectionIndex
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setSectionIndex(index)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/10'
                          : isPast
                            ? 'border-border bg-muted/40'
                            : 'border-border/70 bg-background/80 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            {section.label}
                          </p>
                          <p className="text-sm font-semibold leading-tight">{section.title}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            section.implemented
                              ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
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
      </div>
    </main>
  )
}
