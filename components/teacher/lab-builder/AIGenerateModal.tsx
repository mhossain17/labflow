'use client'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2 } from 'lucide-react'

interface GeneratedLab {
  title: string
  overview: string
  objectives: string[]
  standards?: string[]
  materials_list?: string[]
  safety_notes?: string
  background?: string
  pre_lab_questions?: Array<{
    question_text: string
    question_type: 'short_answer' | 'multiple_choice' | 'true_false'
    options?: string[]
  }>
  steps: Array<{
    title: string
    instructions: string
    checkpoint?: string
    reflection_prompt?: string
    troubleshooting?: string
    data_entry_fields?: Array<{
      label: string
      type: 'text' | 'number'
      unit?: string
      required: boolean
    }>
  }>
}

interface AIGenerateModalProps {
  onGenerated: (lab: GeneratedLab) => void
  aiEnabled?: boolean | null
}

const GRADE_LEVELS = ['K-2', '3-5', '6-8', '9-10', '11-12']

export function AIGenerateModal({ onGenerated, aiEnabled }: AIGenerateModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    prompt: '',
    gradeLevel: '6-8',
    subject: '',
    duration: '50',
    standards: '',
    materials: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGenerate() {
    setError(null)
    if (!form.prompt.trim()) {
      setError('Please describe the lab topic.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Generation failed.')
        return
      }
      onGenerated(json.lab as GeneratedLab)
      setOpen(false)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Hide entirely when the flag is explicitly false
  if (aiEnabled === false) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="gap-2" disabled={aiEnabled === null}>
          <Sparkles className="size-4 text-purple-500" />
          Generate with AI
        </Button>
      } />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-purple-500" />
            Generate Lab with AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ai-prompt">
              Topic / Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ai-prompt"
              placeholder="e.g. Investigate how temperature affects enzyme activity using hydrogen peroxide and liver..."
              rows={3}
              value={form.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai-grade">Grade Level</Label>
              <select
                id="ai-grade"
                value={form.gradeLevel}
                onChange={(e) => handleChange('gradeLevel', e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-subject">Subject</Label>
              <Input
                id="ai-subject"
                placeholder="e.g. Biology"
                value={form.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-duration">Duration (minutes)</Label>
            <Input
              id="ai-duration"
              type="number"
              value={form.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              className="max-w-32"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-standards">Standards <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="ai-standards"
              placeholder="e.g. NGSS HS-LS1-1"
              value={form.standards}
              onChange={(e) => handleChange('standards', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-materials">Available Materials <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              id="ai-materials"
              placeholder="e.g. beakers, hot plates, thermometers, hydrogen peroxide..."
              rows={2}
              value={form.materials}
              onChange={(e) => handleChange('materials', e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating your lab...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
