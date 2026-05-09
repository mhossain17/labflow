import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingHome } from '@/components/marketing/LandingHome'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingHome />
  }

  const role = user.app_metadata?.role as string | undefined

  if (role === 'teacher') {
    redirect('/teacher/classes')
  }
  if (role === 'school_admin' || role === 'super_admin') {
    redirect('/teacher/classes')
  }
  if (role === 'student') {
    redirect('/student/labs')
  }

  redirect('/dashboard')
}
