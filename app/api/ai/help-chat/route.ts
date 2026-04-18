import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { checkFeatureFlag } from '@/lib/ai/check-feature-flag'
import { checkRateLimit, getOrgId } from '@/lib/ai/rate-limit'

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

  const { stepInstructions, studentMessage, conversationHistory, hintLevel, helpRequestId } =
    await request.json()

  const anthropic = getAnthropicClient()

  const systemPrompt = `You are a helpful science lab assistant using the Socratic method.
Your role: Guide students to discover answers themselves. NEVER give direct answers.
Hint level: ${hintLevel} (0=ask guiding questions only, 1=give a small hint, 2=give a more direct hint but still not the answer)

Current lab step instructions: ${stepInstructions}

Rules:
- Ask one guiding question at a time
- Reference what the student has already tried
- Be encouraging and patient
- If hintLevel=0, only ask questions
- If hintLevel=1, you may share one observation or hint
- If hintLevel=2, you may share a more direct hint but still lead the student to discover
- Never reveal the complete answer
- Keep responses concise (2-4 sentences)`

  const messages = [
    ...(conversationHistory ?? []).map((turn: { role: string; content: string }) => ({
      role: turn.role as 'user' | 'assistant',
      content: turn.content,
    })),
    { role: 'user' as const, content: studentMessage },
  ]

  // helpRequestId is accepted for future use (saving conversation)
  void helpRequestId

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
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
