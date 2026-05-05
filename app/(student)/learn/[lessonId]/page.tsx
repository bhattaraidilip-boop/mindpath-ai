'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { XPFlash, BadgeToast, LevelUpModal, Spinner, Button } from '@/components/ui'
import { trackAnswerSubmitted, trackLessonCompleted, trackSessionEnd } from '@/lib/analytics/track'
import { validateAnswer } from '@/lib/openai/tutor'

interface Question {
  id: string
  question_type: string
  content: {
    text: string
    options?: Array<{ id: string; text: string }>
    correct_answer: string | string[]
    fill_blank_template?: string
    word_bank?: string[]
  }
  hint: string | null
  explanation: string | null
}

interface Lesson {
  id: string
  title: string
  skill_id: string | null
  xp_reward: number
  difficulty_level: number
  content: { intro?: { text: string }; questions: Question[]; summary?: string }
  subjects: { name: string; icon: string; color: string }
}

type AnswerState = 'idle' | 'correct' | 'incorrect' | 'hint'
type LessonState = 'intro' | 'question' | 'summary'

export default function LessonPlayer() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const router       = useRouter()
  const supabase     = createClient()

  const [lesson, setLesson]       = useState<Lesson | null>(null)
  const [session, setSession]     = useState<{ id: string } | null>(null)
  const [loading, setLoading]     = useState(true)
  const [lessonState, setLessonState] = useState<LessonState>('intro')

  const [qIndex, setQIndex]           = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [fillValue, setFillValue]     = useState('')
  const [showHint, setShowHint]       = useState(false)
  const [attempts, setAttempts]       = useState(0)

  // Results tracking
  const [correctCount, setCorrectCount]   = useState(0)
  const [attemptCount, setAttemptCount]   = useState(0)
  const [sessionAttempts, setSessionAttempts] = useState<Array<{
    questionId: string; isCorrect: boolean; timeTaken: number; hintUsed: boolean
  }>>([])

  // Gamification
  const [xpFlash, setXpFlash]         = useState(false)
  const [xpAmount, setXpAmount]       = useState(0)
  const [pendingBadge, setPendingBadge] = useState<{ name: string; description: string; rarity: string } | null>(null)
  const [levelUp, setLevelUp]          = useState(0)

  // AI Tutor
  const [showAI, setShowAI]       = useState(false)
  const [aiLoading, setAILoading] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [aiInput, setAiInput]     = useState('')
  const [convId, setConvId]       = useState<string | null>(null)

  const questionStartTime = useRef(Date.now())

  // Load lesson
  useEffect(() => {
    async function load() {
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*, subjects(name, icon, color)')
        .eq('id', lessonId)
        .single()

      if (!lessonData) { router.push('/student/dashboard'); return }
      setLesson(lessonData as unknown as Lesson)

      // Create learning session
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sess } = await supabase
        .from('learning_sessions')
        .insert({ student_id: user.id, lesson_id: lessonId, mood_before: null })
        .select('id')
        .single()

      setSession(sess)
      setLoading(false)

      if (!lessonData.content?.intro?.text) setLessonState('question')
    }
    load()
  }, [lessonId, router, supabase])

  const currentQ = lesson?.content?.questions[qIndex]
  const totalQ   = lesson?.content?.questions.length ?? 0
  const progress = totalQ > 0 ? ((qIndex + (answerState !== 'idle' ? 1 : 0)) / totalQ) * 100 : 0

  // Submit answer
  const submitAnswer = useCallback((answer: string) => {
    if (!currentQ || answerState !== 'idle') return

    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000)
    const isCorrect = validateAnswer(currentQ.question_type, answer, currentQ.content.correct_answer)

    setAttempts(a => a + 1)
    setAttemptCount(a => a + 1)
    setAnswerState(isCorrect ? 'correct' : 'incorrect')

    if (isCorrect) {
      setCorrectCount(c => c + 1)
      setSelectedId(typeof currentQ.content.correct_answer === 'string'
        ? currentQ.content.correct_answer : currentQ.content.correct_answer[0])
    } else {
      setSelectedId(answer)
    }

    // Track attempt
    const attempt = { questionId: currentQ.id, isCorrect, timeTaken, hintUsed: showHint }
    setSessionAttempts(prev => [...prev, attempt])

    // Analytics
    const { data: { user } } = supabase.auth.getUser()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    user.then(u => {
      if (u.data?.user) trackAnswerSubmitted(u.data.user.id, currentQ.id, isCorrect, timeTaken, showHint)
    })

    // Store question attempt in DB
    if (session) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      supabase.from('question_attempts').insert({
        session_id:         session.id,
        student_id:         undefined, // set via RLS from auth.uid()
        question_id:        currentQ.id,
        answer:             { value: answer },
        is_correct:         isCorrect,
        time_taken_seconds: timeTaken,
        hint_used:          showHint,
        attempt_number:     attempts + 1,
      })
    }
  }, [currentQ, answerState, showHint, attempts, session, supabase])

  // Next question
  function nextQuestion() {
    const isLast = qIndex >= totalQ - 1

    if (isLast) {
      completeLesson()
    } else {
      setQIndex(i => i + 1)
      setAnswerState('idle')
      setSelectedId(null)
      setFillValue('')
      setShowHint(false)
      setAttempts(0)
      setShowAI(false)
      setAiMessage('')
      questionStartTime.current = Date.now()
    }
  }

  // Complete lesson
  async function completeLesson() {
    if (!lesson || !session) return

    const res = await fetch('/api/learning/session/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId:          session.id,
        lessonId:           lesson.id,
        skillId:            lesson.skill_id,
        questionsAttempted: attemptCount,
        questionsCorrect:   correctCount,
        durationSeconds:    undefined,
        attempts:           sessionAttempts,
      }),
    })

    const json = await res.json()
    if (json.data) {
      const { xpEarned, leveledUp, newLevel, newBadges, streak } = json.data

      setXpAmount(xpEarned)
      setXpFlash(true)
      setTimeout(() => setXpFlash(false), 2000)

      if (leveledUp) setTimeout(() => setLevelUp(newLevel), 800)
      if (newBadges?.length > 0) {
        setTimeout(() => setPendingBadge(newBadges[0]), 1500)
      }

      // Track analytics
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        trackLessonCompleted(user.id, lesson.id, Math.round((correctCount / Math.max(1, attemptCount)) * 100), 0, xpEarned)
        trackSessionEnd(user.id, session.id, 0, true)
      }
    }

    setLessonState('summary')
  }

  // AI Tutor
  async function askAI() {
    if (!aiInput.trim() || !currentQ) return
    setAILoading(true)

    const res = await fetch('/api/ai/tutor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:        aiInput,
        questionId:     currentQ.id,
        sessionId:      session?.id,
        conversationId: convId,
      }),
    })

    const json = await res.json()
    if (json.data) {
      setAiMessage(json.data.response)
      setConvId(json.data.conversationId)
    }
    setAiInput('')
    setAILoading(false)
  }

  if (loading || !lesson) {
    return (
      <div className="min-h-dvh bg-[#F8F9FF] flex items-center justify-center">
        <Spinner size={36} />
      </div>
    )
  }

  const subjectColor = lesson.subjects?.color ?? '#6366f1'

  return (
    <div className="min-h-dvh bg-[#F8F9FF] flex flex-col">

      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-gray-100 px-4 pt-safe-top">
        <div className="flex items-center gap-3 py-3 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 p-1 -ml-1 min-h-0"
          >
            ✕
          </button>
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-3 rounded-full"
              style={{ backgroundColor: subjectColor }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-xs font-bold text-gray-500 flex-shrink-0">
            {qIndex + 1}/{totalQ}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pb-6">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {lessonState === 'intro' && lesson.content.intro && (
            <motion.div
              key="intro"
              className="flex-1 flex flex-col justify-center items-center text-center py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
                style={{ backgroundColor: subjectColor + '22' }}
              >
                {lesson.subjects?.icon ?? '📖'}
              </div>
              <h1 className="font-display font-black text-2xl text-gray-900 mb-3">{lesson.title}</h1>
              <p className="text-gray-600 text-base mb-8 max-w-xs leading-relaxed">
                {lesson.content.intro.text}
              </p>
              <Button
                variant="primary" size="lg" fullWidth
                onClick={() => { setLessonState('question'); questionStartTime.current = Date.now() }}
              >
                Let's go! 🚀
              </Button>
            </motion.div>
          )}

          {/* ── QUESTION ── */}
          {lessonState === 'question' && currentQ && (
            <motion.div
              key={`q-${qIndex}`}
              className="flex-1 flex flex-col py-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* Question text */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {lesson.subjects?.name} · Question {qIndex + 1}
                </p>
                <h2 className="text-2xl font-display font-black text-gray-900 leading-tight">
                  {currentQ.content.text}
                </h2>
              </div>

              {/* ── MULTIPLE CHOICE ── */}
              {currentQ.question_type === 'multiple_choice' && (
                <div className="space-y-3 flex-1">
                  {currentQ.content.options?.map(opt => {
                    const isCorrectAnswer = Array.isArray(currentQ.content.correct_answer)
                      ? currentQ.content.correct_answer.includes(opt.id)
                      : currentQ.content.correct_answer === opt.id

                    let style = 'border-2 border-gray-200 bg-white text-gray-800'
                    if (answerState !== 'idle') {
                      if (isCorrectAnswer) style = 'border-2 border-green-400 bg-green-50 text-green-800'
                      else if (selectedId === opt.id) style = 'border-2 border-red-400 bg-red-50 text-red-800 animate-shake'
                    } else if (selectedId === opt.id) {
                      style = 'border-2 border-brand-400 bg-brand-50 text-brand-800'
                    }

                    return (
                      <motion.button
                        key={opt.id}
                        whileTap={answerState === 'idle' ? { scale: 0.98 } : {}}
                        onClick={() => answerState === 'idle' && submitAnswer(opt.id)}
                        className={`w-full text-left px-4 py-4 rounded-2xl font-semibold text-base transition-all ${style}`}
                      >
                        {opt.text}
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* ── FILL IN THE BLANK ── */}
              {currentQ.question_type === 'fill_blank' && (
                <div className="flex-1">
                  {currentQ.content.word_bank && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentQ.content.word_bank.map(word => (
                        <button
                          key={word}
                          onClick={() => setFillValue(word)}
                          className="px-4 py-2 bg-brand-50 text-brand-700 font-bold rounded-xl border-2 border-brand-200"
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={fillValue}
                    onChange={e => setFillValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fillValue && submitAnswer(fillValue)}
                    placeholder="Type your answer…"
                    className={`input text-xl font-bold text-center ${
                      answerState === 'correct' ? 'border-green-400 bg-green-50' :
                      answerState === 'incorrect' ? 'border-red-400 bg-red-50' : ''
                    }`}
                    disabled={answerState !== 'idle'}
                    autoCapitalize="off" autoCorrect="off"
                  />
                  {answerState === 'idle' && fillValue && (
                    <Button variant="primary" size="lg" fullWidth className="mt-4"
                      onClick={() => submitAnswer(fillValue)}>
                      Check answer
                    </Button>
                  )}
                </div>
              )}

              {/* ── HINT ── */}
              {answerState === 'idle' && currentQ.hint && !showHint && attempts > 0 && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setShowHint(true)}
                  className="mt-4 text-blue-500 font-semibold text-sm text-center w-full"
                >
                  💡 Need a hint?
                </motion.button>
              )}

              {showHint && currentQ.hint && answerState === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
                >
                  <p className="text-blue-700 text-sm font-medium">💡 {currentQ.hint}</p>
                </motion.div>
              )}

              {/* ── FEEDBACK PANEL ── */}
              <AnimatePresence>
                {answerState !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 rounded-2xl p-5 ${
                      answerState === 'correct'
                        ? 'bg-green-50 border-2 border-green-300'
                        : 'bg-red-50 border-2 border-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="text-2xl">{answerState === 'correct' ? '🎉' : '😮'}</span>
                      <div className="flex-1">
                        <p className={`font-display font-black text-base ${answerState === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
                          {answerState === 'correct' ? 'Correct! Amazing!' : 'Not quite!'}
                        </p>
                        {currentQ.explanation && (
                          <p className="text-sm mt-1 text-gray-600 leading-relaxed">
                            {currentQ.explanation}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={answerState === 'correct' ? 'success' : 'primary'}
                        size="md"
                        className="flex-1"
                        onClick={nextQuestion}
                      >
                        {qIndex >= totalQ - 1 ? 'Finish! 🏁' : 'Next →'}
                      </Button>
                      {answerState === 'incorrect' && (
                        <button
                          onClick={() => setShowAI(true)}
                          className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700"
                        >
                          🤖 Help
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* ── SUMMARY ── */}
          {lessonState === 'summary' && (
            <motion.div
              key="summary"
              className="flex-1 flex flex-col items-center justify-center text-center py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="text-7xl mb-4">
                {correctCount === totalQ ? '🏆' : correctCount >= totalQ * 0.7 ? '🎉' : '💪'}
              </div>
              <h2 className="font-display font-black text-3xl text-gray-900 mb-2">
                Lesson complete!
              </h2>
              <p className="text-gray-500 mb-6">
                {correctCount === totalQ
                  ? 'Perfect score! Incredible!'
                  : `You got ${correctCount} out of ${totalQ} correct.`}
              </p>

              {/* Score stats */}
              <div className="flex gap-4 mb-8">
                <div className="bg-white rounded-2xl px-6 py-4 shadow-card text-center">
                  <p className="text-3xl font-display font-black text-green-500">{correctCount}/{totalQ}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Correct</p>
                </div>
                <div className="bg-white rounded-2xl px-6 py-4 shadow-card text-center">
                  <p className="text-3xl font-display font-black text-yellow-500">+{xpAmount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">XP earned</p>
                </div>
                <div className="bg-white rounded-2xl px-6 py-4 shadow-card text-center">
                  <p className="text-3xl font-display font-black text-brand-500">
                    {Math.round((correctCount / Math.max(1, totalQ)) * 100)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Score</p>
                </div>
              </div>

              {lesson.content.summary && (
                <p className="text-gray-600 text-sm mb-6 max-w-xs">{lesson.content.summary}</p>
              )}

              <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/student/dashboard')}>
                Back to Home 🏠
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── AI TUTOR DRAWER ── */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAI(false)}
          >
            <motion.div
              className="w-full bg-white rounded-t-3xl p-5 pb-10 max-w-lg mx-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-display font-bold text-gray-900 text-sm">AI Tutor</p>
                  <p className="text-xs text-gray-400">Ask me anything about this question!</p>
                </div>
              </div>

              {aiMessage && (
                <div className="bg-brand-50 rounded-2xl p-4 mb-4">
                  <p className="text-gray-800 text-sm leading-relaxed">{aiMessage}</p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !aiLoading && askAI()}
                  placeholder="Ask a question…"
                  className="input flex-1 py-2 text-sm"
                  autoFocus
                />
                <button
                  onClick={askAI}
                  disabled={!aiInput.trim() || aiLoading}
                  className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                >
                  {aiLoading ? <Spinner size={14} white /> : '›'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <XPFlash amount={xpAmount} visible={xpFlash} />
      <BadgeToast badge={pendingBadge} onClose={() => setPendingBadge(null)} />
      <LevelUpModal level={levelUp} onClose={() => setLevelUp(0)} />
    </div>
  )
}
