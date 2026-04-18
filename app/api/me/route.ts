import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/session'

export async function GET() {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    id: profile.id,
    organization_id: profile.organization_id,
    role: profile.role,
    first_name: profile.first_name,
    last_name: profile.last_name,
  })
}
