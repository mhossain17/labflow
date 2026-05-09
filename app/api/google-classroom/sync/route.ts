import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/session'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { getGoogleClassroomStudents } from '@/lib/google-classroom/client'
import { getTeacherToken } from '@/lib/google-classroom/tokens'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrollOrInviteByEmail } from '@/features/teacher/actions'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await checkFeatureFlag('google_classroom_sync')
  if (!enabled) {
    return NextResponse.json({ error: 'Google Classroom sync is not enabled' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const { classId, googleCourseId, googleCourseName } = body ?? {}
  if (!classId || !googleCourseId) {
    return NextResponse.json({ error: 'classId and googleCourseId are required' }, { status: 400 })
  }

  // Verify teacher owns / is a member of this class
  const supabase = await createClient()
  const { data: classRow } = await (supabase as any)
    .from('classes')
    .select('id, organization_id')
    .eq('id', classId)
    .maybeSingle()

  if (!classRow) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }

  const { data: membership } = await (supabase as any)
    .from('class_teachers')
    .select('id')
    .eq('class_id', classId)
    .eq('teacher_id', profile.id)
    .maybeSingle()

  // school_admin / super_admin bypass the membership check
  if (!membership && profile.role === 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const accessToken = await getTeacherToken(profile.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  // Fetch students from Google
  let googleStudents
  try {
    googleStudents = await getGoogleClassroomStudents(accessToken, googleCourseId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const emails = googleStudents
    .map((s) => s.profile?.emailAddress)
    .filter((e): e is string => !!e && e.includes('@'))

  // Run enroll/invite for each email using existing action
  const results = await Promise.all(
    emails.map(async (email) => {
      try {
        const result = await enrollOrInviteByEmail(classId, email, classRow.organization_id)
        return { email, ...result }
      } catch {
        return { email, error: true }
      }
    })
  )

  // Upsert the google_classroom_links record
  const admin = createAdminClient()
  if (admin) {
    await (admin as any)
      .from('google_classroom_links')
      .upsert(
        {
          class_id: classId,
          google_course_id: googleCourseId,
          google_course_name: googleCourseName ?? null,
          teacher_id: profile.id,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'class_id' }
      )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synced = results.filter((r: any) => r.ok && !r.pending).length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pending = results.filter((r: any) => r.ok && r.pending).length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skipped = results.filter((r: any) => r.already).length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors = results.filter((r: any) => r.error || r.wrongRole || r.wrongOrg).length

  return NextResponse.json({ synced, pending, skipped, errors, total: emails.length })
}
