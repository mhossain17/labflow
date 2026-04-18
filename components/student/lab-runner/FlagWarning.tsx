import { TriangleAlert } from 'lucide-react'

interface FlagWarningProps {
  message: string
}

export function FlagWarning({ message }: FlagWarningProps) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
      <TriangleAlert className="size-3.5 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
