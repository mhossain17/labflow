'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { StudentRunSnapshot } from '@/features/monitoring/realtime'
import type { EscalatedHelpRequest } from '@/types/app'
import type { LabStepSummary } from './StudentDetailSheet'
import { MonitorGrid } from './MonitorGrid'
import { MonitorStats } from './MonitorStats'
import { HelpRequestPanel } from './HelpRequestPanel'
import { StudentDetailSheet } from './StudentDetailSheet'
import { ClassDataOverview } from './ClassDataOverview'
import { Leaderboard } from './Leaderboard'
import { Badge } from '@/components/ui/badge'
import { Radio, ChevronDown } from 'lucide-react'

interface AssignmentSummary {
  id: string
  classId: string
  className: string
  classPeriod: string | null
}

interface MonitorDashboardProps {
  labId: string
  labTitle: string
  assignmentId: string
  selectedClassId: string
  assignments: AssignmentSummary[]
  totalSteps: number
  labSteps: LabStepSummary[]
  initialRuns: StudentRunSnapshot[]
  initialEscalatedHelp: EscalatedHelpRequest[]
}

type Tab = 'live' | 'data' | 'leaderboard'

export function MonitorDashboard({
  labId,
  labTitle,
  assignmentId,
  selectedClassId,
  assignments,
  totalSteps,
  labSteps,
  initialRuns,
  initialEscalatedHelp,
}: MonitorDashboardProps) {
  const router = useRouter()
  const [runs, setRuns] = useState<Map<string, StudentRunSnapshot>>(() => {
    const map = new Map<string, StudentRunSnapshot>()
    initialRuns.forEach(r => map.set(r.student_id, r))
    return map
  })
  const [escalatedHelp, setEscalatedHelp] = useState<EscalatedHelpRequest[]>(initialEscalatedHelp)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedHelp, setSelectedHelp] = useState<EscalatedHelpRequest | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newEscalationAlert, setNewEscalationAlert] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('live')
  const [selectedRun, setSelectedRun] = useState<StudentRunSnapshot | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const runsChannel = supabase
      .channel(`monitor:assignment:${assignmentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'student_lab_runs', filter: `assignment_id=eq.${assignmentId}` },
        (payload) => {
          setRuns(prev => {
            const next = new Map(prev)
            for (const [key, run] of next.entries()) {
              if (run.id === payload.new.id) {
                next.set(key, {
                  ...run,
                  current_step: payload.new.current_step,
                  status: payload.new.status,
                  quick_note: payload.new.quick_note,
                  updated_at: payload.new.updated_at,
                })
                break
              }
            }
            return next
          })
        }
      )
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'))

    const helpChannel = supabase
      .channel(`monitor:help:${assignmentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'help_requests' },
        (payload) => {
          if (payload.new.escalated_to_teacher && !payload.new.resolved) {
            setNewEscalationAlert('A student has escalated a help request!')
            setTimeout(() => setNewEscalationAlert(null), 5000)
          }
          if (payload.new.resolved) {
            setEscalatedHelp(prev => prev.filter(h => h.id !== payload.new.id))
            if (selectedHelp?.id === payload.new.id) {
              setSheetOpen(false)
              setSelectedHelp(null)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(runsChannel)
      supabase.removeChannel(helpChannel)
    }
  }, [assignmentId, selectedHelp])

  const runsList = Array.from(runs.values())

  function handleHelpClick(help: EscalatedHelpRequest) {
    setSelectedHelp(help)
    setSheetOpen(true)
  }

  function handleHelpResolved(helpId: string) {
    setEscalatedHelp(prev => prev.filter(h => h.id !== helpId))
    setSheetOpen(false)
    setSelectedHelp(null)
  }

  function handleStudentClick(run: StudentRunSnapshot) {
    setSelectedRun(run)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{labTitle}</h1>
          <p className="text-sm text-muted-foreground">Live Class Monitor</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Class selector */}
          {assignments.length > 1 && (
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={e => router.push(`/teacher/labs/${labId}/monitor?classId=${e.target.value}`)}
                className="appearance-none rounded-lg border border-border bg-background pl-3 pr-8 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {assignments.map(a => (
                  <option key={a.classId} value={a.classId}>
                    {a.className}{a.classPeriod ? ` (${a.classPeriod})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            </div>
          )}
          {isConnected ? (
            <Badge className="gap-1.5 bg-green-500/10 text-green-700 border-green-200 dark:text-green-400">
              <Radio className="size-3 animate-pulse" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <Radio className="size-3" />
              Connecting…
            </Badge>
          )}
        </div>
      </div>

      {/* Escalation alert banner */}
      {newEscalationAlert && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {newEscalationAlert}
        </div>
      )}

      {/* Escalated help requests */}
      {escalatedHelp.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {escalatedHelp.length} student{escalatedHelp.length > 1 ? 's' : ''} need{escalatedHelp.length === 1 ? 's' : ''} your attention
          </p>
          <div className="flex flex-wrap gap-2">
            {escalatedHelp.map(h => (
              <button
                key={h.id}
                onClick={() => handleHelpClick(h)}
                className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-200 transition-colors dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              >
                {h.first_name} {h.last_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <MonitorStats runs={runsList} totalSteps={totalSteps} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: 'live', label: 'Live Monitor' },
          { key: 'data', label: 'Class Data' },
          { key: 'leaderboard', label: '🏆 Leaderboard' },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'live' && (
        <MonitorGrid runs={runsList} totalSteps={totalSteps} onStudentClick={handleStudentClick} />
      )}
      {activeTab === 'data' && (
        <ClassDataOverview assignmentId={assignmentId} labSteps={labSteps} runs={runsList} />
      )}
      {activeTab === 'leaderboard' && (
        <Leaderboard runs={runsList} totalSteps={totalSteps} />
      )}

      {/* Student detail sheet */}
      <StudentDetailSheet
        runId={selectedRun?.id ?? null}
        studentName={selectedRun ? `${selectedRun.first_name} ${selectedRun.last_name}` : ''}
        labSteps={labSteps}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Help Request Sheet */}
      {selectedHelp && (
        <HelpRequestPanel
          helpRequest={selectedHelp}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onResolved={handleHelpResolved}
        />
      )}
    </div>
  )
}
