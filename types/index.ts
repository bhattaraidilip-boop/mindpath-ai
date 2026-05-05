// types/index.ts
// MindPath AI — Core Type Definitions

// ─── USER ROLES ──────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'parent' | 'teacher' | 'admin' | 'super_admin'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  last_seen_at: string | null
  created_at: string
}

// ─── STUDENT ─────────────────────────────────────────────────────────────────
export interface StudentProfile {
  id: string
  user_id: string
  parent_id: string
  display_name: string
  date_of_birth: string | null
  grade_level: number           // 0=PreK, 1-12
  avatar_config: AvatarConfig
  xp_total: number
  xp_level: number
  current_streak: number
  longest_streak: number
  last_active_date: string | null
  streak_freeze_available: number
  placement_completed: boolean
  created_at: string
}

export interface AvatarConfig {
  base: string         // avatar body type
  color: string        // skin/primary color
  accessory: string | null
  background: string
  unlocked_items: string[]
}

// ─── SUBJECTS ────────────────────────────────────────────────────────────────
export type SubjectSlug = 'math' | 'reading' | 'vocabulary' | 'writing' | 'science'

export interface Subject {
  id: string
  slug: SubjectSlug
  name: string
  icon: string
  color: string
  description: string
}

// ─── SKILL TREE ──────────────────────────────────────────────────────────────
export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'mastered' | 'needs_review'

export interface SkillNode {
  id: string
  subject_id: string
  grade_level: number
  slug: string
  name: string
  description: string
  prerequisite_skill_ids: string[]
  mastery_threshold: number      // 0-100, default 80
  review_interval_days: number
  difficulty_min: number
  difficulty_max: number
  lesson_ids: string[]
  sort_order: number
}

export interface StudentSkillProgress {
  id: string
  student_id: string
  skill_node_id: string
  status: SkillStatus
  mastery_score: number
  attempts: number
  last_practiced_at: string | null
  next_review_at: string | null
  unlocked_at: string | null
  mastered_at: string | null
  // Joined
  skill?: SkillNode
}

// ─── LESSONS ─────────────────────────────────────────────────────────────────
export type LessonType = 'instruction' | 'practice' | 'quiz' | 'review' | 'placement'
export type QuestionType = 'multiple_choice' | 'fill_blank' | 'drag_drop' | 'voice' | 'matching' | 'true_false'

export interface Lesson {
  id: string
  unit_id: string | null
  skill_id: string | null
  lesson_number: number
  title: string
  lesson_type: LessonType
  content: LessonContent
  estimated_minutes: number
  xp_reward: number
  difficulty_level: number
  grade_level: number
  subject_id: string
  is_published: boolean
  ai_generated: boolean
}

export interface LessonContent {
  intro?: {
    text: string
    image_url?: string
    audio_url?: string
  }
  questions: Question[]
  summary?: string
}

export interface Question {
  id: string
  lesson_id: string
  question_type: QuestionType
  content: QuestionContent
  difficulty: number
  hint: string | null
  explanation: string | null
  tags: string[]
}

export interface QuestionContent {
  text: string
  image_url?: string
  audio_url?: string
  options?: QuestionOption[]        // multiple_choice, matching
  correct_answer: string | string[]
  fill_blank_template?: string       // "The cat ___ on the mat"
  word_bank?: string[]               // for fill_blank
}

export interface QuestionOption {
  id: string
  text: string
  image_url?: string
  is_correct?: boolean               // server-only, stripped before sending to client
}

// ─── LEARNING SESSION ────────────────────────────────────────────────────────
export interface LearningSession {
  id: string
  student_id: string
  lesson_id: string
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  score: number | null
  xp_earned: number
  questions_attempted: number
  questions_correct: number
  mood_before: MoodScore | null
  completed: boolean
}

export type MoodScore = 1 | 2 | 3 | 4 | 5

export const MOOD_EMOJIS: Record<MoodScore, { emoji: string; label: string }> = {
  1: { emoji: '😴', label: 'Tired' },
  2: { emoji: '😕', label: 'Meh' },
  3: { emoji: '😊', label: 'Good' },
  4: { emoji: '😄', label: 'Great' },
  5: { emoji: '🚀', label: 'Amazing' },
}

export interface QuestionAttempt {
  id: string
  session_id: string
  student_id: string
  question_id: string
  answer: unknown
  is_correct: boolean
  time_taken_seconds: number
  hint_used: boolean
  ai_help_used: boolean
  attempt_number: number
  created_at: string
}

// ─── GAMIFICATION ────────────────────────────────────────────────────────────
export type BadgeCategory = 'streak' | 'mastery' | 'speed' | 'effort' | 'special' | 'seasonal'
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  id: string
  slug: string
  name: string
  description: string
  icon_url: string
  category: BadgeCategory
  criteria: BadgeCriteria
  xp_bonus: number
  rarity: BadgeRarity
}

export interface BadgeCriteria {
  type: 'streak_days' | 'mastery_score' | 'lessons_completed' | 'perfect_score' | 'manual'
  threshold?: number
  subject?: SubjectSlug
}

export interface StudentBadge {
  id: string
  student_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface XPTransaction {
  id: string
  student_id: string
  amount: number
  reason: XPReason
  reference_id: string | null
  created_at: string
}

export type XPReason =
  | 'lesson_complete'
  | 'perfect_score'
  | 'streak_bonus'
  | 'badge_earned'
  | 'daily_mission'
  | 'placement_complete'
  | 'comeback_bonus'

export interface DailyMission {
  id: string
  student_id: string
  date: string
  missions: Mission[]
  completed_missions: string[]
  bonus_xp: number
  is_complete: boolean
}

export interface Mission {
  id: string
  type: 'lessons' | 'questions' | 'subject' | 'streak'
  description: string
  target: number
  progress: number
  xp_reward: number
  emoji: string
}

// ─── SUBSCRIPTION ────────────────────────────────────────────────────────────
export type PlanId = 'free' | 'starter' | 'family' | 'premium' | 'school'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

export interface Plan {
  id: PlanId
  name: string
  price_monthly: number
  price_annual: number
  max_children: number
  features: string[]
  stripe_price_id_monthly: string
  stripe_price_id_annual: string
  is_popular?: boolean
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_id: PlanId
  status: SubscriptionStatus
  current_period_end: string
  cancel_at_period_end: boolean
  max_children: number
}

// ─── PARENT DASHBOARD ────────────────────────────────────────────────────────
export interface ChildProgressSummary {
  student: StudentProfile
  today: {
    lessons_completed: number
    xp_earned: number
    time_spent_minutes: number
    streak_maintained: boolean
  }
  week: {
    wald: number               // Weekly Active Learning Days
    avg_score: number
    lessons_completed: number
    xp_earned: number
  }
  subjects: SubjectProgress[]
  recent_badges: StudentBadge[]
  streak: number
}

export interface SubjectProgress {
  subject: Subject
  mastery_score: number
  lessons_completed: number
  last_practiced: string | null
}

// ─── AI ──────────────────────────────────────────────────────────────────────
export type AgeGroup = 'ages_4_6' | 'ages_7_10' | 'ages_11_14' | 'ages_15_18'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AIConversation {
  id: string
  student_id: string
  session_id: string | null
  question_id: string | null
  messages: AIMessage[]
  resolved: boolean
}

// ─── ANALYTICS EVENTS ────────────────────────────────────────────────────────
export type AnalyticsEventType =
  | 'lesson_started'
  | 'lesson_completed'
  | 'lesson_abandoned'
  | 'answer_submitted'
  | 'hint_used'
  | 'ai_help_requested'
  | 'badge_earned'
  | 'xp_earned'
  | 'level_up'
  | 'streak_maintained'
  | 'streak_broken'
  | 'streak_freeze_used'
  | 'daily_mission_completed'
  | 'placement_completed'
  | 'session_end'

export interface AnalyticsEvent {
  student_id: string
  event_type: AnalyticsEventType
  properties: Record<string, unknown>
  session_id?: string
  device_type?: string
}

// ─── API RESPONSES ───────────────────────────────────────────────────────────
export interface APIResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// ─── UTIL TYPES ──────────────────────────────────────────────────────────────
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
