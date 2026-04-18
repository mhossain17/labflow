'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { TroubleshootingGuide } from './TroubleshootingGuide'
import { HelpChat } from './HelpChat'
import { createHelpRequest, escalateHelpRequest } from '@/features/lab-runner/actions'
import { HelpCircle, X, Info } from 'lucide-react'

const DISCLOSURE_KEY = 'labflow_ai_disclosure_dismissed'

type Stage = 'troubleshooting' | 'chat' | 'escalated'

interface Props {
  labRunId: string
  studentId: string
  stepId?: string
  stepInstructions?: string
  troubleshootingText?: string | null
  checkpoint?: string | null
  dataFieldLabels?: string[]
  existingHelpRequestId?: string | null
}

export function HelpModal({
  labRunId,
  studentId,
  stepId,
  stepInstructions = '',
  troubleshootingText,
  checkpoint,
  dataFieldLabels,
  existingHelpRequestId,
}: Props) {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>(
    troubleshootingText ? 'troubleshooting' : 'chat'
  )
  const [helpRequestId, setHelpRequestId] = useState<string | null>(
    existingHelpRequestId ?? null
  )
  const [showDisclosure, setShowDisclosure] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function openModal() {
    setOpen(true)
    if (typeof window !== 'undefined' && !localStorage.getItem(DISCLOSURE_KEY)) {
      setShowDisclosure(true)
    }
    // Create help request if none exists
    if (!helpRequestId) {
      startTransition(async () => {
        try {
          const req = await createHelpRequest(labRunId, studentId, stepId)
          setHelpRequestId(req.id)
        } catch {
          // ignore — modal still works without a help request id
        }
      })
    }
  }

  function handleEscalate() {
    if (!helpRequestId) return
    startTransition(async () => {
      await escalateHelpRequest(helpRequestId)
      setStage('escalated')
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openModal}
        className="w-full"
        disabled={isPending}
      >
        <HelpCircle className="size-4" />
        Get Help on This Step
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">
                {stage === 'troubleshooting' && 'Troubleshooting Guide'}
                {stage === 'chat' && 'AI Lab Assistant'}
                {stage === 'escalated' && 'Teacher Help Requested'}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {showDisclosure && (
              <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Your questions are processed by Anthropic&apos;s Claude AI. No personal information
                  beyond your lab context is shared.
                </span>
                <button
                  onClick={() => {
                    localStorage.setItem(DISCLOSURE_KEY, '1')
                    setShowDisclosure(false)
                  }}
                  className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {stage === 'troubleshooting' && (
              <TroubleshootingGuide
                troubleshooting={troubleshootingText ?? null}
                onProceed={() => setStage('chat')}
              />
            )}

            {stage === 'chat' && (
              <HelpChat
                stepInstructions={stepInstructions}
                troubleshootingText={troubleshootingText}
                checkpoint={checkpoint}
                dataFieldLabels={dataFieldLabels}
                helpRequestId={helpRequestId}
                onEscalate={handleEscalate}
              />
            )}

            {stage === 'escalated' && (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your teacher has been notified and will come to help you soon.
                </p>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
