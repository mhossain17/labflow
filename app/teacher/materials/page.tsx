import { getProfile } from '@/lib/auth/session'
import { listAllTeacherMaterials } from '@/features/teacher/queries'
import { MaterialsList } from '@/components/teacher/MaterialsList'
import { MaterialUploadDialog } from '@/components/teacher/MaterialUploadDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { redirect } from 'next/navigation'
import { FolderOpen } from 'lucide-react'

export default async function MaterialsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const materials = await listAllTeacherMaterials(profile.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teaching Materials</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your reference files and handouts.
          </p>
        </div>
        <MaterialUploadDialog
          teacherId={profile.id}
          organizationId={profile.organization_id}
        />
      </div>

      {materials.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="size-12" />}
          title="No materials uploaded yet"
          description="Upload PDFs, Word documents, or text files for easy reference."
          action={
            <MaterialUploadDialog
              teacherId={profile.id}
              organizationId={profile.organization_id}
            />
          }
        />
      ) : (
        <MaterialsList materials={materials} />
      )}
    </div>
  )
}
