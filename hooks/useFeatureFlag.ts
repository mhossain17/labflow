'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useFeatureFlag(flagKey: string, initialValue?: boolean): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(initialValue ?? null)

  useEffect(() => {
    if (initialValue !== undefined) return
    const supabase = createClient()
    supabase
      .from('feature_flags')
      .select('enabled')
      .eq('flag_key', flagKey)
      .single()
      .then(({ data }: { data: { enabled: boolean } | null }) => {
        setEnabled(data?.enabled ?? false)
      })
  }, [flagKey, initialValue])

  return initialValue ?? enabled
}
