'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { deleteStudentData } from '@/features/admin/actions'

interface Props {
  userId: string
  userName: string
}

export function DeleteStudentDialog({ userId, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteStudentData(userId)
        toast.success(`Deleted all data for ${userName}`)
        setOpen(false)
      } catch {
        toast.error('Failed to delete student data')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
        title="Delete student data"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg border border-border shadow-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-2">Delete Student Data</h2>
        <p className="text-sm text-muted-foreground mb-1">
          This will permanently delete all data for <strong>{userName}</strong>, including:
        </p>
        <ul className="text-sm text-muted-foreground list-disc ml-5 mb-4 space-y-0.5">
          <li>Lab runs and step responses</li>
          <li>Pre-lab responses</li>
          <li>Help request conversations</li>
          <li>Class enrollments</li>
          <li>User account and profile</li>
        </ul>
        <p className="text-sm font-medium text-destructive mb-4">
          This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Delete All Data'}
          </button>
        </div>
      </div>
    </div>
  )
}
