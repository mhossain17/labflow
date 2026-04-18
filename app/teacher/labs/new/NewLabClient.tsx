'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createLab, createLabWithContent } from '@/features/lab-builder/actions'

interface Props {
  aiEnabled: boolean
}

const GRADE_LEVELS = ['K-2', '3-5', '6-8', '9-10', '11-12']

type Phase = 'idle' | 'generating' | 'saving' | 'done'

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  generating: 'Generating your lab with AI…',
  saving: 'Saving your lab…',
  done: 'Done! Opening editor…',
}

export function NewLabClient({ aiEnabled }: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [gradeLevel, setGradeLevel] = useState('6-8')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('45')
  const [materials, setMaterials] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const isLoading = phase !== 'idle' && phase !== 'done'

  async function handleGenerate() {
    if (!prompt.trim() || isLoading) return
    setError(null)
    setPhase('generating')

    try {
      // 1. Ask AI to build the lab
      const genRes = await fetch('/api/ai/generate-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, gradeLevel, subject, duration, materials }),
      })
      if (!genRes.ok) {
        const err = await genRes.json()
        throw new Error(err.error ?? 'Generation failed')
      }
      const { lab: generated } = await genRes.json()

      setPhase('saving')

      // 2. Get teacher identity
      const meRes = await fetch('/api/me')
      if (!meRes.ok) throw new Error('Could not load your account')
      const { id: teacherId, organization_id } = await meRes.json()

      // 3. Create lab + all steps + all questions in one atomic server action
      const lab = await createLabWithContent({
        title: generated.title,
        teacher_id: teacherId,
        organization_id,
        overview: generated.overview,
        objectives: generated.objectives ?? [],
        standards: generated.standards ?? [],
        materials_list: generated.materials_list ?? [],
        safety_notes: generated.safety_notes,
        background: generated.background,
        ai_generated: true,
        steps: generated.steps ?? [],
        pre_lab_questions: generated.pre_lab_questions ?? [],
      })

      setPhase('done')
      router.push(`/teacher/labs/${lab.id}/edit?step=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPhase('idle')
    }
  }

  async function handleManual() {
    setPhase('saving')
    try {
      const res = await fetch('/api/me')
      if (!res.ok) throw new Error()
      const { id, organization_id } = await res.json()
      const lab = await createLab({ title: 'Untitled Lab', teacher_id: id, organization_id })
      router.push(`/teacher/labs/${lab.id}/edit?step=1`)
    } catch {
      setPhase('idle')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
      <div>
        <Link
          href="/teacher/labs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to labs
        </Link>
        <h1 className="text-2xl font-bold">Create a New Lab</h1>
        <p className="text-muted-foreground mt-1">
          {aiEnabled
            ? 'Describe what you want and AI will build a full draft for you to edit.'
            : 'Start with a blank lab and fill in each section.'}
        </p>
      </div>

      {aiEnabled ? (
        <div className="space-y-5">
          {/* Main prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-base font-medium">
              What should this lab be about?
            </Label>
            <Textarea
              id="prompt"
              rows={5}
              placeholder={`e.g. "A lab where 9th grade chemistry students mix household acids and bases, measure pH changes using litmus paper, and graph their results. About 50 minutes."`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              className="text-base resize-none"
            />
          </div>

          {/* Optional refinement */}
          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            {showDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {showDetails ? 'Fewer options' : 'Add details (optional)'}
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 bg-muted/30">
              <div className="space-y-1.5">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <select
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g. Chemistry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="180"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="materials">Available Materials</Label>
                <Input
                  id="materials"
                  placeholder="e.g. beakers, litmus paper"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">{error}</p>
          )}

          {/* Loading feedback */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Loader2 className="size-4 animate-spin" />
              {PHASE_LABELS[phase]}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="w-full gap-2"
            >
              <Sparkles className="size-4" />
              Generate Lab with AI
            </Button>
            <button
              type="button"
              onClick={handleManual}
              disabled={isLoading}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
            >
              Start from scratch instead
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            AI lab generation is not enabled for your organization. Contact your admin to enable it.
          </p>
          <Button onClick={handleManual} disabled={isLoading} size="lg">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            Start Building
          </Button>
        </div>
      )}
    </div>
  )
}
