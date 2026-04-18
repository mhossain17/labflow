'use client'
import { useState, useRef, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createMaterialRecord } from '@/features/teacher/materials-actions'
import { Upload, FileText } from 'lucide-react'

interface MaterialUploadDialogProps {
  teacherId: string
  organizationId: string
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export function MaterialUploadDialog({ teacherId, organizationId }: MaterialUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only PDF, Word, and text files are allowed.')
      return
    }
    setError(null)
    setFile(f)
  }

  function handleUpload() {
    if (!file) return
    setError(null)
    startTransition(async () => {
      try {
        // Get signed URL
        const storagePath = `${teacherId}/${Date.now()}-${file.name}`
        const signRes = await fetch('/api/storage/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucket: 'teacher-materials',
            path: storagePath,
            contentType: file.type,
          }),
        })
        if (!signRes.ok) {
          setError('Failed to get upload URL.')
          return
        }
        const { signedUrl } = await signRes.json()

        // Upload with progress tracking via XHR
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100))
            }
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve()
            else reject(new Error('Upload failed'))
          }
          xhr.onerror = () => reject(new Error('Network error'))
          xhr.open('PUT', signedUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(file)
        })

        // Create DB record
        await createMaterialRecord({
          teacher_id: teacherId,
          organization_id: organizationId,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          size_bytes: file.size,
        })

        setFile(null)
        setProgress(0)
        if (inputRef.current) inputRef.current.value = ''
        setOpen(false)
      } catch (err) {
        console.error(err)
        setError('Upload failed. Please try again.')
        setProgress(0)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button>
          <Upload className="size-4" />
          Upload Material
        </Button>
      } />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Teaching Material</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="size-8 text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select a file
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, or text files
                </p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="sr-only"
            onChange={handleFileChange}
          />
          {progress > 0 && (
            <div className="space-y-1.5">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">{progress}%</p>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || isPending}>
            {isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
