'use client'
import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { bulkEnrollFromCSV } from '@/features/teacher/actions'
import { Upload, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react'

interface Props {
  classId: string
  orgId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ParsedRow {
  email: string
  rawLine: string
}

interface EnrollResult {
  email: string
  ok?: boolean
  pending?: boolean
  name?: string
  already?: boolean
  status?: string
  wrongRole?: string
  wrongOrg?: boolean
  error?: boolean
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const rows: ParsedRow[] = []
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  for (const line of lines) {
    // Handle quoted and unquoted CSV — extract all email-like tokens
    const cells = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim())
    for (const cell of cells) {
      if (emailRe.test(cell)) {
        rows.push({ email: cell.toLowerCase(), rawLine: line })
        break // one email per row
      }
    }
  }
  // Deduplicate
  const seen = new Set<string>()
  return rows.filter(({ email }) => {
    if (seen.has(email)) return false
    seen.add(email)
    return true
  })
}

function ResultIcon({ result }: { result: EnrollResult }) {
  if (result.ok && !result.pending)
    return <CheckCircle2 className="size-4 text-green-500 shrink-0" />
  if (result.ok && result.pending)
    return <Clock className="size-4 text-amber-500 shrink-0" />
  if (result.already)
    return <CheckCircle2 className="size-4 text-muted-foreground shrink-0" />
  return <AlertCircle className="size-4 text-destructive shrink-0" />
}

function resultLabel(result: EnrollResult): string {
  if (result.ok && !result.pending) return result.name ? `Enrolled — ${result.name}` : 'Enrolled'
  if (result.ok && result.pending) return 'Invited — account pending'
  if (result.already && result.status === 'pending') return 'Already invited (pending)'
  if (result.already) return 'Already enrolled'
  if (result.wrongRole) return `Not a student account`
  if (result.wrongOrg) return 'Different school'
  if (result.error) return 'Error — skipped'
  return 'Unknown'
}

export function CSVUploadDialog({ classId, orgId, open, onOpenChange }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [results, setResults] = useState<EnrollResult[] | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setRows([])
    setResults(null)
    setFileError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() {
    reset()
    onOpenChange(false)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    setResults(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setFileError('Please upload a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setFileError('No valid email addresses found in this file.')
        return
      }
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  function handleImport() {
    startTransition(async () => {
      const emails = rows.map((r) => r.email)
      const data = await bulkEnrollFromCSV(classId, emails, orgId)
      setResults(data)
    })
  }

  if (!open) return null

  const enrolled = results?.filter((r) => r.ok && !r.pending).length ?? 0
  const invited = results?.filter((r) => r.ok && r.pending).length ?? 0
  const skipped = results?.filter((r) => !r.ok).length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold text-base">Import class list from CSV</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              One student per row. Must include an email address column.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* File input */}
          {!results && (
            <>
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-6 py-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {rows.length > 0
                    ? `${rows.length} student${rows.length === 1 ? '' : 's'} found — click to change`
                    : 'Click to choose a CSV file'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Columns like: First Name, Last Name, Email
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={handleFile}
                />
              </label>

              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}

              {/* Preview */}
              {rows.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.email} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1.5">{row.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Results */}
          {results && (
            <>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-4" />
                  {enrolled} enrolled
                </span>
                {invited > 0 && (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Clock className="size-4" />
                    {invited} invited
                  </span>
                )}
                {skipped > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertCircle className="size-4" />
                    {skipped} skipped
                  </span>
                )}
              </div>
              <div className="rounded-lg border border-border overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.email} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="px-3 py-1.5">{r.email}</td>
                        <td className="px-3 py-1.5">
                          <span className="flex items-center gap-1.5">
                            <ResultIcon result={r} />
                            {resultLabel(r)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!results && (
            <Button
              onClick={handleImport}
              disabled={rows.length === 0 || isPending}
            >
              <Upload className="size-4" />
              {isPending ? 'Importing…' : `Import ${rows.length} student${rows.length === 1 ? '' : 's'}`}
            </Button>
          )}
          {results && (
            <Button variant="outline" onClick={reset}>
              Import another file
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
