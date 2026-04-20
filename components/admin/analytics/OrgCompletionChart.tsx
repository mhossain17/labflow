'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CompletionTrendPoint } from '@/features/analytics/admin-queries'

function formatWeek(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function OrgCompletionChart({ data }: { data: CompletionTrendPoint[] }) {
  const chartData = data.map(p => ({
    week: formatWeek(p.week_start),
    completions: p.completed_count,
  }))

  if (data.every(p => p.completed_count === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No completions in the last 8 weeks.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(val) => [val, 'Completions']}
        />
        <Line
          type="monotone"
          dataKey="completions"
          stroke="var(--color-primary, hsl(var(--primary)))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
