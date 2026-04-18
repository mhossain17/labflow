'use client'
import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { assignLabToClass } from '@/features/teacher/actions'
import { Share2 } from 'lucide-react'

interface AvailableClass {
  id: string
  name: string
  period: string | null
}

interface AssignLabDialogProps {
  labId: string
  teacherId: string
  availableClasses: AvailableClass[]
}

export function AssignLabDialog({ labId, teacherId, availableClasses }: AssignLabDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!selectedClassId) {
      setError('Please select a class.')
      return
    }
    startTransition(async () => {
      try {
        await assignLabToClass(labId, selectedClassId, teacherId, dueDate || undefined)
        setOpen(false)
        setSelectedClassId('')
        setDueDate('')
      } catch (err) {
        console.error(err)
        setError('Failed to assign lab. Please try again.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" disabled={availableClasses.length === 0}>
          <Share2 className="size-4" />
          Assign to Class
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Lab to Class</DialogTitle>
        </DialogHeader>
        {availableClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This lab is already assigned to all your classes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableClasses.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name="class"
                      value={cls.id}
                      checked={selectedClassId === cls.id}
                      onChange={() => setSelectedClassId(cls.id)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">
                      {cls.name}
                      {cls.period && <span className="ml-1.5 text-muted-foreground font-normal">({cls.period})</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due-date">Due Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Assigning...' : 'Assign Lab'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
