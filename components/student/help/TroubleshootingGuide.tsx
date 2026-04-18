import { Button } from '@/components/ui/button'
import { Wrench } from 'lucide-react'

interface Props {
  troubleshooting: string | null
  onProceed: () => void
}

export function TroubleshootingGuide({ troubleshooting, onProceed }: Props) {
  if (!troubleshooting) {
    // No guide — auto-proceed, caller should handle this
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Wrench className="size-4" />
        Troubleshooting Guide
      </div>
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
        {troubleshooting}
      </div>
      <Button variant="outline" onClick={onProceed} className="w-full">
        I tried this but still need help →
      </Button>
    </div>
  )
}
