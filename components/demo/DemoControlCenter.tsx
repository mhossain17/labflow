'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, GraduationCap, ShieldCheck, UserCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_GATEWAY, DEMO_PERSONAS, type DemoPersona } from '@/lib/demo/accounts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DemoControlCenterProps {
  currentEmail: string
}

function roleIcon(role: string) {
  if (role === 'school_admin') return ShieldCheck
  if (role === 'teacher') return GraduationCap
  return UserCircle2
}

function roleLabel(role: string) {
  if (role === 'school_admin') return 'School Admin'
  if (role === 'teacher') return 'Teacher'
  return 'Student'
}

function roleColor(role: string) {
  if (role === 'school_admin') return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  if (role === 'teacher') return 'bg-sky-100 text-sky-700 border-sky-200'
  return 'bg-emerald-100 text-emerald-700 border-emerald-200'
}

export function DemoControlCenter({ currentEmail }: DemoControlCenterProps) {
  const router = useRouter()
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentPersona = DEMO_PERSONAS.find((persona) => persona.email === currentEmail)
  const isGatewaySession = currentEmail === DEMO_GATEWAY.email
  const initialRole = currentPersona?.role ?? 'student'
  const initialPersonaId =
    currentPersona?.id ?? DEMO_PERSONAS.find((persona) => persona.role === initialRole)?.id ?? ''

  const [selectedRole, setSelectedRole] = useState<DemoPersona['role']>(initialRole)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId)

  const roleOptions = useMemo(
    () =>
      [
        { role: 'school_admin' as const, label: 'School Admin' },
        { role: 'teacher' as const, label: 'Teacher' },
        { role: 'student' as const, label: 'Student' },
      ],
    []
  )

  const personasForRole = useMemo(
    () => DEMO_PERSONAS.filter((persona) => persona.role === selectedRole),
    [selectedRole]
  )

  const selectedPersona = useMemo(
    () => personasForRole.find((persona) => persona.id === selectedPersonaId) ?? personasForRole[0],
    [personasForRole, selectedPersonaId]
  )

  async function switchSession(email: string, password: string, key: string) {
    setError(null)
    setIsSwitching(key)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(`Unable to switch demo persona (${email}). Confirm demo seed accounts exist.`)
      setIsSwitching(null)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              DEMO - Switch User
            </CardTitle>
            <Badge variant="outline">Demo Control Center</Badge>
          </div>
          <CardDescription>
            Choose a role and persona from the dropdowns, then switch sessions instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-[220px_minmax(0,1fr)_180px] md:items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Role</span>
              <select
                value={selectedRole}
                onChange={(event) => {
                  const nextRole = event.target.value as DemoPersona['role']
                  setSelectedRole(nextRole)
                  const nextPersona = DEMO_PERSONAS.find((persona) => persona.role === nextRole)
                  setSelectedPersonaId(nextPersona?.id ?? '')
                }}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {roleOptions.map((option) => (
                  <option key={option.role} value={option.role}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">User</span>
              <select
                value={selectedPersona?.id ?? ''}
                onChange={(event) => setSelectedPersonaId(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              >
                {personasForRole.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.label}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              disabled={
                !selectedPersona ||
                isSwitching !== null ||
                currentEmail === selectedPersona?.email
              }
              onClick={() =>
                selectedPersona &&
                void switchSession(selectedPersona.email, selectedPersona.password, selectedPersona.id)
              }
            >
              {selectedPersona && isSwitching === selectedPersona.id
                ? 'Switching...'
                : 'Switch User'}
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/25 p-3">
            <p className="text-sm text-muted-foreground">Current session</p>
            <p className="text-base font-semibold">
              {isGatewaySession ? 'Demo Gateway Account' : currentPersona?.label ?? currentEmail}
            </p>
            <p className="text-xs text-muted-foreground">{currentEmail}</p>
            {!isGatewaySession && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                disabled={isSwitching !== null}
                onClick={() =>
                  void switchSession(DEMO_GATEWAY.email, DEMO_GATEWAY.password, 'gateway')
                }
              >
                {isSwitching === 'gateway' ? 'Switching...' : 'Return To Demo Gateway'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {DEMO_PERSONAS.map((persona) => {
          const Icon = roleIcon(persona.role)
          const isCurrent = currentEmail === persona.email
          return (
            <div key={persona.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{persona.label}</p>
                  <p className="text-xs text-muted-foreground">{persona.email}</p>
                </div>
                <Badge className={roleColor(persona.role)}>{roleLabel(persona.role)}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{persona.description}</p>
              {isCurrent && (
                <p className="mt-2 text-xs font-medium text-primary">Currently active</p>
              )}
              <Icon className="mt-2 h-4 w-4 text-muted-foreground" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
