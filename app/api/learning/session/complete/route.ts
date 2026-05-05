// app/api/learning/session/complete/route.ts
// Handles lesson completion: XP, mastery, streak, badges, missions

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { awardXP, updateStreak, checkAndAwardBadges, updateMissionProgress } from '@/lib/gamification/xp-engine'
import { updateSkillMastery } from '@/lib/learning/mastery-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      sessionId,
      lessonId,
      skillId,
      questionsAttempted,
      questionsCorrect,
      durationSeconds,
      attempts,           // Array of {questionId, isCorrect, timeTaken, hintUsed}
    } = body

    // Validate session belongs to this user
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.completed) return NextResponse.json({ error: 'Session already completed' }, { status: 400 })

    // Calculate score
    const score = questionsAttempted > 0
      ? Math.round((questionsCorrect / questionsAttempted) * 100)
      : 0

    // Get lesson XP reward
    const { data: lesson } = await supabase
      .from('lessons')
      .select('xp_reward, skill_id')
      .eq('id', lessonId)
      .single()

    const baseXP   = lesson?.xp_reward ?? 10
    const perfectBonus = score === 100 ? 25 : 0
    const totalXP  = baseXP + perfectBonus

    // 1. Mark session complete
    await supabase
      .from('learning_sessions')
      .update({
        completed:          true,
        completed_at:       new Date().toISOString(),
        duration_seconds:   durationSeconds,
        score,
        xp_earned:          totalXP,
        questions_attempted: questionsAttempted,
        questions_correct:   questionsCorrect,
      })
      .eq('id', sessionId)

    // 2. Award XP
    const xpResult = await awardXP(user.id, totalXP, 'lesson_complete', sessionId)

    // 3. Update streak
    const streakResult = await updateStreak(user.id)

    // 4. Update mastery (if skill attached)
    let masteryResult = null
    if (skillId && attempts?.length) {
      masteryResult = await updateSkillMastery(user.id, skillId, attempts)
    }

    // 5. Get total lessons completed
    const { count: totalLessons } = await supabase
      .from('learning_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('completed', true)

    // 6. Check and award badges
    const newBadges = await checkAndAwardBadges(user.id, {
      streak:           streakResult.currentStreak,
      lessonsCompleted: totalLessons ?? 0,
      isPerfectScore:   score === 100,
      isFirstLesson:    (totalLessons ?? 0) === 1,
    })

    // 7. Update daily missions
    await updateMissionProgress(user.id, {
      lessons:           1,
      correctAnswers:    questionsCorrect,
      streakMaintained:  streakResult.maintained,
    })

    return NextResponse.json({
      data: {
        score,
        xpEarned:      totalXP,
        totalXP:       xpResult.newTotal,
        leveledUp:     xpResult.leveledUp,
        newLevel:      xpResult.newLevel,
        streak:        streakResult.currentStreak,
        streakMaintained: streakResult.maintained,
        streakFreezeUsed: streakResult.freezeUsed,
        newBadges,
        masteryScore:  masteryResult?.masteryScore ?? null,
        skillsUnlocked: masteryResult?.skillUnlocked ?? [],
        perfectBonus:  perfectBonus > 0,
      },
      error: null,
    })
  } catch (error) {
    console.error('Session complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
