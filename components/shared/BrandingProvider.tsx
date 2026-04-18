import type { Organization } from '@/types/app'

interface BrandingProviderProps {
  org: Pick<Organization, 'primary_color' | 'secondary_color'> | null
  children: React.ReactNode
}

export function BrandingProvider({ org, children }: BrandingProviderProps) {
  const primary = org?.primary_color ?? '#2563EB'
  const secondary = org?.secondary_color ?? '#7C3AED'

  return (
    <>
      <style>{`
        :root {
          --color-brand-primary-value: ${primary};
          --color-brand-secondary-value: ${secondary};
        }
      `}</style>
      {children}
    </>
  )
}
