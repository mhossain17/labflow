import { Badge } from '@/components/ui/badge'
import type { LabStatus } from '@/types/app'
import { cn } from '@/lib/utils'

interface LabStatusBadgeProps {
  status: LabStatus
  className?: string
}

const statusConfig: Record<LabStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-border',
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  archived: {
    label: 'Archived',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  },
}

export function LabStatusBadge({ status, className }: LabStatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
