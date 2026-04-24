import { requireRole } from '@/lib/auth/role-guard'
import { getProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

async function getAuditLogs(orgId: string) {
  const supabase = await createClient()
  const db = supabase as any
  const { data } = await db
    .from('audit_logs')
    .select(`
      id, action, target_table, target_id, metadata, created_at, actor_role,
      profiles:actor_id ( first_name, last_name )
    `)
    .order('created_at', { ascending: false })
    .limit(200)
  return (data ?? []) as Array<{
    id: string
    action: string
    target_table: string | null
    target_id: string | null
    metadata: Record<string, unknown> | null
    created_at: string
    actor_role: string | null
    profiles: { first_name: string; last_name: string } | null
  }>
}

const ACTION_LABELS: Record<string, string> = {
  view_student_list: 'Viewed student list',
  view_student_runs: 'Viewed student lab runs',
  export_student_data: 'Exported student data',
  delete_student_data: 'Deleted student data',
  update_user_role: 'Updated user role',
  view_audit_log: 'Viewed audit log',
}

export default async function AuditLogPage() {
  await requireRole(['school_admin', 'super_admin'])

  const actor = await getProfile()
  if (!actor || !actor.organization_id) return null

  const logs = await getAuditLogs(actor.organization_id)

  // Log that audit log was viewed
  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'view_audit_log',
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A record of all access and modifications to student educational records (FERPA compliance).
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No audit events recorded yet.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Target</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={log.id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-medium">
                    {log.profiles
                      ? `${log.profiles.first_name} ${log.profiles.last_name}`
                      : <span className="text-muted-foreground">Unknown</span>}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {log.actor_role ?? '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.action === 'delete_student_data'
                        ? 'bg-destructive/10 text-destructive'
                        : log.action === 'export_student_data'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                    {log.target_id
                      ? `${log.target_table ?? ''}/${log.target_id.slice(0, 8)}…`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing the 200 most recent events. Audit logs are immutable and cannot be deleted.
      </p>
    </div>
  )
}
