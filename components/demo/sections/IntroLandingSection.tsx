'use client'

import { motion } from 'framer-motion'
import { Sparkles, PlayCircle, GraduationCap, ChartLine } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IntroLandingSectionProps {
  onStartDemo: () => void
}

export function IntroLandingSection({ onStartDemo }: IntroLandingSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-8 md:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.18),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(20,184,166,0.2),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.16),transparent_45%)]" />

      <div className="relative space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          <Sparkles className="size-3.5" />
          Interactive Product Demo
        </motion.div>

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="text-balance text-4xl font-bold tracking-tight md:text-5xl"
          >
            LabFlow AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55 }}
            className="max-w-3xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            A guided, presentation-ready walkthrough that demonstrates how teachers build labs
            with AI, how students progress in real time, and how school leaders measure impact.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="flex flex-wrap items-center gap-3"
        >
          <Button size="lg" className="gap-2 px-5" onClick={onStartDemo}>
            <PlayCircle className="size-4.5" />
            Start Demo
          </Button>
          <p className="text-sm text-muted-foreground">
            Simulated data only. No real classes or student records are queried.
          </p>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: 'Teacher Workflow',
              description: 'From prompt to ready-to-teach lab plans in minutes.',
              icon: GraduationCap,
            },
            {
              title: 'Student Guidance',
              description: 'Step-by-step support with status awareness and help flows.',
              icon: Sparkles,
            },
            {
              title: 'Live Insight',
              description: 'Classroom analytics that spotlight where students get stuck.',
              icon: ChartLine,
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + index * 0.08, duration: 0.35 }}
              className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur"
            >
              <item.icon className="mb-2 size-4 text-primary" />
              <h2 className="text-sm font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
