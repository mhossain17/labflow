import { createClient } from '@/lib/supabase/server'

export async function checkFeatureFlag(flagKey: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('feature_flags')
    .select('enabled')
    .eq('flag_key', flagKey)
    .single()

  return data?.enabled ?? false
}
