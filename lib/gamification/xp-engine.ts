// lib/gamification/xp-engine.ts
// MindPath AI — XP, Level, Streak, Badge Engine

import { createClient } from '@/lib/supabase/server'
import type { XPReason, BadgeCriteria } from '@/types'

// ─── XP LEVELS ───────────────────────────────────────────────────────────────
export function xpForLevel(level: number): number {
  if (level <= 10) return level * 100
  if (level <= 25) return 1000 + (level - 10) * 250
  if (level <= 50) return 4750 + (level - 25) * 500
  return 17250 + (level - 50) * 1000
}

export function levelForXP(totalXP: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  let level = 1
  let accumulated = 0

  while (true) {
    const needed = xpForLevel(level)
    if (accumulated + needed > totalXP) {
      const currentXP  = totalXP - accumulated
      const nextLevelXP = needed
      return {
        level,
        currentXP,
        nextLevelXP,
        progress: Math.round((currentXP / nextLevelXP) * 100),
      }
    }
    accumulated += needed
    level++
  }
}

// ─── AWARD XP ────────────────────────────────────────────────────────────────
export async function awardXP(
  studentUserId: string,
  amount: number,
  reason: XPReason,
  referenceId?: string
): Promise<{ newTotal: number; leveledUp: boolean; newLevel: number }> {
  const supabase = await createClient()

  // Get current XP
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('xp_total, xp_level')
    .eq('user_id', studentUserId)
    .single()

  if (!profile) throw new Error('Student profile not found')

  const oldLevel   = levelForXP(profile.xp_total).level
  const newTotal   = profile.xp_total + amount
  const { level: newLevel } = levelForXP(newTotal)
  const leveledUp  = newLevel > oldLevel

  // Update profile
  await supabase
    .from('student_profiles')
    .update({ xp_total: newTotal, xp_level: newLevel })
    .eq('user_id', studentUserId)

  // Log transaction
  await supabase.from('xp_transactions').insert({
    student_id:   studentUserId,
    amount,
    reason,
    reference_id: referenceId ?? null,
  })

  return { newTotal, leveledUp, newLevel }
}

// ─── STREAKS ─────────────────────────────────────────────────────────────────
export async function updateStreak(studentUserId: string): Promise<{
  currentStreak: number
  maintained: boolean
  broken: boolean
  freezeUsed: boolean
}> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('current_streak, longest_streak, last_active_date, streak_freeze_available')
    .eq('user_id', studentUserId)
    .single()

  if (!profile) throw new Error('Profile not found')

  const today     = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr  = today.toISOString().split('T')[0]

  const lastActive = profile.last_active_date
    ? new Date(profile.last_active_date)
    : null

  // Already tracked today
  if (lastActive && lastActive.toISOString().split('T')[0] === todayStr) {
    return { currentStreak: profile.current_streak, maintained: true, broken: false, freezeUsed: false }
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak   = profile.current_streak
  let maintained  = false
  let broken      = false
  let freezeUsed  = false

  if (!lastActive) {
    // First ever session
    newStreak = 1
    maintained = true
  } else if (lastActive.toISOString().split('T')[0] === yesterdayStr) {
    // Consecutive day
    newStreak  = profile.current_streak + 1
    maintained = true
  } else {
    // Missed a day — check freeze
    const daysSinceActive = Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceActive === 2 && profile.streak_freeze_available > 0) {
      // Use freeze — streak preserved
      newStreak  = profile.current_streak + 1
      freezeUsed = true
      maintained = true
    } else {
      // Streak broken
      newStreak = 1
      broken    = true
    }
  }

  const newLongest = Math.max(newStreak, profile.longest_streak)

  await supabase
    .from('student_profiles')
    .update({
      current_streak:         newStreak,
      longest_streak:         newLongest,
      last_active_date:       todayStr,
      streak_freeze_available: freezeUsed
        ? profile.streak_freeze_available - 1
        : profile.streak_freeze_available,
    })
    .eq('user_id', studentUserId)

  return { currentStreak: newStreak, maintained, broken, freezeUsed }
}

// ─── BADGES ──────────────────────────────────────────────────────────────────
export async function checkAndAwardBadges(
  studentUserId: string,
  context: {
    streak?: number
    lessonsCompleted?: number
    isPerfectScore?: boolean
    subjectMastered?: string
    isFirstLesson?: boolean
    isComeback?: boolean
  }
): Promise<Array<{ id: string; name: string; xp_bonus: number; rarity: string }>> {
  const supabase = await createClient()

  // Get all active badges and already-earned badge IDs
  const [{ data: allBadges }, { data: earnedBadges }] = await Promise.all([
    supabase.from('badges').select('*').eq('is_active', true),
    supabase.from('student_badges').select('badge_id').eq('student_id', studentUserId),
  ])

  if (!allBadges) return []

  const earnedIds = new Set((earnedBadges ?? []).map(b => b.badge_id))
  const newlyEarned: Array<{ id: string; name: string; xp_bonus: number; rarity: string }> = []

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue

    const criteria = badge.criteria as BadgeCriteria
    let earned = false

    switch (criteria.type) {
      case 'streak_days':
        earned = !!context.streak && context.streak >= (criteria.threshold ?? 0)
        break
      case 'lessons_completed':
        earned = !!context.lessonsCompleted && context.lessonsCompleted >= (criteria.threshold ?? 0)
        break
      case 'perfect_score':
        earned = !!context.isPerfectScore
        break
      case 'mastery_score':
        earned = !!context.subjectMastered && context.subjectMastered === criteria.subject
        break
      case 'manual':
        if (badge.slug === 'first-lesson')  earned = !!context.isFirstLesson
        if (badge.slug === 'placement-done') earned = false // awarded manually
        if (badge.slug === 'comeback')      earned = !!context.isComeback
        break
    }

    if (earned) {
      await supabase.from('student_badges').insert({
        student_id: studentUserId,
        badge_id:   badge.id,
      })

      if (badge.xp_bonus > 0) {
        await awardXP(studentUserId, badge.xp_bonus, 'badge_earned', badge.id)
      }

      newlyEarned.push({
        id:       badge.id,
        name:     badge.name,
        xp_bonus: badge.xp_bonus,
        rarity:   badge.rarity,
      })
    }
  }

  return newlyEarned
}

// ─── DAILY MISSIONS ──────────────────────────────────────────────────────────
export async function getOrCreateDailyMissions(studentUserId: string) {
  const supabase = await createClient()
  const today    = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('student_id', studentUserId)
    .eq('date', today)
    .single()

  if (existing) return existing

  // Generate 3 daily missions
  const missions = [
    {
      id:          'mission-1',
      type:        'lessons',
      description: 'Complete 2 lessons today',
      target:      2,
      progress:    0,
      xp_reward:   20,
      emoji:       '📚',
    },
    {
      id:          'mission-2',
      type:        'questions',
      description: 'Answer 10 questions correctly',
      target:      10,
      progress:    0,
      xp_reward:   15,
      emoji:       '✅',
    },
    {
      id:          'mission-3',
      type:        'streak',
      description: 'Keep your streak going!',
      target:      1,
      progress:    0,
      xp_reward:   10,
      emoji:       '🔥',
    },
  ]

  const { data: created } = await supabase
    .from('daily_missions')
    .insert({ student_id: studentUserId, date: today, missions, bonus_xp: 50 })
    .select()
    .single()

  return created
}

export async function updateMissionProgress(
  studentUserId: string,
  updates: { lessons?: number; correctAnswers?: number; streakMaintained?: boolean }
) {
  const supabase = await createClient()
  const today    = new Date().toISOString().split('T')[0]

  const { data: missions } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('student_id', studentUserId)
    .eq('date', today)
    .single()

  if (!missions || missions.is_complete) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = missions.missions.map((m: any) => {
    const clone = { ...m }
    if (m.type === 'lessons'   && updates.lessons)         clone.progress = Math.min(m.target, m.progress + updates.lessons)
    if (m.type === 'questions' && updates.correctAnswers)  clone.progress = Math.min(m.target, m.progress + updates.correctAnswers)
    if (m.type === 'streak'    && updates.streakMaintained) clone.progress = 1
    return clone
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedIds = updated.filter((m: any) => m.progress >= m.target).map((m: any) => m.id)
  const allComplete  = completedIds.length === updated.length

  await supabase
    .from('daily_missions')
    .update({
      missions:           updated,
      completed_missions: completedIds,
      is_complete:        allComplete,
    })
    .eq('student_id', studentUserId)
    .eq('date', today)

  if (allComplete) {
    await awardXP(studentUserId, missions.bonus_xp, 'daily_mission', missions.id)
  }

  return { updated, completedIds, allComplete }
}
