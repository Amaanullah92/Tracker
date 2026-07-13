'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        <main className="w-full max-w-[480px] flex flex-col items-center text-center mt-12">
          <div className="w-20 h-20 rounded-full bg-secondary-container/20 flex items-center justify-center mb-6">
            <span className="text-[48px] text-secondary leading-none">✓</span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-text-primary mb-2">
            Check your inbox
          </h2>
          <p className="font-body-lg text-body-lg text-text-secondary mb-10 max-w-[280px]">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account, then sign in.
          </p>
          <Link
            href="/auth/login"
            className="bg-transparent border border-primary-container text-primary font-headline-md text-headline-md h-12 rounded-lg w-full max-w-[280px] flex items-center justify-center hover:bg-primary-container/10 active:scale-[0.98] transition-all"
          >
            Back to Login
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-margin-x">
      <main className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <h1 className="font-stat-lg text-[36px] font-bold text-primary tracking-tighter">Habit and Progress Tracker</h1>
          <p className="font-body-lg text-body-lg text-text-secondary mt-2">Create your account</p>
        </div>

        <div className="bg-surface p-4 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-label-caps text-label-caps text-text-secondary uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-elevated text-text-primary font-body-lg text-body-lg border border-transparent rounded-lg h-12 pl-12 pr-4 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors placeholder:text-outline-variant"
                  placeholder="user@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="font-label-caps text-label-caps text-text-secondary uppercase">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-elevated text-text-primary font-body-lg text-body-lg border border-transparent rounded-lg h-12 pl-12 pr-4 focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors placeholder:text-outline-variant"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary-container text-on-primary-container font-headline-md text-headline-md h-12 rounded-lg flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="font-body-sm text-body-sm text-text-secondary">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-headline-md text-sm ml-1 hover:text-primary-fixed transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
