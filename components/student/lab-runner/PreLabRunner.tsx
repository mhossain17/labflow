'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { savePreLabResponse, markPrelabComplete } from '@/features/lab-runner/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { PreLabQuestion } from '@/types/app'

interface PreLabResponse {
  question_id: string
  response_text: string
}

interface Props {
  labRunId: string
  studentId: string
  questions: PreLabQuestion[]
  existingResponses: PreLabResponse[]
}

export function PreLabRunner({ labRunId, studentId, questions, existingResponses }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const r of existingResponses) {
      map[r.question_id] = r.response_text
    }
    return map
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sorted = [...questions].sort((a, b) => a.position - b.position)

  function handleChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    for (const q of sorted) {
      if (q.required && !answers[q.id]?.trim()) {
        newErrors[q.id] = 'This question is required.'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    startTransition(async () => {
      await Promise.all(
        sorted.map((q) =>
          savePreLabResponse(labRunId, q.id, studentId, answers[q.id] ?? '')
        )
      )
      await markPrelabComplete(labRunId)
      router.push(`/student/labs/${labRunId}/step/1`)
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Pre-Lab Questions</h2>
        <p className="text-sm text-muted-foreground">
          Answer all required questions before starting the lab.
        </p>
      </div>

      <div className="space-y-6">
        {sorted.map((q, idx) => (
          <div key={q.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {idx + 1}. {q.question_text}
              {q.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {q.question_type === 'short_answer' && (
              <Textarea
                rows={3}
                value={answers[q.id] ?? ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Your answer..."
                className={errors[q.id] ? 'border-destructive' : ''}
              />
            )}

            {q.question_type === 'multiple_choice' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleChange(q.id, opt)}
                      className="accent-primary"
                    />
                    <span className="text-sm group-hover:text-foreground">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.question_type === 'true_false' && (
              <div className="space-y-2">
                {['True', 'False'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleChange(q.id, opt)}
                      className="accent-primary"
                    />
                    <span className="text-sm group-hover:text-foreground">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {errors[q.id] && (
              <p className="text-xs text-destructive">{errors[q.id]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSubmit} disabled={isPending} size="lg">
          {isPending ? 'Submitting...' : 'Submit Pre-Lab'}
        </Button>
      </div>
    </div>
  )
}
