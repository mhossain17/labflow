'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { AIGenerateModal } from '@/components/teacher/lab-builder/AIGenerateModal'
import { createLab } from '@/features/lab-builder/actions'
import { Pencil, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

interface Props {
  aiEnabled: boolean
}

export function NewLabClient({ aiEnabled }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleManual() {
    setCreating(true)
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const { id, organization_id } = await res.json()
        const lab = await createLab({
          title: 'Untitled Lab',
          teacher_id: id,
          organization_id,
        })
        router.push(`/teacher/labs/${lab.id}/edit`)
      }
    } catch {
      setCreating(false)
    }
  }

  async function handleGenerated(generatedLab: GeneratedLab) {
    setCreating(true)
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const { id, organization_id } = await res.json()
        const lab = await createLab({
          title: generatedLab.title,
          teacher_id: id,
          organization_id,
          overview: generatedLab.overview,
          objectives: generatedLab.objectives,
          standards: generatedLab.standards,
          materials_list: generatedLab.materials_list,
          safety_notes: generatedLab.safety_notes,
          background: generatedLab.background,
          ai_generated: true,
        })
        router.push(`/teacher/labs/${lab.id}/edit?generated=1`)
      }
    } catch {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/teacher/labs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to labs
        </Link>
        <h1 className="text-2xl font-bold">Create New Lab</h1>
        <p className="text-muted-foreground mt-1">
          Choose how you want to build your lab activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button onClick={handleManual} disabled={creating} className="text-left">
          <Card className="h-full cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Pencil className="size-5 text-primary" />
                </div>
                <CardTitle>Build Manually</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Start with a blank template and build your lab step by step. Full control over every detail.
              </CardDescription>
            </CardContent>
          </Card>
        </button>

        {aiEnabled && (
          <Card className="h-full hover:shadow-md transition-shadow hover:border-purple-500/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2.5">
                  <Sparkles className="size-5 text-purple-500" />
                </div>
                <CardTitle>Generate with AI</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription>
                Describe your lab topic and let AI build a complete draft for you to refine.
              </CardDescription>
              <AIGenerateModal onGenerated={handleGenerated} aiEnabled={aiEnabled} />
            </CardContent>
          </Card>
        )}
      </div>

      {creating && (
        <div className="text-center text-sm text-muted-foreground animate-pulse">
          Creating your lab...
        </div>
      )}
    </div>
  )
}
