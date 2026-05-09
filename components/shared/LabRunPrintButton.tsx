'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

interface LabRunPrintButtonProps {
  labRunId: string
  label?: string
  variant?: 'outline' | 'default' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export function LabRunPrintButton({
  labRunId,
  label = 'Print Lab',
  variant = 'outline',
  size = 'sm',
}: LabRunPrintButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.open(`/api/lab-runs/${labRunId}/print`, '_blank')}
    >
      <FileDown className="size-4" />
      {label}
    </Button>
  )
}
