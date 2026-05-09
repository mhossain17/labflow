import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getProfile } from '@/lib/auth/session'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { getGoogleOAuthUrl } from '@/lib/google-classroom/client'
import { randomBytes } from 'crypto'

export async function GET(request: Request) {
  const profile = await getProfile()
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'school_admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enabled = await checkFeatureFlag('google_classroom_sync')
  if (!enabled) {
    return NextResponse.json({ error: 'Google Classroom sync is not enabled for your organization' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const classId = searchParams.get('classId') ?? ''

  // Generate CSRF state token
  const state = randomBytes(16).toString('hex')

  // Encode classId into state so callback can redirect back to the right page
  const statePayload = Buffer.from(JSON.stringify({ nonce: state, classId })).toString('base64url')

  const cookieStore = await cookies()
  cookieStore.set('gc_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  const url = getGoogleOAuthUrl(statePayload)
  return NextResponse.redirect(url)
}
