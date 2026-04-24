'use client'
import { useState, useTransition } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { regenerateOrgCode } from '@/app/super-admin/actions'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      title="Copy code"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function CodeChip({
  label,
  code,
  orgId,
  codeType,
}: {
  label: string
  code: string | null
  orgId: string
  codeType: 'student' | 'staff'
}) {
  const [currentCode, setCurrentCode] = useState(code ?? '')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRegenerate() {
    startTransition(async () => {
      try {
        const { code: newCode } = await regenerateOrgCode(orgId, codeType)
        setCurrentCode(newCode)
      } finally {
        setShowConfirm(false)
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        {currentCode ? (
          <>
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded border border-border tracking-widest">
              {currentCode}
            </span>
            <CopyButton value={currentCode} />
          </>
        ) : (
          <span className="text-xs text-muted-foreground italic">No code</span>
        )}

        {showConfirm ? (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-xs text-muted-foreground">Regenerate? Old code stops working.</span>
            <button
              type="button"
              disabled={isPending}
              onClick={handleRegenerate}
              className="text-xs text-destructive hover:underline disabled:opacity-50"
            >
              {isPending ? 'Regenerating…' : 'Yes'}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="text-xs text-muted-foreground hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            title="Regenerate code"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

interface OrgCodeRowProps {
  orgId: string
  studentCode: string | null
  staffCode: string | null
}

export function OrgCodeRow({ orgId, studentCode, staffCode }: OrgCodeRowProps) {
  return (
    <div className="flex gap-6 mt-2 pt-2 border-t border-border/50">
      <CodeChip
        label="Student code"
        code={studentCode}
        orgId={orgId}
        codeType="student"
      />
      <CodeChip
        label="Staff code"
        code={staffCode}
        orgId={orgId}
        codeType="staff"
      />
    </div>
  )
}
