'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveRubricItems } from '@/features/lab-builder/actions'
import { Plus, Trash2, Loader2, GripVertical, Sparkles } from 'lucide-react'

interface RubricItem {
  id?: string
  title: string
  description: string
  max_points: number
}

interface RubricEditorProps {
  labId: string
  initialItems: RubricItem[]
  context?: {
    labTitle?: string
    labOverview?: string
    objectives?: string[]
    standards?: string[]
    steps?: Array<{ title?: string; instructions?: string }>
  }
}

export function RubricEditor({ labId, initialItems, context }: RubricEditorProps) {
  const [items, setItems] = useState<RubricItem[]>(
    initialItems.length > 0
      ? initialItems
      : [{ title: '', description: '', max_points: 10 }]
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')

  const totalPoints = items.reduce((sum, item) => sum + (item.max_points || 0), 0)

  function addItem() {
    setItems((prev) => [...prev, { title: '', description: '', max_points: 10 }])
    setSaved(false)
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  function updateItem(index: number, field: keyof RubricItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveRubricItems(
        labId,
        items
          .filter((item) => item.title.trim())
          .map((item, i) => ({
            title: item.title.trim(),
            description: item.description.trim() || undefined,
            max_points: item.max_points || 0,
            position: i,
          }))
      )
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateRubric() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch('/api/ai/generate-rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labTitle: context?.labTitle,
          labOverview: context?.labOverview,
          objectives: context?.objectives ?? [],
          standards: context?.standards ?? [],
          steps: context?.steps ?? [],
          prompt,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to generate rubric')
      }

      const json = await res.json()
      const mappedItems: Array<RubricItem | null> = Array.isArray(json.items)
        ? json.items.map((item: unknown) => {
            if (!item || typeof item !== 'object') return null
            const obj = item as Record<string, unknown>
            const title = typeof obj.title === 'string' ? obj.title.trim() : ''
            if (!title) return null
            return {
              title,
              description: typeof obj.description === 'string' ? obj.description : '',
              max_points: Number.isFinite(Number(obj.max_points))
                ? Math.max(1, Math.min(100, Math.round(Number(obj.max_points))))
                : 10,
            }
          })
        : []

      const generatedItems: RubricItem[] = mappedItems.filter(
        (item): item is RubricItem => item !== null
      )

      if (!generatedItems.length) {
        throw new Error('AI returned no rubric criteria. Please try again.')
      }

      setItems(generatedItems)
      setSaved(false)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate rubric')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define the criteria students will be graded on. Students can self-assess; teachers assign final scores.
      </p>

      <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
            Generate rubric criteria with AI
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleGenerateRubric}
            disabled={generating}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? 'Generating…' : 'Generate with AI'}
          </Button>
        </div>
        <Textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Optional: emphasize specific standards, point weighting, or focus areas."
          disabled={generating}
          className="text-sm resize-none"
        />
        {generateError && <p className="text-xs text-destructive">{generateError}</p>}
        <p className="text-xs text-muted-foreground">
          AI generation replaces the current rubric list in this editor. Review and adjust before saving.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Criterion {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                disabled={saving}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1">
                <Label htmlFor={`title-${index}`} className="text-xs">Criterion Title</Label>
                <Input
                  id={`title-${index}`}
                  placeholder="e.g. Hypothesis Quality"
                  value={item.title}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  disabled={saving || generating}
                />
              </div>
              <div className="space-y-1 w-24">
                <Label htmlFor={`pts-${index}`} className="text-xs">Max Points</Label>
                <Input
                  id={`pts-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  value={item.max_points}
                  onChange={(e) => updateItem(index, 'max_points', parseInt(e.target.value) || 0)}
                  disabled={saving || generating}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`desc-${index}`} className="text-xs">Description (optional)</Label>
              <Textarea
                id={`desc-${index}`}
                rows={2}
                placeholder="Describe what earns full points for this criterion…"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                disabled={saving || generating}
                className="resize-none text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addItem} disabled={saving || generating} className="w-full gap-2">
        <Plus className="size-4" />
        Add Criterion
      </Button>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Total: <strong>{totalPoints} points</strong>
        </p>
        <Button onClick={handleSave} disabled={saving || generating || saved} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saved ? 'Saved!' : 'Save Rubric'}
        </Button>
      </div>
    </div>
  )
}
