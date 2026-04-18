'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { enrollStudent, lookupProfileByEmail } from '@/features/teacher/actions'
import { UserPlus } from 'lucide-react'

interface AddStudentFormProps {
  classId: string
}

export function AddStudentForm({ classId }: AddStudentFormProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!email.trim()) return

    startTransition(async () => {
      try {
        const profile = await lookupProfileByEmail(email.trim().toLowerCase())
        if (!profile) {
          setError('No account found with that email address.')
          return
        }
        if (profile.role !== 'student') {
          setError(`This account has the role "${profile.role}", not student.`)
          return
        }
        const result = await enrollStudent(classId, profile.id)
        if (result.already) {
          setError('This student is already enrolled.')
          return
        }
        setSuccess(`${profile.first_name} ${profile.last_name} enrolled successfully.`)
        setEmail('')
      } catch (err) {
        console.error(err)
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="student-email">Add student by email</Label>
        <Input
          id="student-email"
          type="email"
          placeholder="student@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending || !email.trim()}>
        <UserPlus className="size-4" />
        {isPending ? 'Adding...' : 'Add Student'}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
      {success && <p className="w-full text-sm text-green-600 dark:text-green-400">{success}</p>}
    </form>
  )
}
