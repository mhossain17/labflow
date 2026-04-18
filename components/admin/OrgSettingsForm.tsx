'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateOrganization } from '@/features/admin/actions'

interface OrgData {
  id: string
  name: string
  slug: string
  footer_text: string | null
}

interface OrgSettingsFormProps {
  org: OrgData
}

export function OrgSettingsForm({ org }: OrgSettingsFormProps) {
  const [name, setName] = useState(org.name)
  const [footerText, setFooterText] = useState(org.footer_text ?? '')
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateOrganization(org.id, {
          name,
          footer_text: footerText || undefined,
        })
        toast.success('Settings saved')
      } catch {
        toast.error('Failed to save settings')
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
      <h2 className="text-base font-semibold">General</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="org-name" className="text-sm font-medium">
          School Name
        </label>
        <input
          id="org-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Slug <span className="text-muted-foreground font-normal">(read-only)</span>
        </label>
        <p className="h-9 flex items-center rounded-md border border-input bg-muted px-3 text-sm font-mono text-muted-foreground">
          {org.slug}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="footer-text" className="text-sm font-medium">
          Footer text <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="footer-text"
          type="text"
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          placeholder="© 2026 Your School Name"
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="pt-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="inline-flex h-9 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
