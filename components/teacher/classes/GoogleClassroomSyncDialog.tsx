'use client'
import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface Course {
  id: string
  name: string
  section?: string
}

interface SyncResult {
  synced: number
  pending: number
  skipped: number
  errors: number
  total: number
}

type Step = 'idle' | 'connecting' | 'pick-course' | 'confirm' | 'syncing' | 'done' | 'error'

interface Props {
  classId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass true when the teacher has already connected their Google account */
  isConnected: boolean
  /** Pass a linked course if this class was previously synced */
  linkedCourse?: { id: string; name: string } | null
}

export function GoogleClassroomSyncDialog({
  classId,
  open,
  onOpenChange,
  isConnected,
  linkedCourse,
}: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(linkedCourse ?? null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setResult(null)
      setErrorMsg(null)
      if (linkedCourse) {
        setSelectedCourse(linkedCourse)
        setStep('confirm')
      } else if (isConnected) {
        setStep('pick-course')
        loadCourses()
      } else {
        setStep('idle')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function loadCourses() {
    try {
      const res = await fetch('/api/google-classroom/courses')
      const data = await res.json()
      if (data.error === 'not_connected') {
        setStep('idle')
        return
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load courses')
      setCourses(data.courses ?? [])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load Google Classroom courses')
      setStep('error')
    }
  }

  function handleConnectGoogle() {
    // Redirect to auth route — it will come back to this class page
    window.location.href = `/api/google-classroom/auth?classId=${classId}`
  }

  function handleSelectCourse(course: Course) {
    setSelectedCourse(course)
    setStep('confirm')
  }

  function handleSync() {
    if (!selectedCourse) return
    startTransition(async () => {
      setStep('syncing')
      try {
        const res = await fetch('/api/google-classroom/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId,
            googleCourseId: selectedCourse.id,
            googleCourseName: selectedCourse.name,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Sync failed')
        setResult(data)
        setStep('done')
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Sync failed')
        setStep('error')
      }
    })
  }

  function handleClose() {
    onOpenChange(false)
    // Small delay before reset so animation completes
    setTimeout(() => setStep('idle'), 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GoogleClassroomIcon />
            Sync from Google Classroom
          </DialogTitle>
          <DialogDescription>
            Import your Google Classroom roster into this class.
          </DialogDescription>
        </DialogHeader>

        {/* Step: not connected */}
        {step === 'idle' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Connect your Google account to import students from Google Classroom. Students
              without a LabFlow account will receive a pending invite.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConnectGoogle}>
                <ExternalLink className="size-4" />
                Connect Google Account
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: pick a course */}
        {step === 'pick-course' && (
          <div className="space-y-3 py-2">
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active Google Classroom courses found.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
                {courses.map((course) => (
                  <li key={course.id}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleSelectCourse(course)}
                    >
                      <span className="font-medium">{course.name}</span>
                      {course.section && (
                        <span className="text-xs text-muted-foreground ml-2">{course.section}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button variant="outline" onClick={() => { loadCourses() }}>
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && selectedCourse && (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium">{selectedCourse.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Students will be added to this class. Those without a LabFlow account will be
                invited by email.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  if (!linkedCourse) {
                    setStep('pick-course')
                  } else {
                    handleClose()
                  }
                }}
              >
                {linkedCourse ? 'Cancel' : 'Back'}
              </Button>
              <Button onClick={handleSync} disabled={isPending}>
                Sync Roster
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: syncing */}
        {step === 'syncing' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <RefreshCw className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Syncing roster from Google Classroom…</p>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && result && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Sync complete</p>
                <ul className="text-muted-foreground space-y-0.5">
                  {result.synced > 0 && <li>{result.synced} student{result.synced !== 1 ? 's' : ''} enrolled</li>}
                  {result.pending > 0 && <li>{result.pending} invited (will enroll when they sign up)</li>}
                  {result.skipped > 0 && <li>{result.skipped} already enrolled</li>}
                  {result.errors > 0 && <li>{result.errors} skipped (wrong role or school)</li>}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step: error */}
        {step === 'error' && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Something went wrong</p>
                {errorMsg && <p className="text-muted-foreground mt-1">{errorMsg}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button onClick={() => { setStep(isConnected ? 'pick-course' : 'idle'); setErrorMsg(null) }}>
                Try again
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function GoogleClassroomIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="48" height="48" rx="4" fill="#0F9D58"/>
      <rect x="10" y="14" width="28" height="20" rx="2" fill="white"/>
      <rect x="14" y="18" width="20" height="12" rx="1" fill="#0F9D58"/>
      <circle cx="24" cy="24" r="4" fill="white"/>
      <circle cx="24" cy="24" r="2.5" fill="#0F9D58"/>
    </svg>
  )
}
