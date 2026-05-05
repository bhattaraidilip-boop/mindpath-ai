// lib/learning/mastery-engine.ts
// MindPath AI — Adaptive Learning & Mastery Tracking

import { createClient } from '@/lib/supabase/server'

// ─── MASTERY SCORING ─────────────────────────────────────────────────────────
interface Attempt {
  is_correct: boolean
  time_taken_seconds: number
  hint_used: boolean
  attempt_number: number
  created_at: string
}

export function calculateMasteryScore(attempts: Attempt[]): number {
  if (!attempts.length) return 0

  // Use last 10 attempts, weighted by recency
  const recent = attempts.slice(-10)
  let weightedSum   = 0
  let weightTotal   = 0

  recent.forEach((attempt, index) => {
    const weight  = (index + 1) / recent.length  // more recent = higher weight
    const correct = attempt.is_correct ? 1 : 0
    const hintPenalty = attempt.hint_used ? 0.8 : 1       // penalty for hint use
    const retryPenalty = attempt.attempt_number > 1 ? 0.85 : 1  // penalty for retries

    weightedSum  += correct * weight * hintPenalty * retryPenalty
    weightTotal  += weight
  })

  return Math.round((weightedSum / weightTotal) * 100)
}

export function calculateConfidenceScore(attempts: Attempt[]): number {
  if (!attempts.length) return 0

  const recent = attempts.slice(-5)
  const correctAttempts = recent.filter(a => a.is_correct)
  if (!correctAttempts.length) return 0

  const avgTime = correctAttempts.reduce((s, a) => s + a.time_taken_seconds, 0) / correctAttempts.length

  // Faster + correct = higher confidence
  // Baseline: 30 seconds = neutral confidence
  const speedFactor = Math.max(0.5, Math.min(1.5, 30 / Math.max(avgTime, 5)))
  const accuracy    = correctAttempts.length / recent.length

  return Math.round(accuracy * speedFactor * 100)
}

// ─── SPACED REPETITION (SM-2 inspired) ───────────────────────────────────────
export function nextReviewDate(masteryScore: number): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let daysUntilReview: number
  if      (masteryScore < 60)  daysUntilReview = 1
  else if (masteryScore < 75)  daysUntilReview = 3
  else if (masteryScore < 85)  daysUntilReview = 7
  else if (masteryScore < 95)  daysUntilReview = 14
  else                         daysUntilReview = 30

  const reviewDate = new Date(today)
  reviewDate.setDate(reviewDate.getDate() + daysUntilReview)
  return reviewDate
}

// ─── ADAPTIVE DIFFICULTY ─────────────────────────────────────────────────────
export function adaptDifficulty(
  currentDifficulty: number,
  recentCorrectCount: number,
  recentTotalCount: number
): number {
  if (recentTotalCount < 2) return currentDifficulty

  const recentAccuracy = recentCorrectCount / recentTotalCount

  // 3 correct in a row and fast → increase
  if (recentAccuracy >= 0.9 && recentCorrectCount >= 3) {
    return Math.min(5, currentDifficulty + 1)
  }
  // 2 wrong in a row → decrease
  if (recentAccuracy <= 0.4 && recentTotalCount >= 2) {
    return Math.max(1, currentDifficulty - 1)
  }

  return currentDifficulty
}

// ─── UPDATE SKILL MASTERY ─────────────────────────────────────────────────────
export async function updateSkillMastery(
  studentUserId: string,
  skillId: string,
  sessionAttempts: Attempt[]
): Promise<{
  masteryScore: number
  statusChanged: boolean
  newStatus: string
  skillUnlocked: string[]
}> {
  const supabase = await createClient()

  // Get existing progress + all past attempts for this skill
  const [{ data: existing }, { data: allSessions }] = await Promise.all([
    supabase
      .from('student_skill_progress')
      .select('*')
      .eq('student_id', studentUserId)
      .eq('skill_node_id', skillId)
      .single(),
    supabase
      .from('question_attempts')
      .select('is_correct, time_taken_seconds, hint_used, attempt_number, created_at')
      .eq('student_id', studentUserId)
      .order('created_at', { ascending: true }),
  ])

  // Combine historical + new attempts
  const allAttempts: Attempt[] = [
    ...((allSessions as Attempt[]) ?? []),
    ...sessionAttempts,
  ]

  const masteryScore = calculateMasteryScore(allAttempts)
  const reviewDate   = nextReviewDate(masteryScore)

  // Determine status
  const { data: skill } = await supabase
    .from('skill_nodes')
    .select('mastery_threshold')
    .eq('id', skillId)
    .single()

  const threshold = skill?.mastery_threshold ?? 80
  const prevStatus = existing?.status ?? 'available'
  let newStatus = prevStatus

  if (masteryScore >= threshold && prevStatus !== 'mastered') {
    newStatus = 'mastered'
  } else if (masteryScore > 0 && prevStatus === 'available') {
    newStatus = 'in_progress'
  } else if (masteryScore < 60 && prevStatus === 'mastered') {
    newStatus = 'needs_review'
  }

  const statusChanged = newStatus !== prevStatus

  // Upsert skill progress
  await supabase.from('student_skill_progress').upsert({
    student_id:       studentUserId,
    skill_node_id:    skillId,
    status:           newStatus,
    mastery_score:    masteryScore,
    attempts:         (existing?.attempts ?? 0) + sessionAttempts.length,
    last_practiced_at: new Date().toISOString(),
    next_review_at:   reviewDate.toISOString(),
    mastered_at:      newStatus === 'mastered' && !existing?.mastered_at
      ? new Date().toISOString()
      : existing?.mastered_at ?? null,
  }, { onConflict: 'student_id,skill_node_id' })

  // If mastered, unlock dependent skills
  const unlockedSkills: string[] = []
  if (newStatus === 'mastered') {
    unlockedSkills.push(...await unlockDependentSkills(studentUserId, skillId))
  }

  return { masteryScore, statusChanged, newStatus, skillUnlocked: unlockedSkills }
}

// ─── UNLOCK DEPENDENT SKILLS ─────────────────────────────────────────────────
async function unlockDependentSkills(studentUserId: string, masteredSkillId: string): Promise<string[]> {
  const supabase = await createClient()

  // Find skills that have masteredSkillId as a prerequisite
  const { data: dependents } = await supabase
    .from('skill_nodes')
    .select('id, prerequisite_skill_ids')
    .contains('prerequisite_skill_ids', [masteredSkillId])
    .eq('is_published', true)

  if (!dependents?.length) return []

  const unlocked: string[] = []

  for (const skill of dependents) {
    // Check if ALL prerequisites are mastered
    const prereqIds: string[] = skill.prerequisite_skill_ids ?? []

    const { data: masteredPrereqs } = await supabase
      .from('student_skill_progress')
      .select('skill_node_id')
      .eq('student_id', studentUserId)
      .eq('status', 'mastered')
      .in('skill_node_id', prereqIds)

    const allPrereqsMastered = (masteredPrereqs?.length ?? 0) === prereqIds.length

    if (allPrereqsMastered) {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('student_skill_progress')
        .select('status')
        .eq('student_id', studentUserId)
        .eq('skill_node_id', skill.id)
        .single()

      if (!existing || existing.status === 'locked') {
        await supabase.from('student_skill_progress').upsert({
          student_id:    studentUserId,
          skill_node_id: skill.id,
          status:        'available',
          unlocked_at:   new Date().toISOString(),
        }, { onConflict: 'student_id,skill_node_id' })

        unlocked.push(skill.id)
      }
    }
  }

  return unlocked
}

// ─── DAILY LESSON PLAN ───────────────────────────────────────────────────────
export async function getDailyLessonPlan(
  studentUserId: string,
  gradeLevel: number,
  limit = 4
): Promise<{ lesson_id: string; skill_id: string; reason: string; priority: number }[]> {
  const supabase = await createClient()

  // Get skills needing review (overdue)
  const now = new Date().toISOString()
  const { data: overdueSkills } = await supabase
    .from('student_skill_progress')
    .select('skill_node_id, mastery_score, next_review_at, status')
    .eq('student_id', studentUserId)
    .in('status', ['in_progress', 'mastered', 'needs_review'])
    .lt('next_review_at', now)
    .order('next_review_at', { ascending: true })
    .limit(2)

  // Get available (unlocked but not started) skills
  const { data: availableSkills } = await supabase
    .from('student_skill_progress')
    .select('skill_node_id, mastery_score')
    .eq('student_id', studentUserId)
    .in('status', ['available', 'in_progress'])
    .order('mastery_score', { ascending: true })
    .limit(3)

  const plan: { lesson_id: string; skill_id: string; reason: string; priority: number }[] = []

  // Priority 1: Overdue reviews
  for (const skill of overdueSkills ?? []) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('skill_id', skill.skill_node_id)
      .eq('is_published', true)
      .order('lesson_number', { ascending: true })
      .limit(1)
      .single()

    if (lesson) {
      plan.push({ lesson_id: lesson.id, skill_id: skill.skill_node_id, reason: 'review', priority: 1 })
    }
  }

  // Priority 2: Continue in-progress / available skills
  for (const skill of availableSkills ?? []) {
    if (plan.length >= limit) break
    if (plan.some(p => p.skill_id === skill.skill_node_id)) continue

    const { data: lesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('skill_id', skill.skill_node_id)
      .eq('is_published', true)
      .order('lesson_number', { ascending: true })
      .limit(1)
      .single()

    if (lesson) {
      plan.push({ lesson_id: lesson.id, skill_id: skill.skill_node_id, reason: 'continue', priority: 2 })
    }
  }

  // Priority 3: New grade-level lesson if plan still has room
  if (plan.length < limit) {
    const { data: newLesson } = await supabase
      .from('lessons')
      .select('id, skill_id')
      .eq('grade_level', gradeLevel)
      .eq('is_published', true)
      .not('skill_id', 'is', null)
      .limit(1)
      .single()

    if (newLesson && !plan.some(p => p.skill_id === newLesson.skill_id)) {
      plan.push({ lesson_id: newLesson.id, skill_id: newLesson.skill_id!, reason: 'new', priority: 3 })
    }
  }

  return plan.slice(0, limit)
}
