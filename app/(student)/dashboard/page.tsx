'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  XPBar, StreakBadge, DailyMissionCard, SubjectCard,
  MoodPicker, BadgeToast, LevelUpModal, Avatar, BottomNav, Card, Spinner
} from '@/components/ui'
import { levelForXP } from '@/lib/gamification/xp-engine'
import { trackLessonStarted } from '@/lib/analytics/track'

interface DashboardData {
  student: {
    id: string
    display_name: string
    grade_level: number
    xp_total: number
    xp_level: number
    current_streak: number
    placement_completed: boolean
    avatar_config: Record<string, unknown>
  }
  lessons: Array<{
    id: string
    title: string
    lesson_type: string
    estimated_minutes: number
    xp_reward: number
    difficulty_level: number
    reason: string
    subjects: { name: string; icon: string; color: string }
  }>
  missions: {
    missions: Array<{ id: string; emoji: string; description: string; progress: number; target: number; xp_reward: number }>
    bonus_xp: number
    is_complete: boolean
  } | null
  subjects: Array<{ slug: string; name: string; icon: string; color: string; mastery: number }>
}

export default function StudentDashboard() {
  const supabase = createClient()
  const [data, setData]         = useState<DashboardData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [showMood, setShowMood] = useState(false)
  const [pendingBadge, setPendingBadge] = useState<{ name: string; description: string; rarity: string } | null>(null)
  const [levelUpVal, setLevelUpVal]     = useState(0)
  const [greeting, setGreeting] = useState('Good morning')

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/learning/daily-plan')
    const json = await res.json()

    if (json.data) {
      // Get student profile for subjects/mastery
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: skillProgress } = await supabase
        .from('student_skill_progress')
        .select('mastery_score, skill_nodes(subject_id, subjects(slug, name, icon, color))')
        .eq('student_id', user.id)

      // Aggregate mastery by subject
      const subjectMap: Record<string, { name: string; icon: string; color: string; slug: string; scores: number[] }> = {}
      skillProgress?.forEach((sp: unknown) => {
        const p = sp as { mastery_score: number; skill_nodes: { subjects: { slug: string; name: string; icon: string; color: string } } }
        const subj = p.skill_nodes?.subjects
        if (subj) {
          if (!subjectMap[subj.slug]) subjectMap[subj.slug] = { ...subj, scores: [] }
          subjectMap[subj.slug].scores.push(p.mastery_score)
        }
      })

      const subjects = Object.values(subjectMap).map(s => ({
        slug:    s.slug,
        name:    s.name,
        icon:    s.icon,
        color:   s.color,
        mastery: s.scores.length
          ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
          : 0,
      }))

      setData({
        student: profile,
        lessons: json.data.lessons ?? [],
        missions: json.data.missions,
        subjects,
      })

      // Show mood check if first session today
      const today = new Date().toISOString().split('T')[0]
      const lastMood = localStorage.getItem(`mood_${today}`)
      if (!lastMood && profile?.placement_completed) setShowMood(true)
    }

    setLoading(false)
    setGreeting(greet())
  }, [supabase])

  useEffect(() => { load() }, [load])

  function handleMoodSelect(mood: number) {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`mood_${today}`, String(mood))
    setShowMood(false)
  }

  function openLesson(lessonId: string, subjectSlug: string) {
    if (data?.student.id) {
      trackLessonStarted(data.student.id, lessonId, subjectSlug)
    }
    window.location.href = `/student/learn/${lessonId}`
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F8F9FF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={32} />
          <p className="text-gray-400 text-sm">Loading your lessons…</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { student, lessons, missions, subjects } = data
  const xpInfo = levelForXP(student.xp_total)
  const isPlacement = !student.placement_completed

  return (
    <div className="min-h-dvh bg-[#F8F9FF]">
      <div className="page">

        {/* ── HEADER ── */}
        <motion.div
          className="flex items-center justify-between mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <Avatar config={student.avatar_config as { base?: string; color?: string; background?: string }} size="md" name={student.display_name} />
            <div>
              <p className="text-xs text-gray-400">{greeting},</p>
              <h1 className="font-display font-black text-xl text-gray-900 leading-tight">
                {student.display_name}! 👋
              </h1>
            </div>
          </div>
          <StreakBadge streak={student.current_streak} />
        </motion.div>

        {/* ── XP BAR ── */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <XPBar
            currentXP={xpInfo.currentXP}
            nextLevelXP={xpInfo.nextLevelXP}
            level={xpInfo.level}
          />
        </motion.div>

        {/* ── PLACEMENT BANNER ── */}
        {isPlacement && (
          <motion.div
            className="mb-5 bg-gradient-to-r from-brand-500 to-purple-500 rounded-2xl p-5 text-white"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="font-display font-black text-lg leading-tight">
                  Discover your superpower level!
                </h2>
                <p className="text-white/80 text-sm">5-minute quiz · No pressure</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/student/placement'}
              className="w-full bg-white text-brand-600 font-bold rounded-xl py-2.5 text-sm active:scale-[0.98] transition-all"
            >
              Start Placement Test →
            </button>
          </motion.div>
        )}

        {/* ── DAILY MISSIONS ── */}
        {missions && (
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DailyMissionCard missions={missions.missions} bonusXP={missions.bonus_xp} />
          </motion.div>
        )}

        {/* ── TODAY'S LESSONS ── */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Today's Lessons</h2>
            {lessons.length > 0 && (
              <span className="text-xs text-gray-400">{lessons.length} ready</span>
            )}
          </div>

          {lessons.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-display font-bold text-gray-800">All done for today!</p>
              <p className="text-gray-500 text-sm mt-1">Come back tomorrow to keep your streak.</p>
            </Card>
          ) : (
            <div className="space-y-3 stagger">
              {lessons.map((lesson, i) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={i}
                  onStart={() => openLesson(lesson.id, lesson.subjects?.name?.toLowerCase())}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── SUBJECTS ── */}
        {subjects.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="section-title mb-3">Your Subjects</h2>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map(s => (
                <SubjectCard
                  key={s.slug}
                  icon={s.icon}
                  name={s.name}
                  color={s.color}
                  mastery={s.mastery}
                  progress={s.mastery}
                  onClick={() => window.location.href = `/student/learn?subject=${s.slug}`}
                />
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* ── BOTTOM NAV ── */}
      <BottomNav items={[
        { href: '/student/dashboard', icon: '🏠', label: 'Home',    active: true },
        { href: '/student/learn',     icon: '📚', label: 'Learn' },
        { href: '/student/rewards',   icon: '🏅', label: 'Rewards' },
        { href: '/student/profile',   icon: '👤', label: 'Me' },
      ]} />

      {/* Overlays */}
      {showMood && <MoodPicker onSelect={handleMoodSelect} />}
      <BadgeToast badge={pendingBadge} onClose={() => setPendingBadge(null)} />
      <LevelUpModal level={levelUpVal} onClose={() => setLevelUpVal(0)} />
    </div>
  )
}

// ─── LESSON CARD COMPONENT ────────────────────────────────────────────────────
function LessonCard({
  lesson, index, onStart
}: {
  lesson: DashboardData['lessons'][0]
  index: number
  onStart: () => void
}) {
  const difficultyColors = ['', 'bg-green-400', 'bg-lime-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400']
  const reasonLabels: Record<string, { label: string; color: string }> = {
    placement: { label: 'Start here!', color: 'text-purple-600 bg-purple-50' },
    review:    { label: 'Review',       color: 'text-blue-600 bg-blue-50' },
    continue:  { label: 'Continue',     color: 'text-brand-600 bg-brand-50' },
    new:       { label: 'New!',          color: 'text-green-600 bg-green-50' },
  }
  const tag = reasonLabels[lesson.reason] ?? { label: '', color: '' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card hover onClick={onStart} className="flex items-center gap-4">
        {/* Subject icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: (lesson.subjects?.color ?? '#6366f1') + '22' }}
        >
          {lesson.subjects?.icon ?? '📖'}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display font-bold text-gray-900 text-sm truncate">{lesson.title}</h3>
            {tag.label && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tag.color}`}>
                {tag.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{lesson.subjects?.name}</span>
            <span>·</span>
            <span>{lesson.estimated_minutes} min</span>
            <span>·</span>
            <span className="text-yellow-600 font-semibold">+{lesson.xp_reward} XP</span>
          </div>
        </div>

        {/* Difficulty + arrow */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(d => (
              <div
                key={d}
                className={`w-1.5 h-1.5 rounded-full ${d <= lesson.difficulty_level ? difficultyColors[lesson.difficulty_level] : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-gray-300 text-lg">›</span>
        </div>
      </Card>
    </motion.div>
  )
}
