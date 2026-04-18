'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { toggleFeatureFlag } from '@/features/admin/actions'

interface FeatureFlagToggleProps {
  orgId: string
  flagKey: string
  label: string
  description: string
  initialEnabled: boolean
}

export function FeatureFlagToggle({
  orgId,
  flagKey,
  label,
  description,
  initialEnabled,
}: FeatureFlagToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (checked: boolean) => {
    // Optimistic update
    setEnabled(checked)

    startTransition(async () => {
      try {
        await toggleFeatureFlag(orgId, flagKey, checked)
        toast.success(`${label} ${checked ? 'enabled' : 'disabled'}`)
      } catch {
        // Revert on error
        setEnabled(!checked)
        toast.error(`Failed to update ${label}`)
      }
    })
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={label}
      />
    </div>
  )
}
