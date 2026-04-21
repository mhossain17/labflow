'use client'
import { useRef, useState, useTransition } from 'react'
import { createOrganization } from '@/app/super-admin/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function slugify(value: string) {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = formRef.current?.elements.namedItem('slug') as HTMLInputElement | null
    if (slugInput && !slugInput.dataset.edited) {
      slugInput.value = slugify(e.target.value)
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.dataset.edited = '1'
    e.target.value = slugify(e.target.value)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createOrganization(formData)
        setOpen(false)
        formRef.current?.reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        <Plus className="h-4 w-4" />
        New Organization
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="org-name">School name</label>
            <Input id="org-name" name="name" placeholder="Westlake Science Academy" required onChange={handleNameChange} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="org-slug">
              Slug <span className="text-muted-foreground font-normal">(used in URLs)</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground text-sm">/</span>
              <Input id="org-slug" name="slug" placeholder="westlake" required onChange={handleSlugChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="org-primary">Primary color</label>
              <div className="flex items-center gap-2">
                <input type="color" id="org-primary" name="primary_color" defaultValue="#6366f1" className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-1" />
                <span className="text-xs text-muted-foreground">Brand</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="org-secondary">Secondary color</label>
              <div className="flex items-center gap-2">
                <input type="color" id="org-secondary" name="secondary_color" defaultValue="#a5b4fc" className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-1" />
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
