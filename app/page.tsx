import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.app_metadata?.role as string | undefined

  if (role === 'teacher' || role === 'school_admin' || role === 'super_admin') {
    redirect('/teacher/classes')
  }
  if (role === 'student') {
    redirect('/student/labs')
  }
  if (role === 'school_admin') {
    redirect('/admin/branding')
  }

  redirect('/dashboard')
}
