import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { checkRateLimit, getOrgId } from '@/lib/ai/rate-limit'

type GeneratedLabStep = {
  title: string
  instructions: string
  checkpoint?: string
  reflection_prompt?: string
  troubleshooting?: string
  data_entry_fields?: Array<{ label: string; type: 'text' | 'number'; unit?: string; required: boolean }>
}

type GeneratedPreLabQuestion = {
  question_text: string
  question_type: 'short_answer' | 'multiple_choice' | 'true_false'
  options?: string[]
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseNumberedSteps(text: string): GeneratedLabStep[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const numbered = lines.filter((line) => /^\d+[\).:\-]\s+/.test(line))
  if (numbered.length === 0) return []

  return numbered
    .map((line, i) => {
      const content = line.replace(/^\d+[\).:\-]\s+/, '').trim()
      if (!content) return null
      return {
        title: `Step ${i + 1}`,
        instructions: content,
      }
    })
    .filter((step): step is GeneratedLabStep => step !== null)
}

function normalizeGeneratedLab(rawInput: unknown, prompt: string) {
  const raw = (typeof rawInput === 'object' && rawInput !== null ? rawInput : {}) as Record<string, unknown>

  const title = asTrimmedString(raw.title) ?? 'AI Generated Lab'
  const overview = asTrimmedString(raw.overview) ?? 'Students will complete a guided lab investigation.'
  const safety_notes = asTrimmedString(raw.safety_notes) ?? undefined
  const background = asTrimmedString(raw.background) ?? undefined

  const objectives = (Array.isArray(raw.objectives) ? raw.objectives : [])
    .map((value) => asTrimmedString(value))
    .filter((value): value is string => Boolean(value))

  const standards = (Array.isArray(raw.standards) ? raw.standards : [])
    .map((value) => asTrimmedString(value))
    .filter((value): value is string => Boolean(value))

  const materials_list = (Array.isArray(raw.materials_list) ? raw.materials_list : [])
    .map((value) => asTrimmedString(value))
    .filter((value): value is string => Boolean(value))

  const rawQuestions =
    (Array.isArray(raw.pre_lab_questions) ? raw.pre_lab_questions : []) as Array<Record<string, unknown> | string>

  const pre_lab_questions: GeneratedPreLabQuestion[] = rawQuestions
    .map((question) => {
      if (typeof question === 'string') {
        const question_text = asTrimmedString(question)
        if (!question_text) return null
        return { question_text, question_type: 'short_answer' as const }
      }
      if (!question || typeof question !== 'object') return null

      const question_text =
        asTrimmedString(question.question_text) ??
        asTrimmedString(question.question) ??
        asTrimmedString(question.prompt)
      if (!question_text) return null

      const rawType = asTrimmedString(question.question_type) ?? 'short_answer'
      const question_type: GeneratedPreLabQuestion['question_type'] =
        rawType === 'multiple_choice' || rawType === 'true_false' ? rawType : 'short_answer'

      const options =
        question_type === 'multiple_choice' && Array.isArray(question.options)
          ? question.options
              .map((value) => asTrimmedString(value))
              .filter((value): value is string => Boolean(value))
          : undefined

      return { question_text, question_type, options }
    })
    .filter((question): question is GeneratedPreLabQuestion => question !== null)

  const rawStepsSource =
    (Array.isArray(raw.steps) ? raw.steps : null) ??
    (Array.isArray(raw.procedure_steps) ? raw.procedure_steps : null) ??
    (Array.isArray(raw.lab_steps) ? raw.lab_steps : null) ??
    []

  const mappedSteps: Array<GeneratedLabStep | null> = (rawStepsSource as Array<Record<string, unknown> | string>)
    .map((step, i) => {
      if (typeof step === 'string') {
        const instructions = asTrimmedString(step)
        if (!instructions) return null
        return {
          title: `Step ${i + 1}`,
          instructions,
        }
      }
      if (!step || typeof step !== 'object') return null

      const title =
        asTrimmedString(step.title) ??
        asTrimmedString(step.step_title) ??
        asTrimmedString(step.name) ??
        asTrimmedString(step.heading) ??
        `Step ${i + 1}`

      const instructions =
        asTrimmedString(step.instructions) ??
        asTrimmedString(step.description) ??
        asTrimmedString(step.procedure) ??
        asTrimmedString(step.content)
      if (!instructions) return null

      const data_entry_fields = Array.isArray(step.data_entry_fields)
        ? step.data_entry_fields
            .map((field) => {
              if (!field || typeof field !== 'object') return null
              const label = asTrimmedString((field as Record<string, unknown>).label)
              if (!label) return null
              const typeRaw = asTrimmedString((field as Record<string, unknown>).type)
              const type: 'text' | 'number' = typeRaw === 'number' ? 'number' : 'text'
              return {
                label,
                type,
                unit: asTrimmedString((field as Record<string, unknown>).unit) ?? undefined,
                required: Boolean((field as Record<string, unknown>).required),
              }
            })
            .filter((field): field is NonNullable<typeof field> => field !== null)
        : undefined

      return {
        title,
        instructions,
        checkpoint: asTrimmedString(step.checkpoint) ?? undefined,
        reflection_prompt: asTrimmedString(step.reflection_prompt) ?? undefined,
        troubleshooting: asTrimmedString(step.troubleshooting) ?? undefined,
        data_entry_fields,
      }
    })

  let steps: GeneratedLabStep[] = mappedSteps.filter(
    (step): step is GeneratedLabStep => step !== null
  )

  if (steps.length === 0) {
    const textFallback =
      asTrimmedString(raw.procedure) ??
      asTrimmedString(raw.method) ??
      asTrimmedString(raw.instructions) ??
      ''

    steps = parseNumberedSteps(textFallback)
  }

  if (steps.length === 0) {
    steps = [
      {
        title: 'Prepare and Review Safety',
        instructions: 'Gather materials, review safety expectations, and plan roles before starting.',
      },
      {
        title: 'Run the Investigation',
        instructions: `Carry out the lab procedure for: ${prompt.trim() || 'the selected topic'}. Record observations and measurements.`,
      },
      {
        title: 'Analyze and Reflect',
        instructions: 'Compare results to expectations, identify sources of error, and summarize conclusions.',
      },
    ]
  }

  return {
    title,
    overview,
    objectives,
    standards,
    materials_list,
    safety_notes,
    background,
    pre_lab_questions,
    steps,
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const aiEnabled = await checkFeatureFlag('ai_lab_generation')
  if (!aiEnabled) {
    return NextResponse.json(
      { error: 'AI lab generation is not enabled for your organization.' },
      { status: 403 }
    )
  }

  const orgId = await getOrgId()
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { allowed, remaining } = await checkRateLimit(orgId, 'ai_lab_generation')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before generating another lab.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { prompt, gradeLevel, subject, duration, standards, materials } = body

  const anthropic = getAnthropicClient()

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      tools: [{
        name: 'create_lab_structure',
        description: 'Creates a structured lab with all required components',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: { type: 'string' },
            overview: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            standards: { type: 'array', items: { type: 'string' } },
            materials_list: { type: 'array', items: { type: 'string' } },
            safety_notes: { type: 'string' },
            background: { type: 'string' },
            pre_lab_questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_text: { type: 'string' },
                  question_type: { type: 'string', enum: ['short_answer', 'multiple_choice', 'true_false'] },
                  options: { type: 'array', items: { type: 'string' } }
                },
                required: ['question_text', 'question_type']
              }
            },
            steps: {
              type: 'array',
              minItems: 3,
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  instructions: { type: 'string' },
                  checkpoint: { type: 'string' },
                  reflection_prompt: { type: 'string' },
                  troubleshooting: { type: 'string' },
                  data_entry_fields: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'number'] },
                        unit: { type: 'string' },
                        required: { type: 'boolean' }
                      },
                      required: ['label', 'type', 'required']
                    }
                  }
                },
                required: ['title', 'instructions']
              }
            }
          },
          required: ['title', 'overview', 'objectives', 'steps']
        },
        // Cache the tool definition — it's identical on every request
        cache_control: { type: 'ephemeral' },
      }],
      tool_choice: { type: 'tool', name: 'create_lab_structure' },
      messages: [{
        role: 'user',
        content: `Create a complete lab for the following:
Topic/Prompt: ${prompt}
Grade Level: ${gradeLevel}
Subject: ${subject}
Duration: ${duration} minutes
Standards: ${standards || 'Not specified'}
Available Materials: ${materials || 'Standard lab equipment'}

Generate a complete, educationally sound lab with clear steps, pre-lab questions, and appropriate data collection points.`
      }]
    })

    const toolUse = message.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Failed to generate lab structure' }, { status: 500 })
    }

    const normalizedLab = normalizeGeneratedLab(toolUse.input, String(prompt ?? ''))

    return NextResponse.json({ lab: normalizedLab }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
