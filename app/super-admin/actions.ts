'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUserRole } from '@/lib/auth/session'
import { IMPERSONATE_COOKIE } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types/app'

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

export async function createOrganization(formData: FormData): Promise<{
  id: string
  student_code: string
  staff_code: string
}> {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const name = (formData.get('name') as string).trim()
  const slug = (formData.get('slug') as string).trim().toLowerCase()
  const primaryColor = (formData.get('primary_color') as string) || '#6366f1'
  const secondaryColor = (formData.get('secondary_color') as string) || '#a5b4fc'

  if (!name || !slug) throw new Error('Name and slug are required')
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Slug may only contain lowercase letters, numbers, and hyphens')

  const supabase = await createClient()

  // Generate two unique codes via DB function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: code1, error: e1 } = await db.rpc('generate_org_code')
  if (e1) throw new Error('Failed to generate student code')

  let code2: string
  let attempts = 0
  do {
    const { data: c, error: e } = await db.rpc('generate_org_code')
    if (e) throw new Error('Failed to generate staff code')
    code2 = c as string
    attempts++
  } while (code2 === (code1 as string) && attempts < 10)

  const { data: org, error } = await db
    .from('organizations')
    .insert({
      name,
      slug,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      student_code: code1 as string,
      staff_code: code2!,
    })
    .select('id, student_code, staff_code')
    .single()
  if (error) throw new Error(error.message)

  // Seed default feature flags
  await supabase.from('feature_flags').insert([
    { organization_id: org.id, flag_key: 'ai_lab_generation', enabled: false },
    { organization_id: org.id, flag_key: 'help_chat', enabled: false },
    { organization_id: org.id, flag_key: 'analytics', enabled: true },
  ])

  revalidatePath('/super-admin')
  return {
    id: org.id,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    student_code: org.student_code!,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    staff_code: org.staff_code!,
  }
}

export async function regenerateOrgCode(
  orgId: string,
  codeType: 'student' | 'staff'
): Promise<{ code: string }> {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newCode, error: codeError } = await (supabase as any).rpc('generate_org_code')
  if (codeError) throw new Error('Failed to generate code')

  const column = codeType === 'student' ? 'student_code' : 'staff_code'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('organizations')
    .update({ [column]: newCode as string })
    .eq('id', orgId)
  if (error) throw new Error(error.message)

  revalidatePath('/super-admin')
  return { code: newCode as string }
}

export async function updateUserRoleSuperAdmin(
  profileId: string,
  newRole: UserRole
): Promise<void> {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', profileId)
  if (error) throw error

  try {
    const adminClient = createAdminClient()
    if (adminClient) {
      await adminClient.auth.admin.updateUserById(profileId, {
        app_metadata: { role: newRole },
      })
    }
  } catch {
    // best-effort
  }

  revalidatePath('/super-admin/users')
}

export async function approveStaffMemberSuperAdmin(profileId: string): Promise<void> {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', profileId)
  if (error) throw error

  revalidatePath('/super-admin/users')
}

export async function resetUserPasswordSuperAdmin(
  userId: string,
  newPassword: string
): Promise<void> {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')
  if (newPassword.length < 8) throw new Error('Password must be at least 8 characters')

  const adminClient = createAdminClient()
  if (!adminClient) throw new Error('Admin API not available')

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })
  if (error) throw new Error(error.message)
}

export async function deleteUserSuperAdmin(userId: string): Promise<void> {
  const role = await getUserRole()
  if (role !== 'super_admin') throw new Error('Unauthorized')

  const supabase = await createClient()

  // Profile delete cascades to all related data
  const { error: profileErr } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  if (profileErr) throw profileErr

  try {
    const adminClient = createAdminClient()
    if (adminClient) {
      await adminClient.auth.admin.deleteUser(userId)
    }
  } catch {
    // best-effort
  }

  revalidatePath('/super-admin/users')
}
