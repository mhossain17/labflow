import { createAdminClient } from '@/lib/supabase/admin'
import { refreshAccessToken } from './client'

export interface StoredTokens {
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  scopes: string[] | null
}

export async function saveTeacherToken(
  userId: string,
  tokens: {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope?: string
  }
) {
  const admin = createAdminClient()
  if (!admin) throw new Error('Admin client unavailable')

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
  const scopes = tokens.scope ? tokens.scope.split(' ') : null

  const { error } = await (admin as any)
    .from('user_oauth_tokens')
    .upsert(
      {
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scopes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    )

  if (error) throw error
}

export async function getTeacherToken(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  if (!admin) return null

  const { data, error } = await (admin as any)
    .from('user_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle()

  if (error || !data) return null

  const stored = data as StoredTokens & { expires_at: string | null }

  // Check if token is still valid (with 60s buffer)
  const expiresAt = stored.expires_at ? new Date(stored.expires_at).getTime() : 0
  const isExpired = expiresAt < Date.now() + 60_000

  if (!isExpired) return stored.access_token

  // Attempt refresh
  if (!stored.refresh_token) return null

  try {
    const refreshed = await refreshAccessToken(stored.refresh_token)
    await saveTeacherToken(userId, {
      access_token: refreshed.access_token,
      refresh_token: stored.refresh_token,
      expires_in: refreshed.expires_in,
    })
    return refreshed.access_token
  } catch {
    return null
  }
}

export async function hasGoogleConnected(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  if (!admin) return false

  const { data } = await (admin as any)
    .from('user_oauth_tokens')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle()

  return !!data
}
