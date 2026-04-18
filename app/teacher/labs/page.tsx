import { getProfile } from '@/lib/auth/session'
import { listLabsByTeacher } from '@/features/teacher/queries'
import { LabStatusBadge } from '@/components/teacher/lab-builder/LabStatusBadge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, FlaskConical, Clock, Pencil } from 'lucide-react'
import type { Lab, LabStatus } from '@/types/app'

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

interface LabsPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function LabsPage({ searchParams }: LabsPageProps) {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const { status = 'all' } = await searchParams
  const allLabs: Lab[] = await listLabsByTeacher(profile.id)

  const filtered = status === 'all'
    ? allLabs
    : allLabs.filter((lab) => lab.status === status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Labs</h1>
          <p className="text-muted-foreground mt-1">Build and manage your lab activities.</p>
        </div>
        <Button render={<Link href="/teacher/labs/new" />}>
          <Plus className="size-4" />
          New Lab
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value === 'all' ? '/teacher/labs' : `/teacher/labs?status=${opt.value}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              status === opt.value
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({opt.value === 'all' ? allLabs.length : allLabs.filter(l => l.status === opt.value).length})
            </span>
          </Link>
        ))}
      </div>

      {/* Labs list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="size-12" />}
          title="No labs found"
          description={
            status === 'all'
              ? 'No labs yet. Create your first lab or generate one with AI.'
              : `No ${status} labs yet.`
          }
          action={
            status === 'all' ? (
              <Button render={<Link href="/teacher/labs/new" />}>
                <Plus className="size-4" />
                Create Lab
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lab, idx) => (
                <tr
                  key={lab.id}
                  className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/teacher/labs/${lab.id}`}
                      className="font-medium hover:underline"
                    >
                      {lab.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <LabStatusBadge status={lab.status as LabStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lab.estimated_minutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {lab.estimated_minutes} min
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(lab.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon-sm" render={<Link href={`/teacher/labs/${lab.id}/edit`} />}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
