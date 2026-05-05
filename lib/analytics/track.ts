// lib/analytics/track.ts
// MindPath AI — Lightweight Event Tracking (Phase 1)
// Client-side tracker with server-side flush

import { createClient } from '@/lib/supabase/client'
import type { AnalyticsEvent, AnalyticsEventType } from '@/types'

// ─── CLIENT-SIDE TRACKER ─────────────────────────────────────────────────────
class Analytics {
  private queue: AnalyticsEvent[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private sessionId: string | null = null

  setSession(sessionId: string) {
    this.sessionId = sessionId
  }

  track(
    eventType: AnalyticsEventType,
    properties: Record<string, unknown> = {},
    studentId?: string
  ) {
    const event: AnalyticsEvent = {
      student_id:  studentId ?? '',
      event_type:  eventType,
      properties:  {
        ...properties,
        url:         typeof window !== 'undefined' ? window.location.pathname : '',
        timestamp:   new Date().toISOString(),
      },
      session_id:  this.sessionId ?? undefined,
      device_type: this.getDeviceType(),
    }

    this.queue.push(event)

    // Debounce flush — batch events every 2 seconds
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => this.flush(), 2000)
  }

  private async flush() {
    if (!this.queue.length) return

    const events = [...this.queue]
    this.queue = []

    try {
      const supabase = createClient()
      await supabase.from('analytics_events').insert(
        events.map(e => ({
          student_id:  e.student_id || null,
          event_type:  e.event_type,
          properties:  e.properties,
          session_id:  e.session_id ?? null,
          device_type: e.device_type ?? null,
        }))
      )
    } catch (error) {
      // Silent fail — analytics should never break the app
      console.debug('Analytics flush error:', error)
      // Re-queue failed events (max 1 retry)
      this.queue.unshift(...events.slice(0, 10))
    }
  }

  // Flush on page unload
  flushSync() {
    if (!this.queue.length) return
    const events = [...this.queue]
    this.queue = []

    // Use sendBeacon for reliability on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/beacon', JSON.stringify(events))
    }
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'server'
    const ua = navigator.userAgent
    if (/tablet|ipad/i.test(ua)) return 'tablet'
    if (/mobile|android|iphone/i.test(ua)) return 'mobile'
    return 'desktop'
  }
}

// Singleton instance
export const analytics = new Analytics()

// ─── CONVENIENCE HELPERS ─────────────────────────────────────────────────────
export function trackLessonStarted(studentId: string, lessonId: string, subjectSlug: string) {
  analytics.track('lesson_started', { lesson_id: lessonId, subject: subjectSlug }, studentId)
}

export function trackLessonCompleted(
  studentId: string,
  lessonId: string,
  score: number,
  durationSeconds: number,
  xpEarned: number
) {
  analytics.track('lesson_completed', {
    lesson_id:        lessonId,
    score,
    duration_seconds: durationSeconds,
    xp_earned:        xpEarned,
  }, studentId)
}

export function trackAnswerSubmitted(
  studentId: string,
  questionId: string,
  isCorrect: boolean,
  timeTaken: number,
  hintUsed: boolean
) {
  analytics.track('answer_submitted', {
    question_id: questionId,
    is_correct:  isCorrect,
    time_taken:  timeTaken,
    hint_used:   hintUsed,
  }, studentId)
}

export function trackSessionEnd(
  studentId: string,
  sessionId: string,
  totalSeconds: number,
  completed: boolean
) {
  analytics.track('session_end', {
    session_id:    sessionId,
    duration:      totalSeconds,
    completed,
  }, studentId)
  analytics.flushSync()
}

export function trackBadgeEarned(studentId: string, badgeSlug: string, rarity: string) {
  analytics.track('badge_earned', { badge_slug: badgeSlug, rarity }, studentId)
}

export function trackStreakEvent(
  studentId: string,
  type: 'streak_maintained' | 'streak_broken' | 'streak_freeze_used',
  streakCount: number
) {
  analytics.track(type, { streak_count: streakCount }, studentId)
}
