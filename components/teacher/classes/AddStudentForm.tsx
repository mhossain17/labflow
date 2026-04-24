'use client'
import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchStudentsByNameOrEmail, enrollOrInviteByEmail } from '@/features/teacher/actions'
import { Upload, UserPlus, Search, Mail } from 'lucide-react'
import { CSVUploadDialog } from './CSVUploadDialog'

interface StudentResult {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface AddStudentFormProps {
  classId: string
  orgId: string
}

export function AddStudentForm({ classId, orgId }: AddStudentFormProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StudentResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [csvOpen, setCsvOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isEmailLike = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

  const search = useCallback(
    async (term: string) => {
      if (term.trim().length < 2) {
        setResults([])
        setOpen(false)
        return
      }
      setIsSearching(true)
      try {
        const data = await searchStudentsByNameOrEmail(term, orgId, classId)
        setResults(data)
        setOpen(true)
      } finally {
        setIsSearching(false)
      }
    },
    [orgId, classId]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(student: StudentResult) {
    setOpen(false)
    setQuery('')
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const result = await enrollOrInviteByEmail(classId, student.email, orgId)
        if (result.already) {
          setError('This student is already enrolled.')
          return
        }
        if ('wrongRole' in result) {
          setError(`This account is not a student account.`)
          return
        }
        setSuccess(`${student.first_name} ${student.last_name} enrolled successfully.`)
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  function handleInviteByEmail(email: string) {
    setOpen(false)
    setQuery('')
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      try {
        const result = await enrollOrInviteByEmail(classId, email, orgId)
        if (result.already) {
          setError(
            (result as { status?: string }).status === 'pending'
              ? 'This email is already invited (pending account creation).'
              : 'This student is already enrolled.'
          )
          return
        }
        if ('wrongRole' in result) {
          setError(`This account is not a student account.`)
          return
        }
        if ('wrongOrg' in result) {
          setError(`This student belongs to a different school.`)
          return
        }
        const isPending = (result as { pending?: boolean }).pending
        setSuccess(
          isPending
            ? `Invitation saved for ${email}. They'll be enrolled automatically when they create an account.`
            : `${(result as { name?: string }).name ?? email} enrolled successfully.`
        )
      } catch {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  const showInviteOption =
    open && isEmailLike(query) && !results.some((r) => r.email.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Search combobox */}
        <div className="flex-1 space-y-1.5" ref={containerRef}>
          <Label htmlFor="student-search">Add student by name or email</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="student-search"
              ref={inputRef}
              className="pl-9"
              placeholder="Search by name or type an email address…"
              value={query}
              autoComplete="off"
              disabled={isPending}
              onChange={(e) => {
                setQuery(e.target.value)
                setError(null)
                setSuccess(null)
              }}
              onFocus={() => {
                if (results.length > 0 || isEmailLike(query)) setOpen(true)
              }}
            />

            {/* Dropdown */}
            {open && (query.trim().length >= 2) && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                {isSearching && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
                )}
                {!isSearching && results.length === 0 && !showInviteOption && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No students found.</div>
                )}
                {!isSearching && results.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(student)}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </button>
                ))}
                {showInviteOption && !isSearching && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground first:rounded-t-md last:rounded-b-md border-t border-border"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleInviteByEmail(query.trim())}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">Invite <span className="text-primary">{query.trim()}</span></p>
                      <p className="text-xs text-muted-foreground">No account yet — will enroll automatically when they sign up</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CSV upload button */}
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setCsvOpen(true)}
        >
          <Upload className="size-4" />
          Import CSV
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
      {isPending && <p className="text-sm text-muted-foreground">Adding student…</p>}

      <CSVUploadDialog
        classId={classId}
        orgId={orgId}
        open={csvOpen}
        onOpenChange={setCsvOpen}
      />
    </div>
  )
}
