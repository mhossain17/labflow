'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { resolveHelpRequest } from '@/features/lab-runner/actions'

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  ts: string
}

interface EscalatedHelpRequest {
  id: string
  lab_run_id: string
  student_id: string
  first_name: string
  last_name: string
  conversation: ConversationTurn[]
  step_id: string | null
  resolved: boolean
  escalated_to_teacher: boolean
  created_at: string
}

interface HelpRequestPanelProps {
  helpRequest: EscalatedHelpRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolved: (helpId: string) => void
}

export function HelpRequestPanel({
  helpRequest,
  open,
  onOpenChange,
  onResolved,
}: HelpRequestPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleResolve() {
    setError(null)
    startTransition(async () => {
      try {
        await resolveHelpRequest(helpRequest.id)
        onResolved(helpRequest.id)
      } catch {
        setError('Failed to mark as resolved. Please try again.')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>
            Help Request — {helpRequest.first_name} {helpRequest.last_name}
          </SheetTitle>
          <SheetDescription>
            Escalated{' '}
            {helpRequest.created_at
              ? formatDistanceToNow(new Date(helpRequest.created_at), { addSuffix: true })
              : ''}
          </SheetDescription>
        </SheetHeader>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {helpRequest.conversation.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No conversation history.</p>
          ) : (
            helpRequest.conversation.map((turn, i) => (
              <div
                key={i}
                className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    turn.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.content}</p>
                  {turn.ts && (
                    <p className={`mt-1 text-xs ${turn.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {formatDistanceToNow(new Date(turn.ts), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <p className="px-4 text-sm text-destructive">{error}</p>
        )}

        <SheetFooter>
          <Button
            onClick={handleResolve}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Marking resolved…' : 'Mark Resolved'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
