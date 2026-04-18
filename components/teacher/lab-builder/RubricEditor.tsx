'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { saveRubricItems } from '@/features/lab-builder/actions'
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react'

interface RubricItem {
  id?: string
  title: string
  description: string
  max_points: number
}

interface RubricEditorProps {
  labId: string
  initialItems: RubricItem[]
}

export function RubricEditor({ labId, initialItems }: RubricEditorProps) {
  const [items, setItems] = useState<RubricItem[]>(
    initialItems.length > 0
      ? initialItems
      : [{ title: '', description: '', max_points: 10 }]
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Define the criteria students will be graded on. Students can self-assess; teachers assign final scores.
      </p>

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
                  disabled={saving}
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
                  disabled={saving}
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
                disabled={saving}
                className="resize-none text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addItem} disabled={saving} className="w-full gap-2">
        <Plus className="size-4" />
        Add Criterion
      </Button>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Total: <strong>{totalPoints} points</strong>
        </p>
        <Button onClick={handleSave} disabled={saving || saved} className="gap-2">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saved ? 'Saved!' : 'Save Rubric'}
        </Button>
      </div>
    </div>
  )
}
