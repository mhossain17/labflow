'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { adminCreateClass } from '@/features/admin/class-actions'
import { Plus } from 'lucide-react'

interface Teacher {
  id: string
  first_name: string
  last_name: string
}

interface AdminCreateClassDialogProps {
  orgId: string
  teachers: Teacher[]
}

export function AdminCreateClassDialog({ orgId, teachers }: AdminCreateClassDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name') as string
    const description = (fd.get('description') as string) || undefined
    const period = (fd.get('period') as string) || undefined
    const school_year = (fd.get('school_year') as string) || undefined
    const primaryTeacherId = fd.get('primaryTeacherId') as string
    if (!name.trim() || !primaryTeacherId) return

    setError(null)
    startTransition(async () => {
      try {
        await adminCreateClass({ name, description, period, school_year, organization_id: orgId, primaryTeacherId })
        setOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create class')
      }
    })
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="size-4 mr-1.5" />
        New Class
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Create Class</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Class Name <span className="text-destructive">*</span></label>
            <input name="name" required className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. AP Chemistry – Period 3" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Primary Teacher <span className="text-destructive">*</span></label>
            <select name="primaryTeacherId" required className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select a teacher…</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Period</label>
              <input name="period" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Block A" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">School Year</label>
              <input name="school_year" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. 2025–2026" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea name="description" rows={2} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" placeholder="Optional class description" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Creating…' : 'Create Class'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
