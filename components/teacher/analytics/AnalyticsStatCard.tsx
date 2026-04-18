interface AnalyticsStatCardProps {
  label: string
  value: string | number
  description?: string
  className?: string
}

export function AnalyticsStatCard({ label, value, description, className }: AnalyticsStatCardProps) {
  return (
    <div className={`rounded-xl border bg-card p-5 ring-1 ring-foreground/10 ${className ?? ''}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
