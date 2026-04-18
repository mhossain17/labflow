'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StudentRunSnapshot } from '@/features/monitoring/realtime'
import { MonitorGrid } from './MonitorGrid'
import { MonitorStats } from './MonitorStats'
import { HelpRequestPanel } from './HelpRequestPanel'
import { Badge } from '@/components/ui/badge'
import { Radio } from 'lucide-react'

interface EscalatedHelpRequest {
  id: string
  lab_run_id: string
  student_id: string
  first_name: string
  last_name: string
  conversation: Array<{ role: 'user' | 'assistant'; content: string; ts: string }>
  step_id: string | null
  resolved: boolean
  escalated_to_teacher: boolean
  created_at: string
}

interface MonitorDashboardProps {
  labId: string
  labTitle: string
  assignmentId: string
  totalSteps: number
  initialRuns: StudentRunSnapshot[]
  initialEscalatedHelp: EscalatedHelpRequest[]
}

export function MonitorDashboard({
  labTitle,
  assignmentId,
  totalSteps,
  initialRuns,
  initialEscalatedHelp,
}: MonitorDashboardProps) {
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

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to student_lab_runs updates
    const runsChannel = supabase
      .channel(`monitor:assignment:${assignmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_lab_runs',
          filter: `assignment_id=eq.${assignmentId}`
        },
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
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Subscribe to help_requests updates for escalation alerts
    const helpChannel = supabase
      .channel(`monitor:help:${assignmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'help_requests',
        },
        (payload) => {
          if (payload.new.escalated_to_teacher && !payload.new.resolved) {
            // New escalation – we can't easily filter by assignment here without join,
            // so just trigger a banner; the state will be refreshed on next server action
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{labTitle}</h1>
          <p className="text-sm text-muted-foreground">Live Class Monitor</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Grid */}
      <MonitorGrid runs={runsList} totalSteps={totalSteps} />

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
