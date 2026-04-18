import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { checkRateLimit, getOrgId } from '@/lib/ai/rate-limit'
import { buildHelpChatSystemPrompt } from '@/lib/ai/prompts/help-chat'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const helpEnabled = await checkFeatureFlag('help_chat')
  if (!helpEnabled) {
    return new Response(
      JSON.stringify({ error: 'AI help is not enabled for your organization.' }),
      { status: 403 }
    )
  }

  const orgId = await getOrgId()
  if (!orgId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const { allowed } = await checkRateLimit(orgId, 'help_chat')
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending another help request.' }),
      { status: 429 }
    )
  }

  const {
    stepInstructions,
    studentMessage,
    conversationHistory,
    hintLevel,
    stuckCount,
    troubleshootingText,
    checkpoint,
    dataFieldLabels,
    helpRequestId,
  } = await request.json()

  const anthropic = getAnthropicClient()

  const systemPrompt = buildHelpChatSystemPrompt({
    stepInstructions,
    troubleshootingText,
    checkpoint,
    dataFieldLabels,
    hintLevel: hintLevel ?? 0,
    stuckCount: stuckCount ?? 0,
  })

  const messages = [
    ...(conversationHistory ?? []).map((turn: { role: string; content: string }) => ({
      role: turn.role as 'user' | 'assistant',
      content: turn.content,
    })),
    { role: 'user' as const, content: studentMessage },
  ]

  void helpRequestId

  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })

  const encoder = new TextEncoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      stream.on('text', (text) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
      })
      stream.on('finalMessage', async (message) => {
        const assistantContent =
          message.content.find((b) => b.type === 'text')?.text ?? ''
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, fullResponse: assistantContent })}\n\n`
          )
        )
        controller.close()
      })
      stream.on('error', (err) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        )
        controller.close()
      })
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
