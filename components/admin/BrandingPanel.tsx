'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ColorPicker } from './ColorPicker'
import { LogoUpload } from './LogoUpload'
import { updateOrganization, updateOrganizationLogo } from '@/features/admin/actions'

interface OrgData {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  footer_text: string | null
}

interface BrandingPanelProps {
  org: OrgData
}

export function BrandingPanel({ org }: BrandingPanelProps) {
  const [name, setName] = useState(org.name)
  const [primaryColor, setPrimaryColor] = useState(org.primary_color || '#2563EB')
  const [secondaryColor, setSecondaryColor] = useState(org.secondary_color || '#7C3AED')
  const [footerText, setFooterText] = useState(org.footer_text ?? '')
  const [logoUrl, setLogoUrl] = useState(org.logo_url)
  const [isPending, startTransition] = useTransition()

  const handleLogoUploadComplete = (newUrl: string) => {
    setLogoUrl(newUrl)
    startTransition(async () => {
      try {
        await updateOrganizationLogo(org.id, newUrl)
        toast.success('Logo updated successfully')
      } catch {
        toast.error('Failed to save logo URL')
      }
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateOrganization(org.id, {
          name,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          footer_text: footerText || undefined,
        })
        toast.success('Branding saved successfully')
      } catch {
        toast.error('Failed to save branding')
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column — form */}
      <div className="flex flex-col gap-6">
        {/* School name */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold">School Information</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="school-name" className="text-sm font-medium">
              School Name
            </label>
            <input
              id="school-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Slug</label>
            <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md">
              {org.slug}
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold">Organization Logo</h2>
          <LogoUpload
            currentLogoUrl={logoUrl}
            orgId={org.id}
            onUploadComplete={handleLogoUploadComplete}
          />
        </div>

        {/* Colors */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold">Brand Colors</h2>
          <div className="flex flex-col gap-4">
            <ColorPicker
              label="Primary color"
              value={primaryColor}
              onChange={setPrimaryColor}
            />
            <ColorPicker
              label="Secondary color"
              value={secondaryColor}
              onChange={setSecondaryColor}
            />
          </div>
        </div>

        {/* Footer text */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold">Footer</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="footer-text" className="text-sm font-medium">
              Footer text <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="footer-text"
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="© 2026 Westview High School"
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save branding'}
        </button>
      </div>

      {/* Right column — live preview */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Live Preview</h2>
        <div className="rounded-lg border border-border overflow-hidden shadow-sm">
          {/* Card header */}
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ backgroundColor: primaryColor }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="h-8 w-8 rounded object-contain bg-white/20"
              />
            ) : (
              <div className="h-8 w-8 rounded bg-white/30 flex items-center justify-center text-white text-xs font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-white font-semibold text-sm">{name || 'School Name'}</span>
          </div>

          {/* Card body */}
          <div className="bg-card p-6 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              This is how your brand colors will appear in LabFlow.
            </p>

            <div className="flex gap-2 flex-wrap">
              {/* Primary button */}
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-white shadow"
                style={{ backgroundColor: primaryColor }}
              >
                Primary action
              </button>

              {/* Secondary button */}
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-white shadow"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary action
              </button>
            </div>

            {/* Sample badge */}
            <div className="flex gap-2 items-center">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Active
              </span>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                AI Lab
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Lab progress</span>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full w-3/5"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
            </div>

            {/* Footer text preview */}
            {footerText && (
              <p className="text-xs text-muted-foreground border-t border-border pt-4 mt-2">
                {footerText}
              </p>
            )}
          </div>
        </div>

        {/* Color swatches */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 items-center">
            <div
              className="h-10 w-16 rounded-md border border-border"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-xs text-muted-foreground font-mono">{primaryColor}</span>
          </div>
          <div className="flex flex-col gap-1 items-center">
            <div
              className="h-10 w-16 rounded-md border border-border"
              style={{ backgroundColor: secondaryColor }}
            />
            <span className="text-xs text-muted-foreground font-mono">{secondaryColor}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
