'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button, Spinner, XPFlash } from '@/components/ui'
import { validateAnswer } from '@/lib/openai/tutor'

interface PlacementQuestion {
  id: string
  question_type: string
  content: {
    text: string
    options?: Array<{ id: string; text: string }>
    correct_answer: string | string[]
  }
  difficulty: number
  hint: string | null
  explanation: string | null
}

export default function PlacementPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [loading, setLoading]   = useState(true)
  const [questions, setQuestions] = useState<PlacementQuestion[]>([])
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [phase, setPhase]         = useState<'intro' | 'quiz' | 'result'>('intro')
  const [qIndex, setQIndex]       = useState(0)
  const [selected, setSelected]   = useState<string | null>(null)
  const [answered, setAnswered]   = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const [correctCount, setCorrectCount] = useState(0)
  const [xpFlash, setXpFlash]           = useState(false)
  const [resultLevel, setResultLevel]   = useState(0)

  // Load placement test lesson
  useEffect(() => {
    async function load() {
      const { data: lesson } = await supabase
        .from('lessons')
        .select('id, content')
        .eq('lesson_type', 'placement')
        .eq('is_published', true)
        .limit(1)
        .single()

      if (!lesson) { router.push('/student/dashboard'); return }

      setLessonId(lesson.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setQuestions((lesson.content as any)?.questions ?? [])

      // Create session
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: sess } = await supabase
          .from('learning_sessions')
          .insert({ student_id: user.id, lesson_id: lesson.id })
          .select('id').single()
        setSessionId(sess?.id ?? null)
      }

      setLoading(false)
    }
    load()
  }, [router, supabase])

  const current = questions[qIndex]
  const total   = questions.length
  const pct     = total > 0 ? ((qIndex + (answered ? 1 : 0)) / total) * 100 : 0

  function handleAnswer(answerId: string) {
    if (answered) return
    setSelected(answerId)

    const correct = validateAnswer(current.question_type, answerId, current.content.correct_answer)
    setIsCorrect(correct)
    setAnswered(true)
    if (correct) setCorrectCount(c => c + 1)
  }

  function nextQuestion() {
    if (qIndex >= total - 1) {
      finishTest()
    } else {
      setQIndex(i => i + 1)
      setSelected(null)
      setAnswered(false)
      setIsCorrect(false)
    }
  }

  async function finishTest() {
    // Calculate grade level from score
    const pctCorrect = correctCount / Math.max(1, total)
    let detectedGrade = 0
    if (pctCorrect >= 0.9) detectedGrade = 2
    else if (pctCorrect >= 0.7) detectedGrade = 1
    else detectedGrade = 0

    setResultLevel(detectedGrade)

    // Mark placement complete on student profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('student_profiles')
        .update({
          placement_completed: true,
          grade_level: detectedGrade,
        })
        .eq('user_id', user.id)

      // Complete session
      if (sessionId && lessonId) {
        await fetch('/api/learning/session/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            lessonId,
            skillId:            null,
            questionsAttempted: total,
            questionsCorrect:   correctCount,
            durationSeconds:    0,
            attempts:           [],
          }),
        })
      }

      // Award placement badge
      await supabase.from('student_badges').upsert({
        student_id: user.id,
        badge_id: (await supabase.from('badges').select('id').eq('slug', 'placement-done').single()).data?.id,
      })
    }

    setXpFlash(true)
    setTimeout(() => setXpFlash(false), 2000)
    setPhase('result')
  }

  const GRADE_LABELS: Record<number, { label: string; emoji: string; desc: string }> = {
    0: { label: 'Kindergarten Explorer',   emoji: '🌱', desc: "We'll start with the building blocks — counting, letters, and more!" },
    1: { label: 'Grade 1 Champion',        emoji: '⭐', desc: "You know the basics! We'll build on addition, reading, and more." },
    2: { label: 'Grade 2 Superstar',       emoji: '🚀', desc: "Nice work! You're ready for 2-digit numbers and longer stories." },
  }
  const gradeInfo = GRADE_LABELS[resultLevel] ?? GRADE_LABELS[0]

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F8F9FF] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F8F9FF] flex flex-col">

      {/* Progress bar (during quiz) */}
      {phase === 'quiz' && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <button onClick={() => router.back()} className="text-gray-400 p-1 min-h-0">✕</button>
            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-3 rounded-full bg-gradient-to-r from-brand-400 to-purple-500"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500">{qIndex + 1}/{total}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-5 pb-8">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              className="flex-1 flex flex-col justify-center items-center text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-7xl mb-6"
              >
                🎯
              </motion.div>
              <h1 className="font-display font-black text-3xl text-gray-900 mb-3">
                Discover your superpower level!
              </h1>
              <p className="text-gray-500 text-base max-w-xs leading-relaxed mb-3">
                Answer a few questions and we'll find the perfect starting point just for you.
              </p>
              <div className="flex gap-4 text-sm text-gray-400 mb-10">
                <span>⏱️ ~5 minutes</span>
                <span>✅ {total} questions</span>
                <span>🎁 25 XP reward</span>
              </div>

              {/* Fun preview of question topics */}
              <div className="flex gap-3 mb-10 flex-wrap justify-center">
                {['🔢 Math', '📚 Reading', '🧩 Logic'].map(t => (
                  <span key={t} className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-600">
                    {t}
                  </span>
                ))}
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={() => setPhase('quiz')}>
                Let's discover my level! 🚀
              </Button>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="mt-3 text-sm text-gray-400 font-medium"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {phase === 'quiz' && current && (
            <motion.div
              key={`pq-${qIndex}`}
              className="flex-1 flex flex-col py-8"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* Difficulty stars */}
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(d => (
                  <span key={d} className={`text-sm ${d <= (current.difficulty ?? 1) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>

              <h2 className="font-display font-black text-2xl text-gray-900 leading-tight mb-8">
                {current.content.text}
              </h2>

              {/* Options */}
              {current.question_type === 'multiple_choice' && (
                <div className="space-y-3 flex-1">
                  {current.content.options?.map(opt => {
                    const correctAnswer = current.content.correct_answer
                    const isThisCorrect = Array.isArray(correctAnswer)
                      ? correctAnswer.includes(opt.id)
                      : correctAnswer === opt.id

                    let cls = 'border-2 border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                    if (answered) {
                      if (isThisCorrect) cls = 'border-2 border-green-400 bg-green-50 text-green-800'
                      else if (selected === opt.id) cls = 'border-2 border-red-400 bg-red-50 text-red-800'
                    } else if (selected === opt.id) {
                      cls = 'border-2 border-brand-400 bg-brand-50 text-brand-800'
                    }

                    return (
                      <motion.button
                        key={opt.id}
                        whileTap={!answered ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswer(opt.id)}
                        className={`w-full text-left px-5 py-4 rounded-2xl font-semibold text-base transition-all ${cls}`}
                      >
                        {opt.text}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Feedback */}
              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 rounded-2xl p-4 ${isCorrect ? 'bg-green-50 border-2 border-green-300' : 'bg-orange-50 border-2 border-orange-200'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{isCorrect ? '🎉' : '💡'}</span>
                      <p className={`font-bold ${isCorrect ? 'text-green-700' : 'text-orange-700'}`}>
                        {isCorrect ? 'Correct!' : 'Almost!'}
                        {current.explanation && ` ${current.explanation}`}
                      </p>
                    </div>
                    <Button variant={isCorrect ? 'success' : 'primary'} size="md" fullWidth onClick={nextQuestion}>
                      {qIndex >= total - 1 ? 'See my results! 🎯' : 'Next question →'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {phase === 'result' && (
            <motion.div
              key="result"
              className="flex-1 flex flex-col items-center justify-center text-center py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                className="text-8xl mb-5"
              >
                {gradeInfo.emoji}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm font-bold text-brand-500 uppercase tracking-widest mb-2">
                  Your level
                </p>
                <h1 className="font-display font-black text-3xl text-gray-900 mb-3">
                  {gradeInfo.label}
                </h1>
                <p className="text-gray-500 max-w-xs mx-auto mb-4">{gradeInfo.desc}</p>

                <div className="flex justify-center gap-4 mb-8">
                  <div className="bg-white rounded-2xl px-5 py-3 shadow-card">
                    <p className="text-2xl font-display font-black text-green-500">{correctCount}/{total}</p>
                    <p className="text-xs text-gray-400">Correct</p>
                  </div>
                  <div className="bg-white rounded-2xl px-5 py-3 shadow-card">
                    <p className="text-2xl font-display font-black text-yellow-500">+25</p>
                    <p className="text-xs text-gray-400">XP earned</p>
                  </div>
                </div>

                <Button
                  variant="primary" size="lg" fullWidth
                  onClick={() => router.push('/student/dashboard')}
                >
                  Start learning! 🚀
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <XPFlash amount={25} visible={xpFlash} />
    </div>
  )
}
