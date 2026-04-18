'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartColumnBig, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsSnapshot {
  completionSeries: Array<{ day: string; completed: number }>
  stuckByStep: Array<{ step: string; count: number }>
  completionRate: number
  avgTimeMin: number
}

const SNAPSHOTS: AnalyticsSnapshot[] = [
  {
    completionSeries: [
      { day: 'Mon', completed: 38 },
      { day: 'Tue', completed: 42 },
      { day: 'Wed', completed: 47 },
      { day: 'Thu', completed: 52 },
      { day: 'Fri', completed: 56 },
    ],
    stuckByStep: [
      { step: 'Step 1', count: 3 },
      { step: 'Step 2', count: 6 },
      { step: 'Step 3', count: 11 },
      { step: 'Step 4', count: 4 },
    ],
    completionRate: 63,
    avgTimeMin: 44,
  },
  {
    completionSeries: [
      { day: 'Mon', completed: 42 },
      { day: 'Tue', completed: 48 },
      { day: 'Wed', completed: 55 },
      { day: 'Thu', completed: 61 },
      { day: 'Fri', completed: 67 },
    ],
    stuckByStep: [
      { step: 'Step 1', count: 2 },
      { step: 'Step 2', count: 5 },
      { step: 'Step 3', count: 8 },
      { step: 'Step 4', count: 3 },
    ],
    completionRate: 74,
    avgTimeMin: 40,
  },
  {
    completionSeries: [
      { day: 'Mon', completed: 48 },
      { day: 'Tue', completed: 56 },
      { day: 'Wed', completed: 63 },
      { day: 'Thu', completed: 71 },
      { day: 'Fri', completed: 79 },
    ],
    stuckByStep: [
      { step: 'Step 1', count: 1 },
      { step: 'Step 2', count: 3 },
      { step: 'Step 3', count: 4 },
      { step: 'Step 4', count: 2 },
    ],
    completionRate: 86,
    avgTimeMin: 35,
  },
]

export function AnalyticsImpactSection() {
  const [snapshotIndex, setSnapshotIndex] = useState(0)

  useEffect(() => {
    // Data snapshots animate impact over time without any backend dependencies.
    const timers: number[] = []
    const schedule = (delayMs: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delayMs)
      timers.push(timerId)
    }

    schedule(1500, () => setSnapshotIndex(1))
    schedule(3200, () => setSnapshotIndex(2))

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const snapshot = SNAPSHOTS[snapshotIndex]
  const step3Count = snapshot.stuckByStep.find((item) => item.step === 'Step 3')?.count ?? 0

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 8: Analytics / Impact
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Outcome Storytelling with Data</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Administrators and instructional leaders can watch progress and friction points evolve as
          teachers intervene and students receive AI-guided support.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Student Progress Trend
            </CardTitle>
            <CardDescription className="text-slate-300">
              Completed lab runs across the school week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshot.completionSeries} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #334155',
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [value, 'Completed labs']}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={700}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                key={`completion-${snapshot.completionRate}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-700 bg-slate-950/65 p-3"
              >
                <p className="text-xs text-slate-300">Lab completion rate</p>
                <p className="text-2xl font-semibold text-slate-100">{snapshot.completionRate}%</p>
              </motion.div>
              <motion.div
                key={`time-${snapshot.avgTimeMin}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-700 bg-slate-950/65 p-3"
              >
                <p className="text-xs text-slate-300">Avg completion time</p>
                <p className="text-2xl font-semibold text-slate-100">{snapshot.avgTimeMin} min</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartColumnBig className="size-4 text-sky-300" />
              Stuck Point Analysis
            </CardTitle>
            <CardDescription className="text-slate-300">
              Where students needed intervention most often
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snapshot.stuckByStep} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="step"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    allowDecimals={false}
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #334155',
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [value, 'Students stuck']}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <motion.div
              key={`insight-${snapshotIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-900/70 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
            >
              <p className="font-semibold">Impact Insight</p>
              <p className="mt-1">
                Step 3 stuck count is now <strong>{step3Count}</strong>, down from 11 after teacher
                intervention plus AI guided support.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
