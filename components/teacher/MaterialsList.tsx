'use client'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteMaterial } from '@/features/teacher/materials-actions'
import { FileText, FileIcon, Trash2 } from 'lucide-react'

interface Material {
  id: string
  file_name: string
  mime_type: string
  storage_path: string
  size_bytes: number
  created_at: string
}

interface MaterialsListProps {
  materials: Material[]
}

function fileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return <FileText className="size-5 text-red-500" />
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileIcon className="size-5 text-blue-500" />
  return <FileIcon className="size-5 text-muted-foreground" />
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function DeleteButton({ id, storagePath }: { id: string; storagePath: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await deleteMaterial(id, storagePath)
          } catch (err) {
            console.error(err)
          }
        })
      }}
    >
      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
    </Button>
  )
}

export function MaterialsList({ materials }: MaterialsListProps) {
  if (materials.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No materials uploaded yet.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">File</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Size</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Uploaded</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((mat, idx) => (
            <tr
              key={mat.id}
              className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {fileIcon(mat.mime_type)}
                  <span className="font-medium truncate max-w-xs">{mat.file_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatBytes(mat.size_bytes)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(mat.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <DeleteButton id={mat.id} storagePath={mat.storage_path} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
