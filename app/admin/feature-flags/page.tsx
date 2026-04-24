import { requireRole } from '@/lib/auth/role-guard'
import { getProfile } from '@/lib/auth/session'
import { listFeatureFlags } from '@/features/admin/queries'
import { FeatureFlagToggle } from '@/components/admin/FeatureFlagToggle'

const AI_FLAGS = new Set(['ai_lab_generation', 'help_chat'])

const FLAG_META: Record<string, { label: string; description: string }> = {
  ai_lab_generation: {
    label: 'AI Lab Generation',
    description: 'Allow teachers to generate lab drafts using AI',
  },
  help_chat: {
    label: 'AI Student Help',
    description: 'Allow students to get AI-guided help during labs',
  },
  analytics: {
    label: 'Analytics Dashboard',
    description: 'Show analytics and insights in teacher dashboard',
  },
}

const ALL_FLAGS = Object.keys(FLAG_META)

export default async function FeatureFlagsPage() {
  await requireRole(['school_admin', 'super_admin'])

  const profile = await getProfile()
  if (!profile || !profile.organization_id) return null

  const orgId = profile.organization_id
  const flags = await listFeatureFlags(orgId)

  // Build a map of flagKey → enabled, defaulting to false for missing rows
  const flagMap: Record<string, boolean> = {}
  for (const flag of flags) {
    flagMap[flag.flag_key] = flag.enabled
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toggle features on or off for your organization.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card px-6 divide-y divide-border">
        {ALL_FLAGS.map((flagKey) => {
          const meta = FLAG_META[flagKey]
          return (
            <div key={flagKey}>
              <FeatureFlagToggle
                orgId={orgId}
                flagKey={flagKey}
                label={meta.label}
                description={meta.description}
                initialEnabled={flagMap[flagKey] ?? false}
              />
              {AI_FLAGS.has(flagKey) && (
                <p className="pb-3 -mt-1 text-xs text-amber-700 dark:text-amber-400">
                  When enabled, student lab help conversations are sent to Anthropic&apos;s Claude API for processing.
                  Review{' '}
                  <a
                    href="https://www.anthropic.com/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:opacity-80"
                  >
                    Anthropic&apos;s privacy policy
                  </a>
                  {' '}and obtain a Data Processing Agreement before enabling in production.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
