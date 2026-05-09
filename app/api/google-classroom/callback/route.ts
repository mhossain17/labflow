import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getProfile } from '@/lib/auth/session'
import { exchangeCodeForTokens } from '@/lib/google-classroom/client'
import { saveTeacherToken } from '@/lib/google-classroom/tokens'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${origin}/teacher/classes?gc_error=${encodeURIComponent(errorParam)}`)
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${origin}/teacher/classes?gc_error=missing_params`)
  }

  // Validate CSRF state
  const cookieStore = await cookies()
  const savedNonce = cookieStore.get('gc_oauth_state')?.value
  cookieStore.delete('gc_oauth_state')

  let classId = ''
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    if (!savedNonce || decoded.nonce !== savedNonce) {
      return NextResponse.redirect(`${origin}/teacher/classes?gc_error=state_mismatch`)
    }
    classId = decoded.classId ?? ''
  } catch {
    return NextResponse.redirect(`${origin}/teacher/classes?gc_error=invalid_state`)
  }

  const profile = await getProfile()
  if (!profile) {
    return NextResponse.redirect(`${origin}/login`)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    await saveTeacherToken(profile.id, tokens)
  } catch {
    return NextResponse.redirect(`${origin}/teacher/classes?gc_error=token_exchange_failed`)
  }

  const redirectPath = classId
    ? `/teacher/classes/${classId}?gc_connected=1`
    : '/teacher/classes?gc_connected=1'

  return NextResponse.redirect(`${origin}${redirectPath}`)
}
