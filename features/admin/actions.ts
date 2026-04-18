'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/types/app'
import { logAuditEvent } from '@/lib/audit'
import { getProfile } from '@/lib/auth/session'

export async function updateOrganization(
  orgId: string,
  updates: {
    name?: string
    primary_color?: string
    secondary_color?: string
    footer_text?: string
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('organizations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', orgId)
  if (error) throw error
  revalidatePath('/admin/branding')
  revalidatePath('/admin/settings')
}

export async function updateOrganizationLogo(orgId: string, logoUrl: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', orgId)
  if (error) throw error
  revalidatePath('/admin/branding')
}

export async function toggleFeatureFlag(
  orgId: string,
  flagKey: string,
  enabled: boolean
) {
  const supabase = await createClient()
  // Try update first, then upsert
  const { data: existing } = await supabase
    .from('feature_flags')
    .select('id')
    .eq('organization_id', orgId)
    .eq('flag_key', flagKey)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('feature_flags')
      .insert({ organization_id: orgId, flag_key: flagKey, enabled })
    if (error) throw error
  }

  revalidatePath('/admin/feature-flags')
}

export async function deleteStudentData(studentId: string) {
  const supabase = await createClient()

  const actor = await getProfile()
  if (!actor) throw new Error('Unauthorized')

  // Delete in dependency order
  const tables = [
    'pre_lab_responses',
    'step_responses',
    'help_requests',
    'student_lab_runs',
    'class_enrollments',
  ] as const

  for (const table of tables) {
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq('student_id', studentId)
    if (error) throw error
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', studentId)
  if (profileError) throw profileError

  // Delete auth user via service role
  try {
    const adminClient = await createAdminClient()
    if (adminClient) {
      await adminClient.auth.admin.deleteUser(studentId)
    }
  } catch {
    // profile already deleted — auth user deletion is best-effort
  }

  await logAuditEvent({
    actorId: actor.id,
    actorRole: actor.role,
    action: 'delete_student_data',
    targetTable: 'profiles',
    targetId: studentId,
  })

  revalidatePath('/admin/users')
}

export async function updateUserRole(profileId: string, role: UserRole) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', profileId)
  if (error) throw error

  // Also update app_metadata via Supabase Admin if available
  try {
    const adminClient = await createAdminClient()
    if (adminClient) {
      await adminClient.auth.admin.updateUserById(profileId, {
        app_metadata: { role },
      })
    }
  } catch {
    // Admin client may not be configured — profile update is sufficient
  }

  revalidatePath('/admin/users')
}

async function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return null
  // Import dynamically to avoid bundling issues
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )
}
