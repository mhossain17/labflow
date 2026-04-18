import { redirect } from 'next/navigation'
import { DemoControlCenter } from '@/components/demo/DemoControlCenter'
import { isDemoEmail } from '@/lib/demo/accounts'
import { createClient } from '@/lib/supabase/server'

export default async function DemoControlPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!isDemoEmail(user.email)) redirect('/dashboard')

  return <DemoControlCenter currentEmail={user.email ?? ''} />
}

