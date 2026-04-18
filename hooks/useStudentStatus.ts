'use client'
import { useState, useTransition } from 'react'
import { updateRunStatus } from '@/features/lab-runner/actions'
import type { StudentWorkStatus } from '@/types/app'

export function useStudentStatus(labRunId: string, initial: StudentWorkStatus) {
  const [status, setStatus] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const changeStatus = (newStatus: StudentWorkStatus) => {
    const prev = status
    setStatus(newStatus) // optimistic
    startTransition(async () => {
      try {
        await updateRunStatus(labRunId, newStatus)
      } catch {
        setStatus(prev) // revert
      }
    })
  }

  return { status, changeStatus, isPending }
}
