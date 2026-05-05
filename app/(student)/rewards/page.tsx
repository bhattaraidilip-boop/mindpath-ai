'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Avatar, XPBar, StreakBadge, BottomNav, Card, ProgressRing, Spinner } from '@/components/ui'
import { levelForXP } from '@/lib/gamification/xp-engine'

interface Badge { id: string; slug: string; name: string; description: string; icon_url: string; rarity: string; category: string; xp_bonus: number; earned_at?: string }
interface Student { display_name: string; xp_total: number; xp_level: number; current_streak: number; longest_streak: number; avatar_config: Record<string, unknown> }

const RARITY_GLOW: Record<string, string> = {
  common:    'border-gray-200',
  rare:      'border-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]',
  epic:      'border-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.3)]',
  legendary: 'border-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.4)]',
}

const RARITY_BG: Record<string, string> = {
  common:    'bg-gray-50',
  rare:      'bg-blue-50',
  epic:      'bg-purple-50',
  legendary: 'bg-amber-50',
}

export default function RewardsPage() {
  const supabase = createClient()

  const [student, setStudent]           = useState<Student | null>(null)
  const [earnedBadges, setEarned]       = useState<Badge[]>([])
  const [allBadges, setAll]             = useState<Badge[]>([])
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState<'badges' | 'stats'>('badges')
  const [lessonsCount, setLessonsCount] = useState(0)
  const [totalXPEarned, setTotalXP]     = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: profile },
        { data: earned },
        { data: all },
        { count: lessons },
        { data: xpTxns },
      ] = await Promise.all([
        supabase.from('student_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('student_badges').select('*, badges(*)').eq('student_id', user.id).order('earned_at', { ascending: false }),
        supabase.from('badges').select('*').eq('is_active', true).order('category'),
        supabase.from('learning_sessions').select('*', { count: 'exact', head: true }).eq('student_id', user.id).eq('completed', true),
        supabase.from('xp_transactions').select('amount').eq('student_id', user.id),
      ])

      setStudent(profile)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEarned(earned?.map((e: any) => ({ ...e.badges, earned_at: e.earned_at })) ?? [])
      setAll(all ?? [])
      setLessonsCount(lessons ?? 0)
      setTotalXP(xpTxns?.reduce((s, t) => s + (t.amount ?? 0), 0) ?? 0)
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading || !student) {
    return (
      <div className="min-h-dvh bg-[#F8F9FF] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  const xpInfo     = levelForXP(student.xp_total)
  const earnedIds  = new Set(earnedBadges.map(b => b.id))
  const unearnedBadges = allBadges.filter(b => !earnedIds.has(b.id))

  const CATEGORY_LABELS: Record<string, string> = {
    streak:   '🔥 Streak',
    mastery:  '🎓 Mastery',
    speed:    '⚡ Speed',
    effort:   '💪 Effort',
    special:  '✨ Special',
    seasonal: '🎄 Seasonal',
  }

  return (
    <div className="min-h-dvh bg-[#F8F9FF]">
      <div className="page">

        {/* ── PROFILE HEADER ── */}
        <motion.div
          className="bg-gradient-to-br from-brand-500 to-purple-600 rounded-3xl p-5 mb-5 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              config={student.avatar_config as { base?: string; color?: string; background?: string }}
              size="lg"
              name={student.display_name}
            />
            <div className="flex-1">
              <h1 className="font-display font-black text-xl">{student.display_name}</h1>
              <StreakBadge streak={student.current_streak} size="sm" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-display font-black">{xpInfo.level}</p>
              <p className="text-white/70 text-xs">Level</p>
            </div>
          </div>

          {/* XP bar */}
          <div className="bg-white/20 rounded-full h-2.5 overflow-hidden mb-1">
            <motion.div
              className="h-2.5 bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpInfo.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/70">
            <span>{xpInfo.currentXP} XP</span>
            <span>{xpInfo.nextLevelXP} XP to level {xpInfo.level + 1}</span>
          </div>
        </motion.div>

        {/* ── QUICK STATS ── */}
        <motion.div
          className="grid grid-cols-3 gap-3 mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {[
            { label: 'Total XP',      value: student.xp_total.toLocaleString(), emoji: '⭐' },
            { label: 'Lessons Done',  value: String(lessonsCount),               emoji: '📚' },
            { label: 'Best Streak',   value: `${student.longest_streak}d`,       emoji: '🔥' },
          ].map(stat => (
            <Card key={stat.label} padding="sm" className="text-center">
              <p className="text-xl mb-0.5">{stat.emoji}</p>
              <p className="font-display font-black text-lg text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </Card>
          ))}
        </motion.div>

        {/* ── TABS ── */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
          {(['badges', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              {tab === 'badges' ? '🏅 Badges' : '📊 Stats'}
            </button>
          ))}
        </div>

        {/* ── BADGES TAB ── */}
        {activeTab === 'badges' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Earned */}
            {earnedBadges.length > 0 && (
              <div className="mb-6">
                <h2 className="section-title mb-3">Earned ({earnedBadges.length})</h2>
                <div className="grid grid-cols-3 gap-3">
                  {earnedBadges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-2xl border-2 p-3 text-center ${RARITY_GLOW[badge.rarity]} ${RARITY_BG[badge.rarity]}`}
                    >
                      <div className="text-3xl mb-1">🏅</div>
                      <p className="font-bold text-xs text-gray-800 leading-tight">{badge.name}</p>
                      {badge.xp_bonus > 0 && (
                        <p className="text-xs text-yellow-600 font-bold mt-0.5">+{badge.xp_bonus} XP</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Unearned */}
            {unearnedBadges.length > 0 && (
              <div>
                <h2 className="section-title mb-3 text-gray-400">
                  Locked ({unearnedBadges.length})
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {unearnedBadges.map(badge => (
                    <div
                      key={badge.id}
                      className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-3 text-center opacity-50"
                    >
                      <div className="text-3xl mb-1 grayscale">🔒</div>
                      <p className="font-bold text-xs text-gray-400 leading-tight">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Level progress ring */}
            <Card>
              <h3 className="font-display font-bold text-gray-900 mb-4">Level Progress</h3>
              <div className="flex items-center gap-6">
                <ProgressRing pct={xpInfo.progress} size={80}>
                  <span className="font-black text-brand-600 text-lg">{xpInfo.level}</span>
                </ProgressRing>
                <div>
                  <p className="font-bold text-gray-900">Level {xpInfo.level}</p>
                  <p className="text-sm text-gray-500">{xpInfo.currentXP} / {xpInfo.nextLevelXP} XP</p>
                  <p className="text-xs text-gray-400 mt-1">{xpInfo.nextLevelXP - xpInfo.currentXP} XP to next level</p>
                </div>
              </div>
            </Card>

            {/* Streak history */}
            <Card>
              <h3 className="font-display font-bold text-gray-900 mb-3">Streak</h3>
              <div className="flex gap-4">
                <div className="flex-1 text-center bg-orange-50 rounded-2xl py-4">
                  <p className="text-3xl font-display font-black text-orange-500">{student.current_streak}</p>
                  <p className="text-xs text-gray-400">Current</p>
                </div>
                <div className="flex-1 text-center bg-yellow-50 rounded-2xl py-4">
                  <p className="text-3xl font-display font-black text-yellow-500">{student.longest_streak}</p>
                  <p className="text-xs text-gray-400">Best ever</p>
                </div>
              </div>
            </Card>

            {/* Summary stats */}
            <Card>
              <h3 className="font-display font-bold text-gray-900 mb-3">Overall</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total XP earned',  value: `${student.xp_total.toLocaleString()} XP` },
                  { label: 'Lessons completed', value: String(lessonsCount) },
                  { label: 'Badges earned',     value: String(earnedBadges.length) },
                  { label: 'Badges remaining',  value: String(unearnedBadges.length) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">{row.label}</p>
                    <p className="font-bold text-gray-900 text-sm">{row.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

      </div>

      <BottomNav items={[
        { href: '/student/dashboard', icon: '🏠', label: 'Home' },
        { href: '/student/learn',     icon: '📚', label: 'Learn' },
        { href: '/student/rewards',   icon: '🏅', label: 'Rewards', active: true },
        { href: '/student/profile',   icon: '👤', label: 'Me' },
      ]} />
    </div>
  )
}
