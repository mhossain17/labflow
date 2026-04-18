'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User } from 'lucide-react'
import type { HelpConversationTurn } from '@/types/app'

interface Props {
  stepInstructions: string
  helpRequestId: string | null
  initialHistory?: HelpConversationTurn[]
  onEscalate?: () => void
}

export function HelpChat({ stepInstructions, helpRequestId, initialHistory = [], onEscalate }: Props) {
  const [history, setHistory] = useState<HelpConversationTurn[]>(initialHistory)
  const [input, setInput] = useState('')
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  const aiTurnCount = history.filter((t) => t.role === 'assistant').length
  const hintLevel = Math.min(aiTurnCount, 2)
  const showEscalate = aiTurnCount >= 3 && onEscalate

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, streamingText])

  async function sendMessage() {
    const message = input.trim()
    if (!message || isStreaming) return
    setInput('')

    const userTurn: HelpConversationTurn = {
      role: 'user',
      content: message,
      ts: new Date().toISOString(),
    }
    setHistory((prev) => [...prev, userTurn])
    setIsStreaming(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/ai/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepInstructions,
          studentMessage: message,
          conversationHistory: history,
          hintLevel,
          helpRequestId,
        }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              fullText += data.text
              setStreamingText(fullText)
            }
            if (data.done) {
              const assistantTurn: HelpConversationTurn = {
                role: 'assistant',
                content: data.fullResponse || fullText,
                ts: new Date().toISOString(),
              }
              startTransition(() => {
                setHistory((prev) => [...prev, assistantTurn])
                setStreamingText('')
              })
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error('Help chat error:', err)
      const errorTurn: HelpConversationTurn = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        ts: new Date().toISOString(),
      }
      setHistory((prev) => [...prev, errorTurn])
      setStreamingText('')
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[350px] pr-1">
        {history.length === 0 && !streamingText && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Describe what&apos;s happening and I&apos;ll help guide you.
          </p>
        )}

        {history.map((turn, i) => (
          <div
            key={i}
            className={`flex gap-2 ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {turn.role === 'assistant' && (
              <span className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="size-3.5 text-primary" />
              </span>
            )}
            <div
              className={`rounded-lg px-3 py-2 text-sm max-w-[85%] leading-relaxed ${
                turn.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {turn.content}
            </div>
            {turn.role === 'user' && (
              <span className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="size-3.5 text-muted-foreground" />
              </span>
            )}
          </div>
        ))}

        {streamingText && (
          <div className="flex gap-2 justify-start">
            <span className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="size-3.5 text-primary" />
            </span>
            <div className="rounded-lg px-3 py-2 text-sm max-w-[85%] bg-muted text-foreground leading-relaxed">
              {streamingText}
              <span className="inline-block w-1 h-3 bg-current ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Escalate */}
      {showEscalate && (
        <Button variant="outline" size="sm" onClick={onEscalate} className="text-amber-600 border-amber-300 hover:bg-amber-50">
          Request Teacher Help
        </Button>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you're stuck on..."
          className="flex-1 resize-none text-sm"
          disabled={isStreaming}
        />
        <Button
          size="icon"
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          className="shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        I&apos;ll guide you with questions rather than giving direct answers.
      </p>
    </div>
  )
}
