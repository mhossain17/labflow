'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveStudentGrade } from '@/features/teacher/actions'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface RubricItem {
  id: string
  title: string
  description: string | null
  max_points: number
}

interface RubricScore {
  rubric_item_id: string
  teacher_score: number | null
  teacher_comment: string | null
  self_score: number | null
}

interface GradingSheetProps {
  labRunId: string
  teacherId: string
  labId: string
  studentName: string
  rubricItems: RubricItem[]
  existingScores: RubricScore[]
  existingGrade: {
    total_score: number | null
    max_score: number | null
    letter_grade: string | null
    overall_comment: string | null
  } | null
}

export function GradingSheet({
  labRunId,
  teacherId,
  labId,
  studentName,
  rubricItems,
  existingScores,
  existingGrade,
}: GradingSheetProps) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, { score: string; comment: string }>>(() => {
    const initial: Record<string, { score: string; comment: string }> = {}
    for (const item of rubricItems) {
      const existing = existingScores.find((s) => s.rubric_item_id === item.id)
      initial[item.id] = {
        score: existing?.teacher_score?.toString() ?? '',
        comment: existing?.teacher_comment ?? '',
      }
    }
    return initial
  })
  const [letterGrade, setLetterGrade] = useState(existingGrade?.letter_grade ?? '')
  const [overallComment, setOverallComment] = useState(existingGrade?.overall_comment ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const maxScore = rubricItems.reduce((sum, item) => sum + item.max_points, 0)
  const totalScore = Object.entries(scores).reduce((sum, [itemId, val]) => {
    const item = rubricItems.find((r) => r.id === itemId)
    if (!item) return sum
    return sum + Math.min(parseFloat(val.score) || 0, item.max_points)
  }, 0)

  async function handleSave() {
    setSaving(true)
    try {
      await saveStudentGrade(
        labRunId,
        teacherId,
        rubricItems.map((item) => ({
          rubricItemId: item.id,
          teacherScore: Math.min(parseFloat(scores[item.id]?.score) || 0, item.max_points),
          teacherComment: scores[item.id]?.comment || undefined,
        })),
        {
          letterGrade: letterGrade || undefined,
          overallComment: overallComment || undefined,
          totalScore,
          maxScore,
        }
      )
      setSaved(true)
      setTimeout(() => router.push(`/teacher/labs/${labId}/grade`), 1000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Grading submission for</p>
          <h2 className="text-lg font-semibold">{studentName}</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Running total</p>
          <p className="text-2xl font-bold">{totalScore} / {maxScore}</p>
        </div>
      </div>

      {rubricItems.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-muted-foreground">
          No rubric criteria defined for this lab. Add criteria in the lab editor (Rubric step).
        </div>
      ) : (
        <div className="space-y-4">
          {rubricItems.map((item) => {
            const selfScore = existingScores.find((s) => s.rubric_item_id === item.id)?.self_score
            return (
              <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">Max: {item.max_points} pts</span>
                </div>

                {selfScore !== null && selfScore !== undefined && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
                    Student self-assessed: {selfScore} / {item.max_points} pts
                  </p>
                )}

                <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                  <div className="space-y-1 w-24">
                    <Label htmlFor={`score-${item.id}`} className="text-xs">Score</Label>
                    <Input
                      id={`score-${item.id}`}
                      type="number"
                      min="0"
                      max={item.max_points}
                      value={scores[item.id]?.score ?? ''}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], score: e.target.value },
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`comment-${item.id}`} className="text-xs">Comment (optional)</Label>
                    <Textarea
                      id={`comment-${item.id}`}
                      rows={2}
                      className="resize-none text-sm"
                      value={scores[item.id]?.comment ?? ''}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], comment: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="font-medium">Overall Grade</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="letterGrade" className="text-xs">Letter Grade (optional)</Label>
            <Input
              id="letterGrade"
              placeholder="e.g. A, B+, 88%"
              value={letterGrade}
              onChange={(e) => setLetterGrade(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="overallComment" className="text-xs">Overall Comment (optional)</Label>
          <Textarea
            id="overallComment"
            rows={3}
            className="resize-none text-sm"
            placeholder="Overall feedback for the student…"
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving || saved} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saved ? (
            <>
              <CheckCircle2 className="size-4" />
              Saved!
            </>
          ) : (
            'Save Grade'
          )}
        </Button>
      </div>
    </div>
  )
}
