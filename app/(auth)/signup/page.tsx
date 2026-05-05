'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button, Spinner } from '@/components/ui'

type Step = 'account' | 'child' | 'done'

const GRADES = [
  { value: 0, label: 'Pre-K (Age 4-5)' },
  { value: 1, label: 'Kindergarten (Age 5-6)' },
  { value: 2, label: 'Grade 1 (Age 6-7)' },
  { value: 3, label: 'Grade 2 (Age 7-8)' },
  { value: 4, label: 'Grade 3 (Age 8-9)' },
  { value: 5, label: 'Grade 4 (Age 9-10)' },
  { value: 6, label: 'Grade 5 (Age 10-11)' },
  { value: 7, label: 'Grade 6 (Age 11-12)' },
]

const AVATARS = [
  { base: 'bear', emoji: '🐻' },
  { base: 'cat', emoji: '🐱' },
  { base: 'robot', emoji: '🤖' },
  { base: 'fox', emoji: '🦊' },
  { base: 'owl', emoji: '🦉' },
  { base: 'dragon', emoji: '🐲' },
]

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('account')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Account fields
  const [parentName, setParentName] = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')

  // Child fields
  const [childName, setChildName]     = useState('')
  const [gradeLevel, setGradeLevel]   = useState<number>(0)
  const [dob, setDob]                 = useState('')
  const [selectedAvatar, setSelected] = useState('bear')

  // OAuth
  async function signUpWithGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=/parent/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  // Step 1: Create parent account
  async function createAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!parentName || !email || !password) return
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: parentName, role: 'parent' },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('child')
  }

  // Step 2: Create child profile
  async function createChild(e: React.FormEvent) {
    e.preventDefault()
    if (!childName) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Session expired. Please sign in again.')

      // Create student user record
      const { data: studentUser, error: userError } = await supabase
        .from('users')
        .insert({
          id:        crypto.randomUUID(),
          email:     `${childName.toLowerCase().replace(/\s/g, '.')}.${user.id.slice(0, 6)}@child.mindpathai.com`,
          full_name: childName,
          role:      'student',
        })
        .select()
        .single()

      if (userError) throw userError

      // Create student profile
      await supabase.from('student_profiles').insert({
        user_id:      studentUser.id,
        parent_id:    user.id,
        display_name: childName,
        grade_level:  gradeLevel,
        date_of_birth: dob || null,
        avatar_config: {
          base:            selectedAvatar,
          color:           '#FFB347',
          accessory:       null,
          background:      '#E8F4FD',
          unlocked_items:  [],
        },
      })

      // Link parent-child
      await supabase.from('parent_children').insert({
        parent_id: user.id,
        child_id:  studentUser.id,
      })

      setStep('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
    setLoading(false)
  }

  const slideVariants = {
    enter:  { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit:   { opacity: 0, x: -30 },
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black text-lg font-display">M</div>
          <span className="font-display font-black text-xl text-gray-900">MindPath AI</span>
        </div>
        <Link href="/login" className="text-brand-600 font-semibold text-sm">Sign in</Link>
      </div>

      {/* Step Indicator */}
      {step !== 'done' && (
        <div className="flex items-center gap-2 px-5 mb-6">
          {(['account', 'child'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? 'bg-brand-500 text-white' :
                (step === 'child' && s === 'account') ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'child' && s === 'account' ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === s ? 'text-gray-900' : 'text-gray-400'}`}>
                {s === 'account' ? 'Your account' : "Child's profile"}
              </span>
              {i < 1 && <div className="flex-1 h-px bg-gray-200 w-6" />}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-5 max-w-sm mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {/* STEP 1: ACCOUNT */}
          {step === 'account' && (
            <motion.div
              key="account"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-2xl font-display font-black text-gray-900 mb-1">
                Create your account
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                You're the parent — your account manages everything.
              </p>

              {/* Google */}
              <button
                onClick={signUpWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl py-3.5 text-base transition-all mb-4 disabled:opacity-60"
              >
                {loading ? <Spinner /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={createAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your name</label>
                  <input
                    type="text" value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    placeholder="Sarah Johnson"
                    className="input" required autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="input" required autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Create password</label>
                  <input
                    type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="input" required minLength={8} autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>
                )}

                <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
                  Continue →
                </Button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-6">
                By creating an account you agree to our{' '}
                <Link href="/terms" className="underline">Terms</Link> and{' '}
                <Link href="/privacy" className="underline">Privacy Policy</Link>.
                We are COPPA compliant.
              </p>
            </motion.div>
          )}

          {/* STEP 2: CHILD PROFILE */}
          {step === 'child' && (
            <motion.div
              key="child"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-2xl font-display font-black text-gray-900 mb-1">
                Tell us about your child 👧
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                We'll create a personalized learning path just for them.
              </p>

              <form onSubmit={createChild} className="space-y-5">
                {/* Avatar Picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Choose an avatar
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map(({ base, emoji }) => (
                      <motion.button
                        key={base} type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setSelected(base)}
                        className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all ${
                          selectedAvatar === base
                            ? 'bg-brand-100 border-2 border-brand-500 scale-110'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Child's name
                  </label>
                  <input
                    type="text" value={childName}
                    onChange={e => setChildName(e.target.value)}
                    placeholder="e.g. Emma"
                    className="input" required autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Grade level
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={e => setGradeLevel(Number(e.target.value))}
                    className="input bg-white"
                  >
                    {GRADES.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Date of birth <span className="text-gray-400 font-normal">(optional — helps personalize AI responses)</span>
                  </label>
                  <input
                    type="date" value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="input" autoComplete="off"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</p>
                )}

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  Create {childName || 'child'}'s account 🚀
                </Button>
              </form>
            </motion.div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="text-center py-12"
            >
              <div className="text-7xl mb-5">🎉</div>
              <h1 className="text-3xl font-display font-black text-gray-900 mb-2">
                You're all set!
              </h1>
              <p className="text-gray-500 mb-2">
                Welcome to MindPath AI! {childName} is ready to start learning.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                First up: a short placement test to find {childName}'s perfect starting level.
              </p>
              <Button
                variant="primary" size="lg" fullWidth
                onClick={() => router.push('/parent/dashboard')}
              >
                Go to dashboard →
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
