import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { checkRateLimit, getOrgId } from '@/lib/ai/rate-limit'

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

  const { allowed } = await checkRateLimit(orgId, 'ai_lab_generation')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before generating again.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { prompt, labTitle, stepNumber } = body

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
  }

  const anthropic = getAnthropicClient()

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools: [{
        name: 'create_step',
        description: 'Creates a single lab procedure step with all required fields',
        input_schema: {
          type: 'object' as const,
          properties: {
            title: {
              type: 'string',
              description: 'Short, action-oriented title (e.g. "Measure sample mass")',
            },
            instructions: {
              type: 'string',
              description: 'Clear, numbered step-by-step instructions for the student. Be specific and safety-conscious.',
            },
            checkpoint: {
              type: 'string',
              description: 'Brief note for the teacher describing what to verify before the student continues.',
            },
            reflection_prompt: {
              type: 'string',
              description: 'A thought-provoking question asking the student to reflect on what they observed or why it happened.',
            },
            troubleshooting: {
              type: 'string',
              description: 'Common issues students encounter at this step and how to resolve them.',
            },
            data_entry_fields: {
              type: 'array',
              description: 'Data fields for students to record measurements or observations.',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string', description: 'Field name (e.g. "Mass of sample")' },
                  type: { type: 'string', enum: ['number', 'text'] },
                  unit: { type: 'string', description: 'Unit of measurement if applicable (e.g. "g", "mL", "°C")' },
                  required: { type: 'boolean' },
                },
                required: ['label', 'type', 'required'],
              },
            },
          },
          required: ['title', 'instructions'],
        },
        cache_control: { type: 'ephemeral' },
      }],
      tool_choice: { type: 'tool', name: 'create_step' },
      messages: [{
        role: 'user',
        content: `Generate a complete lab procedure step for the following:

Lab: "${labTitle || 'Science Lab'}"
Step number: ${stepNumber}
Teacher's description: ${prompt}

Fill in all fields thoroughly. The instructions should be suitable for high school students and be clear enough that a student can follow them independently.`,
      }],
    })

    const toolUse = message.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return NextResponse.json({ error: 'Failed to generate step.' }, { status: 500 })
    }

    return NextResponse.json({ step: toolUse.input })
  } catch (error) {
    console.error('Step generation error:', error)
    return NextResponse.json({ error: 'AI generation failed.' }, { status: 500 })
  }
}
