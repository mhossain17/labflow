'use client'
import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useAutoSave } from '@/hooks/useAutoSave'
import { updateQuickNote } from '@/features/lab-runner/actions'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { StatusSelector } from './StatusSelector'
import { HelpModal } from '@/components/student/help/HelpModal'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import type { StudentWorkStatus } from '@/types/app'

interface Props {
  labRunId: string
  studentId: string
  initialStatus: StudentWorkStatus
  currentStep: number
  totalSteps: number
  prelabCompleted: boolean
  quickNote: string | null
  // Current step info for help modal
  stepInstructions?: string
  stepId?: string
  troubleshootingText?: string | null
  existingHelpRequestId?: string | null
}

export function StatusSidebar({
  labRunId,
  studentId,
  initialStatus,
  currentStep,
  totalSteps,
  prelabCompleted,
  quickNote,
  stepInstructions,
  stepId,
  troubleshootingText,
  existingHelpRequestId,
}: Props) {
  const pathname = usePathname()
  const helpChatEnabled = useFeatureFlag('help_chat')
  const [note, setNote] = useState(quickNote ?? '')

  const isOnStepPage = /\/step\/\d+$/.test(pathname)

  const progress =
    totalSteps > 0 && prelabCompleted
      ? Math.round((currentStep / totalSteps) * 100)
      : 0

  const saveNote = useCallback(
    async (text: string) => {
      await updateQuickNote(labRunId, text)
    },
    [labRunId]
  )

  const { save } = useAutoSave(saveNote)

  function handleNoteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setNote(val)
    save(val)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Status */}
      <StatusSelector labRunId={labRunId} initialStatus={initialStatus} />

      {/* Progress */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress</p>
        <p className="text-sm font-medium">
          {!prelabCompleted
            ? 'Pre-Lab'
            : totalSteps > 0
            ? `Step ${currentStep} of ${totalSteps}`
            : 'Pre-Lab Complete'}
        </p>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Quick Note */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Note</p>
        <Textarea
          rows={4}
          value={note}
          onChange={handleNoteChange}
          placeholder="Jot down observations, questions..."
          className="text-sm resize-none"
        />
      </div>

      {/* Help */}
      {isOnStepPage && helpChatEnabled === true && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Help</p>
          <HelpModal
            labRunId={labRunId}
            studentId={studentId}
            stepId={stepId}
            stepInstructions={stepInstructions}
            troubleshootingText={troubleshootingText}
            existingHelpRequestId={existingHelpRequestId}
          />
        </div>
      )}
    </div>
  )
}
