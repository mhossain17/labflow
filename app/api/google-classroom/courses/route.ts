import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/session'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { getGoogleClassroomCourses } from '@/lib/google-classroom/client'
import { getTeacherToken } from '@/lib/google-classroom/tokens'

export async function GET() {
  const profile = await getProfile()
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await checkFeatureFlag('google_classroom_sync')
  if (!enabled) {
    return NextResponse.json({ error: 'Google Classroom sync is not enabled' }, { status: 403 })
  }

  const accessToken = await getTeacherToken(profile.id)
  if (!accessToken) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  try {
    const courses = await getGoogleClassroomCourses(accessToken)
    return NextResponse.json({ courses })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
