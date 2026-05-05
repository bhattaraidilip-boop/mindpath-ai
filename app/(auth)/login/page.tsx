'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/parent/dashboard'
  const supabase = createClient()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState<'google' | 'apple' | 'email' | null>(null)
  const [error, setError]       = useState<string | null>(null)

  async function signInWithGoogle() {
    setLoading('google')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  async function signInWithApple() {
    setLoading('apple')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}`,
      },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading('email')
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Wrong email or password. Try again.'
        : error.message
      )
      setLoading(null)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-8">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black text-lg font-display">
            M
          </div>
          <span className="font-display font-black text-xl text-gray-900">MindPath AI</span>
        </div>
        <Link href="/signup" className="text-brand-600 font-semibold text-sm">
          Sign up
        </Link>
      </div>

      {/* Content */}
      <motion.div
        className="flex-1 flex flex-col px-5 max-w-sm mx-auto w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-display font-black text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-500 text-base">
            Sign in to continue your child's learning journey.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={signInWithGoogle}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl py-3.5 text-base transition-all disabled:opacity-60"
          >
            {loading === 'google' ? (
              <Spinner />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <button
            onClick={signInWithApple}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl py-3.5 text-base transition-all disabled:opacity-60"
          >
            {loading === 'apple' ? (
              <Spinner white />
            ) : (
              <AppleIcon />
            )}
            Continue with Apple
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or use email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email Form */}
        <form onSubmit={signInWithEmail} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="input"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <Link href="/forgot-password" className="text-xs text-brand-600 font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!!loading || !email || !password}
            className="btn-primary w-full mt-2"
          >
            {loading === 'email' ? <Spinner white /> : null}
            Sign In
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          New to MindPath AI?{' '}
          <Link href="/signup" className="text-brand-600 font-semibold">
            Create a free account
          </Link>
        </p>

        {/* COPPA notice */}
        <p className="text-center text-xs text-gray-400 mt-8 px-4">
          By signing in, you confirm you are a parent or guardian.
          Children under 13 are added by parents only.{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Spinner({ white }: { white?: boolean }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${white ? 'text-white' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}
