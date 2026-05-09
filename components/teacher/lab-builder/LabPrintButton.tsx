'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

export function LabPrintButton({ labId }: { labId: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/api/labs/${labId}/print`, '_blank')}
    >
      <FileDown className="size-4" />
      Student PDF
    </Button>
  )
}
