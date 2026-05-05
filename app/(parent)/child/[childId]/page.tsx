'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Card, Avatar, StreakBadge, ProgressRing, Spinner, Button } from '@/components/ui'

interface Session { id: string; started_at: string; score: number; xp_earned: number; duration_seconds: number; completed: boolean; lessons: { title: string; subjects: { name: string; icon: string } } }

export default function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>()
  const supabase = createClient()

  const [loading, setLoading]     = useState(true)
  const [profile, setProfile]     = useState<Record<string, unknown> | null>(null)
  const [sessions, setSessions]   = useState<Session[]>([])
  const [subjects, setSubjects]   = useState<Array<{ name: string; icon: string; color: string; mastery: number }>>([])
  const [badges, setBadges]       = useState<Array<{ name: string; rarity: string; earned_at: string }>>([])
  const [activeTab, setActiveTab] = useState<'activity' | 'progress' | 'badges'>('activity')

  useEffect(() => {
    async function load() {
      const [
        { data: prof },
        { data: sess },
        { data: skillProg },
        { data: bdgs },
      ] = await Promise.all([
        supabase.from('student_profiles').select('*').eq('user_id', childId).single(),
        supabase.from('learning_sessions')
          .select('*, lessons(title, subjects(name, icon))')
          .eq('student_id', childId)
          .eq('completed', true)
          .order('started_at', { ascending: false })
          .limit(20),
        supabase.from('student_skill_progress')
          .select('mastery_score, skill_nodes(subjects(name, icon, color))')
          .eq('student_id', childId),
        supabase.from('student_badges')
          .select('earned_at, badges(name, rarity)')
          .eq('student_id', childId)
          .order('earned_at', { ascending: false }),
      ])

      setProfile(prof)
      setSessions((sess as unknown as Session[]) ?? [])

      const subjectMap: Record<string, { name: string; icon: string; color: string; scores: number[] }> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      skillProg?.forEach((sp: any) => {
        const subj = sp.skill_nodes?.subjects
        if (subj) {
          if (!subjectMap[subj.name]) subjectMap[subj.name] = { ...subj, scores: [] }
          subjectMap[subj.name].scores.push(sp.mastery_score)
        }
      })
      setSubjects(Object.values(subjectMap).map(s => ({
        name:    s.name,
        icon:    s.icon,
        color:   s.color,
        mastery: s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0,
      })))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBadges(bdgs?.map((b: any) => ({ name: b.badges?.name, rarity: b.badges?.rarity, earned_at: b.earned_at })) ?? [])
      setLoading(false)
    }
    load()
  }, [childId, supabase])

  // Weekly WALD
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.started_at)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  })
  const wald = new Set(weekSessions.map(s => s.started_at.split('T')[0])).size
  const avgScore = weekSessions.length
    ? Math.round(weekSessions.reduce((s, sess) => s + (sess.score ?? 0), 0) / weekSessions.length)
    : 0

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center bg-[#F8F9FF]"><Spinner size={32} /></div>
  }
  if (!profile) return null

  const GRADE_LABELS: Record<number, string> = { 0: 'Pre-K', 1: 'Kindergarten', 2: 'Grade 1', 3: 'Grade 2', 4: 'Grade 3' }

  return (
    <div className="min-h-dvh bg-[#F8F9FF]">
      <div className="page">

        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="text-gray-400 p-1 min-h-0">←</button>
          <h1 className="font-display font-black text-xl text-gray-900">{String(profile.display_name)}'s Progress</h1>
        </div>

        {/* Profile card */}
        <motion.div
          className="bg-gradient-to-br from-brand-500 to-purple-600 rounded-3xl p-5 mb-5 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <Avatar config={profile.avatar_config as { base?: string; background?: string }} size="lg" />
            <div className="flex-1">
              <h2 className="font-display font-black text-xl">{String(profile.display_name)}</h2>
              <p className="text-white/70 text-sm">{GRADE_LABELS[Number(profile.grade_level)] ?? `Grade ${profile.grade_level}`}</p>
            </div>
            <StreakBadge streak={Number(profile.current_streak)} size="sm" />
          </div>

          {/* WALD meter */}
          <div className="bg-white/20 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold">Weekly Learning Days (WALD)</p>
              <span className={`text-lg font-black ${wald >= 5 ? 'text-green-300' : wald >= 3 ? 'text-yellow-300' : 'text-red-300'}`}>
                {wald}/7
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-full ${i < wald ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total sessions',  value: String(sessions.length),   emoji: '📚' },
            { label: 'Avg score',       value: `${avgScore}%`,            emoji: '🎯' },
            { label: 'Badges earned',   value: String(badges.length),     emoji: '🏅' },
          ].map(s => (
            <Card key={s.label} padding="sm" className="text-center">
              <p className="text-xl mb-0.5">{s.emoji}</p>
              <p className="font-display font-black text-lg text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
          {(['activity', 'progress', 'badges'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
            >
              {tab === 'activity' ? '📅 Activity' : tab === 'progress' ? '📊 Progress' : '🏅 Badges'}
            </button>
          ))}
        </div>

        {/* Activity */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-4xl mb-2">📚</p>
                <p className="text-gray-500 text-sm">No sessions yet</p>
              </Card>
            ) : sessions.map(s => (
              <Card key={s.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{s.lessons?.subjects?.icon ?? '📖'}</div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{s.lessons?.title ?? 'Lesson'}</p>
                    <p className="text-xs text-gray-400">{formatDate(s.started_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-sm ${(s.score ?? 0) >= 80 ? 'text-green-500' : (s.score ?? 0) >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {s.score != null ? `${s.score}%` : '—'}
                    </p>
                    <p className="text-xs text-yellow-600">+{s.xp_earned} XP</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Progress */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            {subjects.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500 text-sm">No subject data yet</p>
              </Card>
            ) : subjects.map(s => (
              <Card key={s.name}>
                <div className="flex items-center gap-4">
                  <ProgressRing pct={s.mastery} size={56} color={s.color}>
                    <span className="text-xs font-black" style={{ color: s.color }}>{s.mastery}%</span>
                  </ProgressRing>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{s.icon}</span>
                      <p className="font-display font-bold text-gray-900">{s.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">{s.mastery}% mastery</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.mastery}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Badges */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-3 gap-3">
            {badges.map(b => (
              <Card key={b.earned_at} padding="sm" className="text-center">
                <p className="text-2xl mb-1">🏅</p>
                <p className="text-xs font-bold text-gray-800 leading-tight">{b.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(b.earned_at).toLocaleDateString()}</p>
              </Card>
            ))}
            {badges.length === 0 && (
              <div className="col-span-3 text-center py-8">
                <p className="text-4xl mb-2">🏅</p>
                <p className="text-gray-500 text-sm">No badges yet — keep learning!</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
