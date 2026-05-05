'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Card, Avatar, StreakBadge, ProgressRing, Spinner, Button } from '@/components/ui'

interface ChildSummary {
  student: {
    id: string
    display_name: string
    grade_level: number
    xp_total: number
    current_streak: number
    avatar_config: Record<string, unknown>
    placement_completed: boolean
  }
  today: { lessonsCompleted: number; xpEarned: number; timeMinutes: number }
  week:  { wald: number; avgScore: number; lessonsCompleted: number }
  subjects: Array<{ name: string; icon: string; color: string; mastery: number }>
  recentBadges: Array<{ name: string; earned_at: string }>
  subscription: { plan_id: string; status: string }
}

const GRADE_LABELS: Record<number, string> = {
  0: 'Pre-K', 1: 'Kindergarten', 2: 'Grade 1', 3: 'Grade 2',
  4: 'Grade 3', 5: 'Grade 4', 6: 'Grade 5', 7: 'Grade 6',
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: 'Free',        color: 'bg-gray-100 text-gray-600' },
  starter: { label: 'Starter',     color: 'bg-brand-100 text-brand-700' },
  family:  { label: 'Family',      color: 'bg-purple-100 text-purple-700' },
  premium: { label: 'Premium AI',  color: 'bg-amber-100 text-amber-700' },
  school:  { label: 'School',      color: 'bg-green-100 text-green-700' },
}

export default function ParentDashboard() {
  const supabase = createClient()

  const [children, setChildren] = useState<ChildSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [parentName, setParentName] = useState('')
  const [planId, setPlanId]     = useState('free')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setParentName(userData?.full_name ?? '')

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('user_id', user.id)
        .single()
      setPlanId(sub?.plan_id ?? 'free')

      // Get all children
      const { data: links } = await supabase
        .from('parent_children')
        .select('child_id')
        .eq('parent_id', user.id)

      if (!links?.length) { setLoading(false); return }

      const childIds = links.map(l => l.child_id)

      const summaries: ChildSummary[] = await Promise.all(
        childIds.map(async (childId) => {
          const today = new Date().toISOString().split('T')[0]
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

          const [
            { data: profile },
            { data: todaySessions },
            { data: weekSessions },
            { data: skillProgress },
            { data: recentBadges },
          ] = await Promise.all([
            supabase.from('student_profiles').select('*').eq('user_id', childId).single(),
            supabase.from('learning_sessions')
              .select('xp_earned, duration_seconds, score, completed')
              .eq('student_id', childId)
              .eq('completed', true)
              .gte('started_at', `${today}T00:00:00`),
            supabase.from('learning_sessions')
              .select('started_at, score, completed')
              .eq('student_id', childId)
              .eq('completed', true)
              .gte('started_at', weekAgo),
            supabase.from('student_skill_progress')
              .select('mastery_score, skill_nodes(subjects(name, icon, color))')
              .eq('student_id', childId)
              .not('status', 'eq', 'locked'),
            supabase.from('student_badges')
              .select('earned_at, badges(name)')
              .eq('student_id', childId)
              .order('earned_at', { ascending: false })
              .limit(3),
          ])

          // Today's stats
          const todayXP   = todaySessions?.reduce((s, sess) => s + (sess.xp_earned ?? 0), 0) ?? 0
          const todayMins = Math.round((todaySessions?.reduce((s, sess) => s + (sess.duration_seconds ?? 0), 0) ?? 0) / 60)

          // Weekly WALD
          const activeDays = new Set(weekSessions?.map(s => s.started_at.split('T')[0]) ?? []).size
          const scores     = weekSessions?.filter(s => s.score != null).map(s => s.score as number) ?? []
          const avgScore   = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

          // Subject mastery
          const subjectMap: Record<string, { name: string; icon: string; color: string; scores: number[] }> = {}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          skillProgress?.forEach((sp: any) => {
            const subj = sp.skill_nodes?.subjects
            if (subj) {
              if (!subjectMap[subj.name]) subjectMap[subj.name] = { ...subj, scores: [] }
              subjectMap[subj.name].scores.push(sp.mastery_score)
            }
          })
          const subjects = Object.values(subjectMap).map(s => ({
            name:    s.name,
            icon:    s.icon,
            color:   s.color,
            mastery: s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0,
          }))

          return {
            student: profile!,
            today:   { lessonsCompleted: todaySessions?.length ?? 0, xpEarned: todayXP, timeMinutes: todayMins },
            week:    { wald: activeDays, avgScore, lessonsCompleted: weekSessions?.length ?? 0 },
            subjects,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recentBadges: recentBadges?.map((b: any) => ({ name: b.badges?.name ?? '', earned_at: b.earned_at })) ?? [],
            subscription: { plan_id: sub?.plan_id ?? 'free', status: sub?.status ?? 'active' },
          }
        })
      )

      setChildren(summaries.filter(Boolean))
      setLoading(false)
    }
    load()
  }, [supabase])

  const plan = PLAN_LABELS[planId] ?? PLAN_LABELS.free
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F8F9FF] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F8F9FF]">
      <div className="page">

        {/* ── HEADER ── */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-xs text-gray-400">{greeting},</p>
            <h1 className="font-display font-black text-2xl text-gray-900">
              {parentName?.split(' ')[0]} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${plan.color}`}>
              {plan.label}
            </span>
            <a
              href="/parent/subscription"
              className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              ⚙️
            </a>
          </div>
        </motion.div>

        {/* ── NO CHILDREN ── */}
        {children.length === 0 && (
          <Card className="text-center py-10">
            <div className="text-5xl mb-3">👶</div>
            <h3 className="font-display font-bold text-gray-900 text-lg mb-2">No children added yet</h3>
            <p className="text-gray-500 text-sm mb-4">Add your child to start tracking their progress.</p>
            <Button variant="primary" onClick={() => window.location.href = '/parent/add-child'}>
              Add a child
            </Button>
          </Card>
        )}

        {/* ── CHILDREN CARDS ── */}
        <div className="space-y-5">
          {children.map((child, i) => (
            <ChildCard key={child.student.id} data={child} index={i} />
          ))}
        </div>

        {/* ── ADD CHILD ── */}
        {children.length > 0 && (
          <motion.div
            className="mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => window.location.href = '/parent/add-child'}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-4 text-gray-400 font-semibold text-sm flex items-center justify-center gap-2 hover:border-brand-300 hover:text-brand-500 transition-colors"
            >
              + Add another child
            </button>
          </motion.div>
        )}

        {/* ── UPGRADE BANNER (free plan) ── */}
        {planId === 'free' && children.length > 0 && (
          <motion.div
            className="mt-5 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl p-5 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-display font-black text-lg mb-1">Unlock AI Tutoring 🤖</h3>
            <p className="text-white/80 text-sm mb-4">
              Upgrade to get unlimited lessons, AI explanations, and weekly progress reports.
            </p>
            <Button
              variant="secondary"
              className="!bg-white !text-brand-600 w-full"
              onClick={() => window.location.href = '/parent/subscription'}
            >
              Upgrade from $12/month →
            </Button>
          </motion.div>
        )}

      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 safe-bottom z-30">
        <div className="flex items-stretch max-w-lg mx-auto">
          {[
            { href: '/parent/dashboard',     icon: '🏠', label: 'Home',     active: true },
            { href: '/parent/reports',       icon: '📊', label: 'Reports' },
            { href: '/parent/subscription',  icon: '💳', label: 'Plan' },
            { href: '/parent/settings',      icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-semibold ${item.active ? 'text-brand-600' : 'text-gray-400'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}

// ─── CHILD SUMMARY CARD ───────────────────────────────────────────────────────
function ChildCard({ data, index }: { data: ChildSummary; index: number }) {
  const { student, today, week, subjects, recentBadges } = data

  const waldColor = week.wald >= 5 ? 'text-green-500' : week.wald >= 3 ? 'text-yellow-500' : 'text-red-500'
  const todayDone = today.lessonsCompleted > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card hover onClick={() => window.location.href = `/parent/child/${student.id}`}>

        {/* Child header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar
            config={student.avatar_config as { base?: string; color?: string; background?: string }}
            size="md"
            name={student.display_name}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-lg text-gray-900">{student.display_name}</h2>
              {todayDone && (
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                  ✅ Done today
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {GRADE_LABELS[student.grade_level] ?? `Grade ${student.grade_level}`}
              {student.placement_completed ? '' : ' · Placement pending'}
            </p>
          </div>
          <StreakBadge streak={student.current_streak} size="sm" />
        </div>

        {/* Today stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Today's lessons",  value: String(today.lessonsCompleted),  emoji: '📚' },
            { label: 'XP earned today',  value: `+${today.xpEarned}`,            emoji: '⭐' },
            { label: 'WALD this week',   value: `${week.wald}/7`,                emoji: '📅', color: waldColor },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold mb-0.5">{stat.emoji}</p>
              <p className={`font-display font-black text-base ${stat.color ?? 'text-gray-900'}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Subject mastery */}
        {subjects.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">Subject Mastery</p>
            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="text-sm">{s.icon}</span>
                  <p className="text-xs text-gray-600 w-20 flex-shrink-0">{s.name}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.mastery}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 w-8 text-right">{s.mastery}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent badges */}
        {recentBadges.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Recent Badges</p>
            <div className="flex gap-2 flex-wrap">
              {recentBadges.map(badge => (
                <span key={badge.earned_at} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1 font-semibold">
                  🏅 {badge.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Placement nudge */}
        {!student.placement_completed && (
          <div className="mt-3 bg-purple-50 rounded-xl p-3 flex items-center gap-2">
            <span className="text-purple-500 text-sm">🎯</span>
            <p className="text-xs text-purple-700 font-medium">Placement test not completed yet</p>
          </div>
        )}

        <p className="text-xs text-brand-500 font-semibold mt-3 text-right">View full report →</p>
      </Card>
    </motion.div>
  )
}
