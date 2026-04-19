'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, GraduationCap, ShieldCheck, UserCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_PERSONAS } from '@/lib/demo/accounts'
import { Button } from '@/components/ui/button'

const ROLE_CONFIG = [
  {
    role: 'school_admin' as const,
    icon: ShieldCheck,
    label: 'School Admin',
    headline: 'Manage the whole school',
    description:
      'Customize branding, toggle feature flags, manage users, and review org-wide settings. The admin view covers how LabFlow operates at the district level.',
    accentClass: 'border-gray-400/30 hover:border-gray-300/60',
    iconClass: 'text-gray-300',
    badgeClass: 'bg-gray-500/20 text-gray-300',
  },
  {
    role: 'teacher' as const,
    icon: GraduationCap,
    label: 'Teacher',
    headline: 'Build labs & monitor class',
    description:
      'Create an AI-generated lab, assign it to a class, and watch students progress in real time. Use the rubric grader and analytics to close feedback loops.',
    accentClass: 'border-red-500/40 hover:border-red-400/70',
    iconClass: 'text-red-400',
    badgeClass: 'bg-red-500/20 text-red-300',
  },
  {
    role: 'student' as const,
    icon: UserCircle2,
    label: 'Student',
    headline: 'Complete a lab assignment',
    description:
      'Walk through a real lab run — answer pre-lab questions, record data, get AI guidance when stuck, and submit your reflection.',
    accentClass: 'border-white/20 hover:border-white/40',
    iconClass: 'text-white/70',
    badgeClass: 'bg-white/10 text-white/60',
  },
]

export function DemoTryLive() {
  const router = useRouter()
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function enterAs(role: 'school_admin' | 'teacher' | 'student') {
    setError(null)
    setLoadingRole(role)

    const persona = DEMO_PERSONAS.find((p) => p.role === role)
    if (!persona) {
      setError('Demo persona not found.')
      setLoadingRole(null)
      return
    }

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: persona.email,
      password: persona.password,
    })

    if (authError) {
      setError(
        `Could not sign in as ${persona.label}. Make sure demo seed accounts have been created.`
      )
      setLoadingRole(null)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_30%_0%,rgba(220,38,38,0.15),transparent_40%),linear-gradient(to_bottom,#000000,#0d0d0d_50%,#000000)] px-4 py-10 md:px-8 md:py-14">

      {/* Header */}
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/50 transition-colors hover:text-white">
            <Image src="/icon.svg" alt="LabFlow" width={24} height={24} className="h-6 w-6 rounded" />
            <span className="text-sm font-semibold">LabFlow</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-white/40 hover:text-white hover:bg-white/8"
            render={<Link href="/" />}
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-10 text-center"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-400">
            Live Demo
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Try LabFlow Live
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/50">
            Pick a role to enter the app with real demo data. No account or setup needed.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLE_CONFIG.map((config, index) => {
            const Icon = config.icon
            const isLoading = loadingRole === config.role
            return (
              <motion.div
                key={config.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.08 }}
              >
                <button
                  type="button"
                  disabled={loadingRole !== null}
                  onClick={() => void enterAs(config.role)}
                  className={`group w-full rounded-2xl border bg-white/5 p-6 text-left transition-all duration-200 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-60 ${config.accentClass}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5`}>
                      <Icon className={`size-5 ${config.iconClass}`} />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${config.badgeClass}`}>
                      {config.label}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold text-white">{config.headline}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{config.description}</p>

                  <div className="mt-5 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span className="text-sm font-medium text-white/60">Signing in…</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-white/70 transition-colors group-hover:text-white">
                          Enter as {config.label}
                        </span>
                        <ArrowRight className="size-4 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
                      </>
                    )}
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Footer links */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-white/30">
          <Link href="/demo" className="transition-colors hover:text-white/60">
            Watch the guided walkthrough instead
          </Link>
          <span>·</span>
          <Link href="/login" className="transition-colors hover:text-white/60">
            Sign in with your own account
          </Link>
        </div>
      </div>
    </main>
  )
}
