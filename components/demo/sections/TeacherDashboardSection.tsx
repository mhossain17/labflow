'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CircleFadingArrowUp, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type MonitorStatus = 'on_track' | 'need_help' | 'stuck' | 'finished_step'

interface DemoStudent {
  id: string
  name: string
  step: number
  status: MonitorStatus
}

const INITIAL_STUDENTS: DemoStudent[] = [
  { id: 's1', name: 'Avery Johnson', step: 2, status: 'on_track' },
  { id: 's2', name: 'Riley Martinez', step: 3, status: 'need_help' },
  { id: 's3', name: 'Noah Patel', step: 2, status: 'on_track' },
  { id: 's4', name: 'Emma Collins', step: 3, status: 'on_track' },
  { id: 's5', name: 'Liam Brooks', step: 2, status: 'on_track' },
  { id: 's6', name: 'Sofia Chen', step: 3, status: 'finished_step' },
  { id: 's7', name: 'Maya Turner', step: 3, status: 'on_track' },
  { id: 's8', name: 'Ethan Rivera', step: 2, status: 'on_track' },
]

const TOTAL_STEPS = 5

const STATUS_STYLE: Record<MonitorStatus, string> = {
  on_track: 'bg-green-500/20 text-green-200',
  need_help: 'bg-amber-500/20 text-amber-200',
  stuck: 'bg-red-500/20 text-red-200',
  finished_step: 'bg-blue-500/20 text-blue-200',
}

const STATUS_LABEL: Record<MonitorStatus, string> = {
  on_track: 'On Track',
  need_help: 'Need Help',
  stuck: 'Stuck',
  finished_step: 'Finished Step',
}

function updateStudent(
  students: DemoStudent[],
  studentId: string,
  updates: Partial<DemoStudent>
): DemoStudent[] {
  return students.map((student) =>
    student.id === studentId ? { ...student, ...updates } : student
  )
}

export function TeacherDashboardSection() {
  const [students, setStudents] = useState<DemoStudent[]>(INITIAL_STUDENTS)
  const [livePulse, setLivePulse] = useState(false)

  useEffect(() => {
    // Scripted class updates emulate real-time monitoring events for presentation demos.
    const timers: number[] = []
    const schedule = (delayMs: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delayMs)
      timers.push(timerId)
    }

    schedule(600, () => setLivePulse(true))

    schedule(1200, () => {
      setStudents((current) => updateStudent(current, 's1', { step: 3 }))
      setStudents((current) => updateStudent(current, 's3', { step: 3 }))
    })

    schedule(2200, () => {
      setStudents((current) => updateStudent(current, 's7', { status: 'stuck', step: 3 }))
    })

    schedule(3200, () => {
      setStudents((current) => updateStudent(current, 's2', { status: 'stuck', step: 3 }))
      setStudents((current) => updateStudent(current, 's4', { status: 'stuck', step: 3 }))
      setStudents((current) => updateStudent(current, 's5', { status: 'stuck', step: 3 }))
    })

    schedule(4800, () => {
      setStudents((current) => updateStudent(current, 's6', { step: 4, status: 'on_track' }))
      setStudents((current) => updateStudent(current, 's8', { step: 3, status: 'on_track' }))
    })

    schedule(5600, () => setLivePulse(false))

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const stuckOnStep3 = useMemo(
    () => students.filter((student) => student.status === 'stuck' && student.step === 3).length,
    [students]
  )
  const onTrack = students.filter((student) => student.status === 'on_track').length
  const needHelp = students.filter((student) => student.status === 'need_help').length
  const stuck = students.filter((student) => student.status === 'stuck').length

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 5: Teacher Dashboard
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Live Classroom Monitoring</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Multiple student statuses update in real time so educators can quickly identify who
          needs intervention and where learning friction appears.
        </p>
      </div>

      <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Biology Period 3 • Live Monitor
              </CardTitle>
              <CardDescription className="text-slate-300">
                Lab: Photosynthesis Through Light Intensity
              </CardDescription>
            </div>
            <motion.div
              animate={livePulse ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: livePulse ? Infinity : 0 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-green-400/40 bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-200"
            >
              <CircleFadingArrowUp className="size-3.5" />
              Live updates
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-green-500/30 bg-green-500/15 p-3">
              <p className="text-xs text-green-200/80">On Track</p>
              <p className="text-2xl font-semibold text-green-100">{onTrack}</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-3">
              <p className="text-xs text-amber-200/80">Need Help</p>
              <p className="text-2xl font-semibold text-amber-100">{needHelp}</p>
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-3">
              <p className="text-xs text-red-200/80">Stuck</p>
              <p className="text-2xl font-semibold text-red-100">{stuck}</p>
            </div>
          </div>

          <AnimatePresence>
            {stuckOnStep3 >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-red-500/35 bg-red-500/15 px-4 py-3 text-sm text-red-100"
              >
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="size-4" />
                  4 students are stuck on Step 3
                </p>
                <p className="mt-1">
                  Suggested action: pause class and model one complete Step 3 interpretation
                  example.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {students.map((student) => {
              const progress = Math.min((student.step / TOTAL_STEPS) * 100, 100)
              return (
                <motion.div
                  key={student.id}
                  layout
                  transition={{ duration: 0.3 }}
                  className="rounded-xl border border-slate-700 bg-slate-950/65 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{student.name}</p>
                    <Badge className={STATUS_STYLE[student.status]}>{STATUS_LABEL[student.status]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    Step {student.step} of {TOTAL_STEPS}
                  </p>
                  <div className="mt-2">
                    <Progress value={progress} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
