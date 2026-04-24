'use client'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const signupSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    orgCode: z.string().min(1, 'Join code is required'),
    ageConsent: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupForm = z.infer<typeof signupSchema>

function SignupForm() {
  const searchParams = useSearchParams()
  const prefilledCode = searchParams.get('code') ?? ''

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<'student' | 'teacher' | null>(null)
  const [resolvedRole, setResolvedRole] = useState<'student' | 'teacher' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { ageConsent: false, orgCode: prefilledCode },
  })

  async function handleCodeBlur(e: React.FocusEvent<HTMLInputElement>) {
    const code = e.target.value.trim()
    if (!code) {
      setResolvedRole(null)
      return
    }
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc('lookup_org_by_signup_code', { code })
    if (data?.org_id) {
      setResolvedRole(data.assigned_role === 'teacher' ? 'teacher' : 'student')
    } else {
      setResolvedRole(null)
    }
  }

  async function onSubmit(data: SignupForm) {
    setError(null)
    const supabase = createClient()

    // Validate COPPA consent for students
    if (resolvedRole === 'student' && !data.ageConsent) {
      setError('You must confirm the student is 13 or older, or that the school has obtained parental consent.')
      return
    }

    // Resolve org and role from the join code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lookup, error: lookupError } = await (supabase as any)
      .rpc('lookup_org_by_signup_code', { code: data.orgCode.trim() })

    if (lookupError || !lookup?.org_id) {
      setError('Invalid join code. Check the code your teacher or admin provided.')
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          organization_id: lookup.org_id,
          role: lookup.assigned_role,
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccess(lookup.assigned_role === 'teacher' ? 'teacher' : 'student')
  }

  if (success === 'student') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Check your email to confirm your account. Once confirmed, you can sign in.
            </AlertDescription>
          </Alert>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already confirmed?{' '}
            <Link href="/login" className="text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  if (success === 'teacher') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Account Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Your account is pending approval. Your school admin will activate your account shortly. Once approved, you can sign in.
            </AlertDescription>
          </Alert>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already approved?{' '}
            <Link href="/login" className="text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Enter your join code to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Jane"
                aria-invalid={!!errors.firstName}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Smith"
                aria-invalid={!!errors.lastName}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orgCode">Join Code</Label>
            <Input
              id="orgCode"
              type="text"
              autoComplete="off"
              placeholder="e.g. xk7mp2qr"
              aria-invalid={!!errors.orgCode}
              {...register('orgCode', { onBlur: handleCodeBlur })}
            />
            {errors.orgCode && (
              <p className="text-sm text-destructive">{errors.orgCode.message}</p>
            )}
            {resolvedRole === 'student' && (
              <p className="text-xs text-green-600 dark:text-green-400">Student join code ✓</p>
            )}
            {resolvedRole === 'teacher' && (
              <p className="text-xs text-blue-600 dark:text-blue-400">Staff join code ✓</p>
            )}
            {!resolvedRole && (
              <p className="text-xs text-muted-foreground">Ask your teacher or school admin for your join code.</p>
            )}
          </div>

          {resolvedRole === 'student' && (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                  {...register('ageConsent')}
                />
                <span className="text-sm text-muted-foreground leading-snug">
                  I confirm this student is 13 years of age or older, or that the school has obtained
                  verifiable parental consent as required by{' '}
                  <a href="/coppa" className="text-primary hover:underline underline-offset-4" target="_blank">
                    COPPA
                  </a>
                  .
                </span>
              </label>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating account…
              </span>
            ) : (
              'Create Account'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
