import { getProfile } from '@/lib/auth/session'
import { listClassesByTeacher } from '@/features/teacher/queries'
import { ClassList } from '@/components/teacher/classes/ClassList'
import { CreateClassDialog } from '@/components/teacher/classes/CreateClassDialog'
import { redirect } from 'next/navigation'

export default async function ClassesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const classes = await listClassesByTeacher(profile.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classes and enrolled students.
          </p>
        </div>
        <CreateClassDialog
          teacherId={profile.id}
          organizationId={profile.organization_id}
        />
      </div>
      <ClassList classes={classes} />
    </div>
  )
}
