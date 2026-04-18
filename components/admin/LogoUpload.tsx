'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'

interface LogoUploadProps {
  currentLogoUrl: string | null
  orgId: string
  onUploadComplete: (newUrl: string) => void
}

export function LogoUpload({ currentLogoUrl, orgId, onUploadComplete }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      // Get signed URL
      const ext = file.name.split('.').pop()
      const filePath = `${orgId}/logo-${Date.now()}.${ext}`

      const res = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: 'org-logos',
          path: filePath,
          contentType: file.type,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to get upload URL')
      }

      const { signedUrl, path: storagePath } = await res.json()

      // PUT the file to the signed URL
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signedUrl, true)
      xhr.setRequestHeader('Content-Type', file.type)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Upload failed: ${xhr.statusText}`))
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.send(file)
      })

      // Build public URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/org-logos/${storagePath}`

      setPreview(publicUrl)
      onUploadComplete(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(null)
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-start gap-4">
      {/* Logo preview */}
      <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {preview ? (
          <Image
            src={preview}
            alt="Organization logo"
            width={80}
            height={80}
            className="object-contain"
            unoptimized
          />
        ) : (
          <span className="text-xs text-muted-foreground text-center px-1">No logo</span>
        )}
      </div>

      {/* Upload controls */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted disabled:opacity-50 cursor-pointer"
        >
          {uploading ? 'Uploading…' : 'Choose image'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">PNG, JPG, SVG up to 2 MB</p>
        {progress !== null && (
          <div className="w-40 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
