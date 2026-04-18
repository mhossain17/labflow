'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MoonStar, Palette, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

interface BrandPreset {
  name: string
  logo: string
  primary: string
  secondary: string
}

const BRAND_PRESETS: BrandPreset[] = [
  {
    name: 'LabFlow Default',
    logo: 'LF',
    primary: '#2563eb',
    secondary: '#14b8a6',
  },
  {
    name: 'North Valley Science',
    logo: 'NV',
    primary: '#0ea5e9',
    secondary: '#22c55e',
  },
  {
    name: 'STEM Academy Network',
    logo: 'SA',
    primary: '#f97316',
    secondary: '#a855f7',
  },
]

export function AdminBrandingSection() {
  const [presetIndex, setPresetIndex] = useState(0)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Timed updates illustrate admin branding changes without touching real org settings.
    const timers: number[] = []
    const schedule = (delayMs: number, callback: () => void) => {
      const timerId = window.setTimeout(callback, delayMs)
      timers.push(timerId)
    }

    schedule(1300, () => setPresetIndex(1))
    schedule(3000, () => setDarkMode(true))
    schedule(4600, () => setPresetIndex(2))
    schedule(6300, () => setDarkMode(false))

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId))
    }
  }, [])

  const activePreset = BRAND_PRESETS[presetIndex]

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Section 7: Admin Branding Panel
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">Live Brand Personalization</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Administrators can update branding and theme preferences so the platform reflects local
          school identity during demos and rollout.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="size-4 text-primary" />
              Branding Controls
            </CardTitle>
            <CardDescription className="text-slate-300">
              Organization-level appearance settings (simulated).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Logo & Color Preset
              </p>
              <div className="grid gap-2">
                {BRAND_PRESETS.map((preset, index) => (
                  <motion.div
                    key={preset.name}
                    layout
                    className={`flex items-center justify-between rounded-xl border p-3 ${
                      index === presetIndex
                        ? 'border-primary/70 bg-primary/15'
                        : 'border-slate-700 bg-slate-950/65'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="grid size-8 place-items-center rounded-md text-xs font-semibold text-white"
                        style={{ backgroundColor: preset.primary }}
                      >
                        {preset.logo}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{preset.name}</p>
                        <p className="text-xs text-slate-300">
                          Primary {preset.primary} • Secondary {preset.secondary}
                        </p>
                      </div>
                    </div>
                    {index === presetIndex && <Badge className="bg-slate-700 text-slate-100">Active</Badge>}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/65 p-3">
              <div>
                <p className="text-sm font-semibold">Dark Mode Preview</p>
                <p className="text-xs text-slate-300">Toggle classroom UI contrast mode</p>
              </div>
              <div className="inline-flex items-center gap-2">
                <MoonStar className="size-4 text-slate-300" />
                <Switch checked={darkMode} onCheckedChange={() => {}} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-sky-300" />
              Live UI Preview
            </CardTitle>
            <CardDescription className="text-slate-300">
              Branding updates propagate instantly across teacher and student surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              layout
              transition={{ duration: 0.35 }}
              className={`rounded-2xl border p-4 ${
                darkMode
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-100'
                  : 'border-zinc-200 bg-white text-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <motion.div
                    layout
                    className="grid size-9 place-items-center rounded-md text-xs font-semibold text-white"
                    style={{ backgroundColor: activePreset.primary }}
                  >
                    {activePreset.logo}
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold">{activePreset.name}</p>
                    <p className="text-xs text-muted-foreground dark:text-zinc-400">
                      LabFlow AI district workspace
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300">Admin View</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <motion.div
                  layout
                  className="rounded-xl p-3 text-white"
                  style={{ backgroundColor: activePreset.primary }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">Primary Action</p>
                  <p className="mt-1 text-sm">Create New Lab</p>
                </motion.div>
                <motion.div
                  layout
                  className="rounded-xl p-3 text-white"
                  style={{ backgroundColor: activePreset.secondary }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide">Secondary Action</p>
                  <p className="mt-1 text-sm">Open Analytics</p>
                </motion.div>
              </div>

              <div className="mt-3 rounded-xl border border-border/50 p-3 text-sm dark:border-zinc-700">
                Theme mode: <span className="font-medium">{darkMode ? 'Dark' : 'Light'}</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
