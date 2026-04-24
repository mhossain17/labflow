import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { listClassesByOrg } from '@/features/admin/class-queries'
import { listTeachersByOrg } from '@/features/admin/class-queries'
import { AdminClassTable } from '@/components/admin/classes/AdminClassTable'
import { AdminCreateClassDialog } from '@/components/admin/classes/AdminCreateClassDialog'

export default async function AdminClassesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!['school_admin', 'super_admin'].includes(profile.role)) redirect('/teacher/classes')
  if (!profile.organization_id) redirect('/super-admin')

  const [classes, teachers] = await Promise.all([
    listClassesByOrg(profile.organization_id),
    listTeachersByOrg(profile.organization_id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all classes, assign teachers, and enroll students.
          </p>
        </div>
        <AdminCreateClassDialog orgId={profile.organization_id} teachers={teachers} />
      </div>
      <AdminClassTable classes={classes} />
    </div>
  )
}
