'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { BrandMark } from '@/components/ui/brand-mark'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-margin-x">
        <main className="flex w-full max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container/40">
            <CheckCircle2 className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="font-display text-headline-lg text-headline-lg text-text-primary">
            Check your inbox
          </h1>
          <p className="mt-2 max-w-[280px] text-sm text-text-secondary">
            We&apos;ve sent a confirmation link to <strong className="text-text-primary">{email}</strong>.
            Click the link to activate your account, then sign in.
          </p>
          <Link
            href="/auth/login"
            className="ring-focus mt-8 flex h-14 w-full max-w-[280px] items-center justify-center rounded-lg border border-border bg-transparent font-semibold text-text-primary transition-all duration-150 hover:bg-bg-secondary active:scale-[0.98]"
          >
            Back to Login
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-margin-x">
      <main className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark size={52} wordmarkClass="font-display text-[2.5rem] font-bold tracking-tight text-text-primary" />
          <p className="mt-2 text-sm text-text-secondary">Start your streak today.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              icon={<Mail className="h-5 w-5" />}
            />

            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  minLength={6}
                  icon={<Lock className="h-5 w-5" />}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="ring-focus absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:text-primary-fixed">
            Sign in
          </Link>
        </div>
      </main>
    </div>
  )
}
