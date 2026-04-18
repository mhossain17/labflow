import { createClient } from '@/lib/supabase/server'

// Simple rate limiting: max N requests per org per hour
// In-memory store keyed by org_id — resets on server restart (acceptable for MVP)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

const LIMITS: Record<string, number> = {
  'ai_lab_generation': 10,   // 10 lab generations per org per hour
  'help_chat': 100,           // 100 help messages per org per hour
}

export async function checkRateLimit(
  orgId: string,
  featureKey: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = LIMITS[featureKey] ?? 50
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  const key = `${orgId}:${featureKey}`

  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + hourMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

export async function getOrgId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  return data?.organization_id ?? null
}
