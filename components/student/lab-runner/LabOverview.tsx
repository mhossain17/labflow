import { Clock, FlaskConical, ShieldAlert, Target, ClipboardCheck } from 'lucide-react'
import type { Lab } from '@/types/app'

interface RubricItem {
  id: string
  title: string
  description: string | null
  max_points: number
}

interface LabOverviewProps {
  lab: Lab
  rubricItems?: RubricItem[]
}

export function LabOverview({ lab, rubricItems }: LabOverviewProps) {
  return (
    <div className="space-y-6">
      {lab.overview && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Overview</h2>
          <p className="text-base leading-relaxed">{lab.overview}</p>
        </section>
      )}

      {lab.objectives?.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="size-4" />
            Learning Objectives
          </h2>
          <ul className="space-y-1.5">
            {lab.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                  {i + 1}
                </span>
                {obj}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lab.materials_list?.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <FlaskConical className="size-4" />
            Materials
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {lab.materials_list.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lab.safety_notes && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <ShieldAlert className="size-4" />
            Safety Notes
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
            {lab.safety_notes}
          </p>
        </section>
      )}

      {lab.estimated_minutes && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          Estimated time: {lab.estimated_minutes} minutes
        </div>
      )}

      {rubricItems && rubricItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <ClipboardCheck className="size-4" />
            Grading Rubric
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Criterion</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Points</th>
                </tr>
              </thead>
              <tbody>
                {rubricItems.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <td className="px-3 py-2 font-medium">{item.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.description ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{item.max_points}</td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-medium">
                  <td className="px-3 py-2" colSpan={2}>Total</td>
                  <td className="px-3 py-2 text-right">{rubricItems.reduce((s, i) => s + i.max_points, 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
