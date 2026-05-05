// app/api/learning/daily-plan/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDailyLessonPlan } from '@/lib/learning/mastery-engine'
import { getOrCreateDailyMissions } from '@/lib/gamification/xp-engine'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('grade_level, current_streak, xp_total, xp_level, placement_completed')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // If placement not done, return placement lesson
    if (!profile.placement_completed) {
      const { data: placementLesson } = await supabase
        .from('lessons')
        .select('id, title, subject_id, subjects(name, icon, color)')
        .eq('lesson_type', 'placement')
        .eq('is_published', true)
        .limit(1)
        .single()

      return NextResponse.json({
        data: {
          type:    'placement',
          lessons: placementLesson ? [{ ...placementLesson, reason: 'placement' }] : [],
          missions: null,
        },
        error: null,
      })
    }

    // Get personalized lesson plan
    const [planItems, missions] = await Promise.all([
      getDailyLessonPlan(user.id, profile.grade_level, 4),
      getOrCreateDailyMissions(user.id),
    ])

    // Hydrate lessons with full details
    const lessonIds = planItems.map(p => p.lesson_id)
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, lesson_type, estimated_minutes, xp_reward, difficulty_level, skill_id, subject_id, subjects(name, icon, color)')
      .in('id', lessonIds)

    // Merge plan metadata with lesson details
    const hydratedPlan = planItems.map(plan => {
      const lesson = lessons?.find(l => l.id === plan.lesson_id)
      return { ...lesson, reason: plan.reason, priority: plan.priority }
    }).filter(Boolean)

    return NextResponse.json({
      data: {
        type:    'daily',
        lessons: hydratedPlan,
        missions,
        streak:  profile.current_streak,
        xp:      { total: profile.xp_total, level: profile.xp_level },
      },
      error: null,
    })
  } catch (error) {
    console.error('Daily plan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
