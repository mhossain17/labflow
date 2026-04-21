'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUserRole } from '@/lib/auth/session'
import { IMPERSONATE_COOKIE } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function impersonateOrg(orgId: string) {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATE_COOKIE, orgId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  redirect('/admin/branding')
}

export async function stopImpersonation() {
  const cookieStore = await cookies()
  cookieStore.delete(IMPERSONATE_COOKIE)
  redirect('/super-admin')
}

export async function createOrganization(formData: FormData) {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const name = (formData.get('name') as string).trim()
  const slug = (formData.get('slug') as string).trim().toLowerCase()
  const primaryColor = (formData.get('primary_color') as string) || '#6366f1'
  const secondaryColor = (formData.get('secondary_color') as string) || '#a5b4fc'

  if (!name || !slug) throw new Error('Name and slug are required')
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Slug may only contain lowercase letters, numbers, and hyphens')

  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({ name, slug, primary_color: primaryColor, secondary_color: secondaryColor })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  // Seed default feature flags
  await supabase.from('feature_flags').insert([
    { organization_id: org.id, flag_key: 'ai_lab_generation', enabled: false },
    { organization_id: org.id, flag_key: 'help_chat', enabled: false },
    { organization_id: org.id, flag_key: 'analytics', enabled: true },
  ])

  revalidatePath('/super-admin')
}
