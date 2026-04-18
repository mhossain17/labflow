'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface StuckStepChartProps {
  data: Array<{ step: string; stuck: number; help: number }>
}

export function StuckStepChart({ data }: StuckStepChartProps) {
  const hasData = data.some(d => d.stuck > 0 || d.help > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No students are stuck on any steps yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="step"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            fontSize: '13px',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar dataKey="stuck" name="Stuck" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="help" name="Need Help" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  )
}
