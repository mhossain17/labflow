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
      model: 'claude-opus-4-5',
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

    return NextResponse.json({ lab: toolUse.input }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
