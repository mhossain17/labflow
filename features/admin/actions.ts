'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('organizations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', orgId)
  if (error) throw error
  revalidatePath('/admin/branding')
  revalidatePath('/admin/settings')
}

export async function updateOrganizationLogo(orgId: string, logoUrl: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  // Try update first, then upsert
  const { data: existing } = await db
    .from('feature_flags')
    .select('id')
    .eq('organization_id', orgId)
    .eq('flag_key', flagKey)
    .maybeSingle()

  if (existing) {
    const { error } = await db
      .from('feature_flags')
      .update({ enabled })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await db
      .from('feature_flags')
      .insert({ organization_id: orgId, flag_key: flagKey, enabled })
    if (error) throw error
  }

  revalidatePath('/admin/feature-flags')
}

export async function updateUserRole(profileId: string, role: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { error } = await db
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', profileId)
  if (error) throw error

  // Also update app_metadata via Supabase Admin if available
  try {
    const adminClient = createAdminClient()
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

function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return null
  // Import dynamically to avoid bundling issues
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )
}
