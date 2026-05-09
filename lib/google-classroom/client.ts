const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CLASSROOM_API = 'https://classroom.googleapis.com/v1'

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
].join(' ')

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GoogleCourse {
  id: string
  name: string
  section?: string
  enrollmentCode?: string
  courseState: string
}

export interface GoogleStudent {
  courseId: string
  userId: string
  profile: {
    id: string
    name: { fullName: string }
    emailAddress: string
  }
}

export function getGoogleOAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !appUrl) throw new Error('Google OAuth not configured')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/google-classroom/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `${GOOGLE_AUTH_URL}?${params}`
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !clientSecret || !appUrl) throw new Error('Google OAuth not configured')

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/google-classroom/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token exchange failed: ${body}`)
  }

  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<Pick<GoogleTokens, 'access_token' | 'expires_in'>> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google OAuth not configured')

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token refresh failed: ${body}`)
  }

  return res.json()
}

export async function getGoogleClassroomCourses(accessToken: string): Promise<GoogleCourse[]> {
  const res = await fetch(
    `${CLASSROOM_API}/courses?teacherId=me&courseStates=ACTIVE&pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Classroom courses fetch failed: ${body}`)
  }

  const data = await res.json()
  return (data.courses ?? []) as GoogleCourse[]
}

export async function getGoogleClassroomStudents(
  accessToken: string,
  courseId: string
): Promise<GoogleStudent[]> {
  const students: GoogleStudent[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({ pageSize: '100' })
    if (pageToken) params.set('pageToken', pageToken)

    const res = await fetch(
      `${CLASSROOM_API}/courses/${courseId}/students?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Classroom students fetch failed: ${body}`)
    }

    const data = await res.json()
    students.push(...((data.students ?? []) as GoogleStudent[]))
    pageToken = data.nextPageToken
  } while (pageToken)

  return students
}
