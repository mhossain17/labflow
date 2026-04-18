import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = user.app_metadata?.role as string | undefined

  if (role === 'teacher') redirect('/teacher/classes')
  if (role === 'school_admin') redirect('/admin/branding')
  if (role === 'student') redirect('/student/labs')
  if (role === 'super_admin') redirect('/admin/branding')

  // Fallback: show profile setup prompt
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome to LabFlow</h1>
      <p className="text-muted-foreground mt-2">
        Your account is set up. Contact your school admin for access.
      </p>
    </div>
  )
}
