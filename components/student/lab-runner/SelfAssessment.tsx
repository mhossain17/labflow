'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveSelfAssessment } from '@/features/lab-runner/actions'
import { Loader2, CheckCircle2, ClipboardCheck } from 'lucide-react'

interface RubricItem {
  id: string
  title: string
  description: string | null
  max_points: number
}

interface RubricScore {
  rubric_item_id: string
  self_score: number | null
  teacher_score: number | null
  teacher_comment: string | null
}

interface TeacherGrade {
  total_score: number | null
  max_score: number | null
  letter_grade: string | null
  overall_comment: string | null
  graded_at: string
}

interface SelfAssessmentProps {
  labRunId: string
  rubricItems: RubricItem[]
  existingScores: RubricScore[]
  teacherGrade: TeacherGrade | null
}

export function SelfAssessment({ labRunId, rubricItems, existingScores, teacherGrade }: SelfAssessmentProps) {
  const [selfScores, setSelfScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const item of rubricItems) {
      const existing = existingScores.find((s) => s.rubric_item_id === item.id)
      initial[item.id] = existing?.self_score?.toString() ?? ''
    }
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasSelfScores = Object.values(selfScores).some((v) => v !== '')
  const hasTeacherGrade = !!teacherGrade

  async function handleSave() {
    setSaving(true)
    try {
      await saveSelfAssessment(
        labRunId,
        rubricItems.map((item) => ({
          rubricItemId: item.id,
          selfScore: Math.min(parseFloat(selfScores[item.id]) || 0, item.max_points),
        }))
      )
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <ClipboardCheck className="size-4" />
        Rubric & Self-Assessment
      </h2>

      <div className="space-y-3">
        {rubricItems.map((item) => {
          const score = existingScores.find((s) => s.rubric_item_id === item.id)
          return (
            <div key={item.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{item.max_points} pts</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Self-assessment input */}
                {!hasTeacherGrade && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your self-score</p>
                    <input
                      type="number"
                      min="0"
                      max={item.max_points}
                      value={selfScores[item.id] ?? ''}
                      onChange={(e) =>
                        setSelfScores((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm"
                      placeholder="0"
                    />
                  </div>
                )}
                {hasSelfScores && score?.self_score != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your self-score</p>
                    <p className="font-medium">{score.self_score} / {item.max_points}</p>
                  </div>
                )}
                {score?.teacher_score != null && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Teacher score</p>
                    <p className="font-medium text-primary">{score.teacher_score} / {item.max_points}</p>
                    {score.teacher_comment && (
                      <p className="text-xs text-muted-foreground mt-0.5">{score.teacher_comment}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {hasTeacherGrade && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 space-y-1">
          <p className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Final Grade: {teacherGrade.total_score} / {teacherGrade.max_score} pts
            {teacherGrade.letter_grade && ` · ${teacherGrade.letter_grade}`}
          </p>
          {teacherGrade.overall_comment && (
            <p className="text-sm text-green-700 dark:text-green-300">{teacherGrade.overall_comment}</p>
          )}
        </div>
      )}

      {!hasTeacherGrade && (
        <Button onClick={handleSave} disabled={saving || saved} size="sm" className="gap-2">
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          {saved ? 'Saved!' : 'Save Self-Assessment'}
        </Button>
      )}
    </section>
  )
}
