import { createClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'view_student_list'
  | 'view_student_runs'
  | 'export_student_data'
  | 'delete_student_data'
  | 'update_user_role'
  | 'view_audit_log'

export async function logAuditEvent({
  actorId,
  actorRole,
  action,
  targetTable,
  targetId,
  metadata,
}: {
  actorId: string
  actorRole: string
  action: AuditAction
  targetTable?: string
  targetId?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('audit_logs').insert({
      actor_id: actorId,
      actor_role: actorRole,
      action,
      target_table: targetTable ?? null,
      target_id: targetId ?? null,
      metadata: metadata ?? null,
    })
  } catch {
    // Audit logging must never crash the main request
    console.error('[audit] Failed to write audit log:', action)
  }
}
