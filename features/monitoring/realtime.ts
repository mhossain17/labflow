// Types and channel names for Supabase Realtime subscriptions

export const MONITOR_CHANNEL = (assignmentId: string) => `monitor:${assignmentId}`
export const HELP_ESCALATION_CHANNEL = (teacherId: string) => `help:teacher:${teacherId}`

export type StudentRunSnapshot = {
  id: string
  student_id: string
  first_name: string
  last_name: string
  current_step: number
  status: string
  quick_note: string | null
  flag_count: number
  updated_at: string
}

export type RealtimeRunPayload = {
  id: string
  current_step: number
  status: string
  quick_note: string | null
  updated_at: string
}
