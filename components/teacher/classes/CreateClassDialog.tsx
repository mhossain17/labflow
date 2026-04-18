'use client'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClass } from '@/features/teacher/actions'
import { Plus } from 'lucide-react'

interface CreateClassDialogProps {
  teacherId: string
  organizationId: string
}

interface FormValues {
  name: string
  period: string
  school_year: string
  description: string
}

const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8']

export function CreateClassDialog({ teacherId, organizationId }: CreateClassDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>()

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createClass({
          name: values.name,
          description: values.description || undefined,
          period: values.period || undefined,
          school_year: values.school_year || undefined,
          teacher_id: teacherId,
          organization_id: organizationId,
        })
        reset()
        setOpen(false)
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button>
          <Plus className="size-4" />
          New Class
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Class Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Biology 101"
              {...register('name', { required: true })}
              aria-invalid={!!errors.name}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="period">Period</Label>
            <select
              id="period"
              {...register('period')}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Select a period</option>
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="school_year">School Year</Label>
            <Input
              id="school_year"
              placeholder="e.g. 2025-2026"
              {...register('school_year')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional description"
              {...register('description')}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
