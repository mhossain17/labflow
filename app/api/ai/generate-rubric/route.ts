import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { checkRateLimit, getOrgId } from '@/lib/ai/rate-limit'

type RubricItem = {
  title: string
  description: string
  max_points: number
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asSafePoints(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 10
  return Math.max(1, Math.min(100, Math.round(parsed)))
}

function normalizeRubricItems(rawInput: unknown): RubricItem[] {
  const raw = (typeof rawInput === 'object' && rawInput !== null ? rawInput : {}) as Record<string, unknown>
  const rawItems =
    (Array.isArray(raw.rubric_items) ? raw.rubric_items : null) ??
    (Array.isArray(raw.criteria) ? raw.criteria : null) ??
    (Array.isArray(raw.items) ? raw.items : null) ??
    []

  const normalized: RubricItem[] = (rawItems as Array<Record<string, unknown> | string>)
    .map((item) => {
      if (typeof item === 'string') {
        const title = asTrimmedString(item)
        if (!title) return null
        return { title, description: '', max_points: 10 }
      }

      if (!item || typeof item !== 'object') return null

      const title =
        asTrimmedString(item.title) ??
        asTrimmedString(item.criterion) ??
        asTrimmedString(item.name)
      if (!title) return null

      return {
        title,
        description:
          asTrimmedString(item.description) ??
          asTrimmedString(item.details) ??
          asTrimmedString(item.what_to_look_for) ??
          '',
        max_points: asSafePoints(item.max_points ?? item.points ?? item.weight),
      }
    })
    .filter((item): item is RubricItem => item !== null)

  if (normalized.length > 0) return normalized

  return [
    {
      title: 'Procedure & Technique',
      description: 'Follows procedure carefully, uses equipment correctly, and demonstrates safe lab habits.',
      max_points: 10,
    },
    {
      title: 'Data Quality & Analysis',
      description: 'Collects complete measurements and correctly analyzes results with evidence-based reasoning.',
      max_points: 10,
    },
    {
      title: 'Scientific Communication',
      description: 'Explains findings clearly using appropriate vocabulary, units, and logical conclusions.',
      max_points: 10,
    },
  ]
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

  const { allowed, remaining } = await checkRateLimit(orgId, 'ai_rubric_generation')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before generating another rubric.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const {
    labTitle,
    labOverview,
    objectives,
    standards,
    steps,
    prompt,
  } = body as {
    labTitle?: string
    labOverview?: string
    objectives?: string[]
    standards?: string[]
    steps?: Array<{ title?: string; instructions?: string }>
    prompt?: string
  }

  const anthropic = getAnthropicClient()

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      tools: [{
        name: 'create_rubric',
        description: 'Creates a classroom rubric with clear criteria and point values.',
        input_schema: {
          type: 'object' as const,
          properties: {
            rubric_items: {
              type: 'array',
              minItems: 3,
              maxItems: 8,
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  max_points: { type: 'number' },
                },
                required: ['title', 'max_points'],
              },
            },
          },
          required: ['rubric_items'],
        },
        cache_control: { type: 'ephemeral' },
      }],
      tool_choice: { type: 'tool', name: 'create_rubric' },
      messages: [{
        role: 'user',
        content: `Generate a grading rubric for this lab.

Lab title: ${labTitle || 'Untitled Lab'}
Overview: ${labOverview || 'No overview provided'}
Objectives: ${Array.isArray(objectives) && objectives.length ? objectives.join('; ') : 'None provided'}
Standards: ${Array.isArray(standards) && standards.length ? standards.join('; ') : 'None provided'}
Procedure highlights:
${Array.isArray(steps) && steps.length
    ? steps.slice(0, 8).map((s, i) => `${i + 1}. ${s.title || 'Step'} — ${s.instructions || ''}`).join('\n')
    : 'No procedure steps provided'}

Teacher preferences: ${prompt?.trim() || 'Keep it clear, standards-aligned, and practical for grading.'}

Requirements:
- Provide 4-6 criteria.
- Assign realistic points per criterion.
- Keep wording concrete and measurable.
- Total points should be around 100 (acceptable range: 80-120).`,
      }],
    })

    const toolUse = message.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Failed to generate rubric.' }, { status: 500 })
    }

    const items = normalizeRubricItems(toolUse.input)
    return NextResponse.json({ items }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    console.error('Rubric generation error:', error)
    return NextResponse.json({ error: 'AI generation failed.' }, { status: 500 })
  }
}
