'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DEMO_GATEWAY, DEMO_GATEWAY_LOGIN_CANDIDATES } from '@/lib/demo/accounts'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

interface LoginBoxProps {
  title?: string
  description?: string
  className?: string
  showSignupLink?: boolean
  forceBlackText?: boolean
  showDemoAccess?: boolean
}

export function LoginBox({
  title = 'Sign In',
  description = 'Enter your credentials to access LabFlow',
  className,
  showSignupLink = true,
  forceBlackText = false,
  showDemoAccess,
}: LoginBoxProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const shouldShowDemoAccess =
    showDemoAccess ?? process.env.NODE_ENV !== 'production'

  async function attemptLogin(email: string, password: string) {
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { ok: !authError, authError }
  }

  async function loginWithCredentials(
    email: string,
    password: string,
    failureMessage = 'Invalid email or password. Please try again.',
    successPath = '/dashboard'
  ) {
    setError(null)
    const { ok } = await attemptLogin(email, password)
    if (!ok) {
      setError(failureMessage)
      return false
    }
    router.push(successPath)
    router.refresh()
    return true
  }

  async function onSubmit(data: LoginForm) {
    await loginWithCredentials(data.email, data.password)
  }

  async function handleDemoGatewaySignIn() {
    setIsDemoSigningIn(true)
    setError(null)
    setValue('email', DEMO_GATEWAY.email, { shouldTouch: true, shouldDirty: true })
    setValue('password', DEMO_GATEWAY.password, { shouldTouch: true, shouldDirty: true })

    try {
      for (const credentials of DEMO_GATEWAY_LOGIN_CANDIDATES) {
        const { ok } = await attemptLogin(credentials.email, credentials.password)
        if (ok) {
          setValue('email', credentials.email, { shouldTouch: true, shouldDirty: true })
          setValue('password', credentials.password, { shouldTouch: true, shouldDirty: true })
          router.push('/demo/control')
          router.refresh()
          return
        }
      }

      setError(
        'Demo sign-in failed. Run: npx ts-node --project tsconfig.json supabase/seed-users.ts'
      )
    } finally {
      setIsDemoSigningIn(false)
    }
  }

  return (
    <Card className={cn('w-full max-w-md', forceBlackText && 'text-black', className)}>
      <CardHeader>
        <CardTitle className={cn('text-2xl', forceBlackText && 'text-black')}>{title}</CardTitle>
        <CardDescription className={cn(forceBlackText && 'text-black/70')}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className={cn(forceBlackText && 'text-black')}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              aria-invalid={!!errors.email}
              className={cn(forceBlackText && 'text-black placeholder:text-black/45')}
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className={cn(forceBlackText && 'text-black')}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              aria-invalid={!!errors.password}
              className={cn(forceBlackText && 'text-black placeholder:text-black/45')}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className={cn(
                'text-sm underline-offset-4 hover:underline',
                forceBlackText ? 'text-black/70 hover:text-black' : 'text-muted-foreground hover:text-primary'
              )}
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>

          {showSignupLink && (
            <p
              className={cn(
                'text-center text-sm',
                forceBlackText ? 'text-black/70' : 'text-muted-foreground'
              )}
            >
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className={cn(
                  'underline-offset-4 hover:underline',
                  forceBlackText ? 'text-black' : 'text-primary'
                )}
              >
                Sign up
              </Link>
            </p>
          )}

          {shouldShowDemoAccess && (
            <div
              className={cn(
                'mt-2 space-y-3 rounded-lg border p-3',
                forceBlackText ? 'border-black/10 bg-black/[0.03]' : 'border-border bg-muted/30'
              )}
            >
              <div className="space-y-1">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    forceBlackText ? 'text-black' : 'text-foreground'
                  )}
                >
                  Live Demo Access
                </p>
                <p
                  className={cn(
                    'text-xs',
                    forceBlackText ? 'text-black/70' : 'text-muted-foreground'
                  )}
                >
                  Use one demo login, then choose Student, Teacher, or Admin inside Demo Control
                  Center.
                </p>
              </div>

              <div
                className={cn(
                  'rounded-md border p-2 text-xs',
                  forceBlackText ? 'border-black/10 bg-white/70 text-black/75' : 'border-border bg-background/80 text-muted-foreground'
                )}
              >
                <p>
                  Username: <span className={cn('font-semibold', forceBlackText ? 'text-black' : 'text-foreground')}>{DEMO_GATEWAY.email}</span>
                </p>
                <p>
                  Password: <span className={cn('font-semibold', forceBlackText ? 'text-black' : 'text-foreground')}>{DEMO_GATEWAY.password}</span>
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                disabled={isSubmitting || isDemoSigningIn}
                onClick={() => void handleDemoGatewaySignIn()}
                className="w-full"
              >
                {isDemoSigningIn ? 'Signing in demo account...' : 'Use Demo Account'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
