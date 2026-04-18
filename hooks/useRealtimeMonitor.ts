'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StudentRunSnapshot } from '@/features/monitoring/realtime'

export function useRealtimeMonitor(
  assignmentId: string,
  initialRuns: StudentRunSnapshot[]
) {
  const [runs, setRuns] = useState<Map<string, StudentRunSnapshot>>(() => {
    const map = new Map<string, StudentRunSnapshot>()
    initialRuns.forEach(r => map.set(r.student_id, r))
    return map
  })

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
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
                  updated_at: payload.new.updated_at
                })
                break
              }
            }
            return next
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [assignmentId])

  return Array.from(runs.values())
}
