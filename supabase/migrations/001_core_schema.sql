-- MindPath AI — Phase 1 Core Schema
-- Supabase PostgreSQL
-- Only essential tables. Everything else is stubbed via comments.

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for text search

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS (mirrors Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'parent'
               CHECK (role IN ('student', 'parent', 'teacher', 'admin', 'super_admin')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user row on Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STUDENT PROFILES
-- ============================================================
CREATE TABLE public.student_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  display_name             TEXT NOT NULL,
  date_of_birth            DATE,
  grade_level              INTEGER NOT NULL DEFAULT 0
                           CHECK (grade_level BETWEEN 0 AND 12),
  avatar_config            JSONB DEFAULT '{"base":"bear","color":"#FFB347","accessory":null,"background":"#E8F4FD","unlocked_items":[]}',
  xp_total                 INTEGER NOT NULL DEFAULT 0,
  xp_level                 INTEGER NOT NULL DEFAULT 1,
  current_streak           INTEGER NOT NULL DEFAULT 0,
  longest_streak           INTEGER NOT NULL DEFAULT 0,
  last_active_date         DATE,
  streak_freeze_available  INTEGER NOT NULL DEFAULT 0,
  placement_completed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER student_profiles_updated_at BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PARENT-CHILD RELATIONSHIPS
-- ============================================================
CREATE TABLE public.parent_children (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  screen_time_limit_min    INTEGER,
  notifications_enabled    BOOLEAN DEFAULT TRUE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id       TEXT UNIQUE,
  stripe_subscription_id   TEXT UNIQUE,
  plan_id                  TEXT NOT NULL DEFAULT 'free'
                           CHECK (plan_id IN ('free', 'starter', 'family', 'premium', 'school')),
  status                   TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused')),
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN DEFAULT FALSE,
  max_children             INTEGER NOT NULL DEFAULT 1,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create free subscription on user creation
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'parent' THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- ============================================================
-- SUBJECTS (seeded, not dynamic in Phase 1)
-- ============================================================
CREATE TABLE public.subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  color      TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- SKILL NODES (lightweight Phase 1 — full tree Phase 2)
-- ============================================================
CREATE TABLE public.skill_nodes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id              UUID NOT NULL REFERENCES public.subjects(id),
  grade_level             INTEGER NOT NULL CHECK (grade_level BETWEEN 0 AND 12),
  slug                    TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  description             TEXT,
  prerequisite_skill_ids  UUID[] DEFAULT '{}',
  mastery_threshold       INTEGER NOT NULL DEFAULT 80,
  review_interval_days    INTEGER NOT NULL DEFAULT 7,
  sort_order              INTEGER DEFAULT 0,
  is_published            BOOLEAN DEFAULT FALSE
);

-- Student skill progress
CREATE TABLE public.student_skill_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_node_id     UUID NOT NULL REFERENCES public.skill_nodes(id),
  status            TEXT NOT NULL DEFAULT 'locked'
                    CHECK (status IN ('locked', 'available', 'in_progress', 'mastered', 'needs_review')),
  mastery_score     NUMERIC NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  attempts          INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  next_review_at    TIMESTAMPTZ,
  unlocked_at       TIMESTAMPTZ,
  mastered_at       TIMESTAMPTZ,
  UNIQUE(student_id, skill_node_id)
);

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE public.lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id         UUID REFERENCES public.skill_nodes(id),
  subject_id       UUID NOT NULL REFERENCES public.subjects(id),
  grade_level      INTEGER NOT NULL,
  lesson_number    INTEGER NOT NULL,
  title            TEXT NOT NULL,
  lesson_type      TEXT NOT NULL DEFAULT 'practice'
                   CHECK (lesson_type IN ('instruction', 'practice', 'quiz', 'review', 'placement')),
  content          JSONB NOT NULL DEFAULT '{"questions":[]}',
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  xp_reward        INTEGER NOT NULL DEFAULT 10,
  difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  ai_generated     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- LEARNING SESSIONS
-- ============================================================
CREATE TABLE public.learning_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id           UUID NOT NULL REFERENCES public.lessons(id),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  duration_seconds    INTEGER,
  score               NUMERIC CHECK (score BETWEEN 0 AND 100),
  xp_earned           INTEGER NOT NULL DEFAULT 0,
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct   INTEGER NOT NULL DEFAULT 0,
  mood_before         INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  completed           BOOLEAN NOT NULL DEFAULT FALSE
);

-- Question-level attempts
CREATE TABLE public.question_attempts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES public.learning_sessions(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id         TEXT NOT NULL,   -- JSON question ID from lesson content
  answer              JSONB,
  is_correct          BOOLEAN NOT NULL,
  time_taken_seconds  INTEGER,
  hint_used           BOOLEAN NOT NULL DEFAULT FALSE,
  ai_help_used        BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_number      INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GAMIFICATION
-- ============================================================
CREATE TABLE public.badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url    TEXT NOT NULL,
  category    TEXT NOT NULL
              CHECK (category IN ('streak', 'mastery', 'speed', 'effort', 'special', 'seasonal')),
  criteria    JSONB NOT NULL DEFAULT '{}',
  xp_bonus    INTEGER NOT NULL DEFAULT 0,
  rarity      TEXT NOT NULL DEFAULT 'common'
              CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.student_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES public.badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID REFERENCES public.learning_sessions(id),
  UNIQUE(student_id, badge_id)
);

CREATE TABLE public.xp_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_missions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  missions            JSONB NOT NULL DEFAULT '[]',
  completed_missions  JSONB NOT NULL DEFAULT '[]',
  bonus_xp            INTEGER NOT NULL DEFAULT 0,
  is_complete         BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(student_id, date)
);

-- ============================================================
-- AI CONVERSATIONS (stub in Phase 1 — minimal storage)
-- ============================================================
CREATE TABLE public.ai_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES public.learning_sessions(id),
  messages     JSONB NOT NULL DEFAULT '[]',
  resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS EVENTS (minimal Phase 1)
-- ============================================================
CREATE TABLE public.analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  properties  JSONB DEFAULT '{}',
  session_id  UUID REFERENCES public.learning_sessions(id),
  device_type TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Partition hint for future scaling:
-- CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB DEFAULT '{}',
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_student_profiles_parent    ON public.student_profiles(parent_id);
CREATE INDEX idx_parent_children_parent     ON public.parent_children(parent_id);
CREATE INDEX idx_parent_children_child      ON public.parent_children(child_id);
CREATE INDEX idx_learning_sessions_student  ON public.learning_sessions(student_id, started_at DESC);
CREATE INDEX idx_learning_sessions_lesson   ON public.learning_sessions(lesson_id);
CREATE INDEX idx_question_attempts_session  ON public.question_attempts(session_id);
CREATE INDEX idx_question_attempts_student  ON public.question_attempts(student_id, created_at DESC);
CREATE INDEX idx_xp_transactions_student    ON public.xp_transactions(student_id, created_at DESC);
CREATE INDEX idx_student_badges_student     ON public.student_badges(student_id);
CREATE INDEX idx_skill_progress_student     ON public.student_skill_progress(student_id);
CREATE INDEX idx_analytics_student         ON public.analytics_events(student_id, created_at DESC);
CREATE INDEX idx_notifications_user        ON public.notifications(user_id, read_at, created_at DESC);
CREATE INDEX idx_lessons_subject_grade     ON public.lessons(subject_id, grade_level, is_published);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events       ENABLE ROW LEVEL SECURITY;

-- Users: see own row only (admins bypass via service role)
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (id = auth.uid());

-- Student profiles: student sees own, parent sees children
CREATE POLICY "student_own_profile" ON public.student_profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "parent_sees_children_profiles" ON public.student_profiles
  FOR SELECT USING (
    parent_id = auth.uid() OR
    user_id IN (SELECT child_id FROM public.parent_children WHERE parent_id = auth.uid())
  );

-- Parent children: parent manages own
CREATE POLICY "parent_children_own" ON public.parent_children
  FOR ALL USING (parent_id = auth.uid());

-- Subscriptions: own only
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Learning sessions: student sees own, parent sees children's
CREATE POLICY "sessions_student" ON public.learning_sessions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "sessions_parent" ON public.learning_sessions
  FOR SELECT USING (
    student_id IN (SELECT child_id FROM public.parent_children WHERE parent_id = auth.uid())
  );

-- Question attempts: student sees own
CREATE POLICY "attempts_student" ON public.question_attempts
  FOR ALL USING (student_id = auth.uid());

-- XP, badges, skill progress: student sees own, parent sees children's
CREATE POLICY "xp_student" ON public.xp_transactions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "badges_student" ON public.student_badges
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "skill_progress_student" ON public.student_skill_progress
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "skill_progress_parent" ON public.student_skill_progress
  FOR SELECT USING (
    student_id IN (SELECT child_id FROM public.parent_children WHERE parent_id = auth.uid())
  );

-- Missions: student sees own
CREATE POLICY "missions_student" ON public.daily_missions
  FOR ALL USING (student_id = auth.uid());

-- AI: student sees own
CREATE POLICY "ai_student" ON public.ai_conversations
  FOR ALL USING (student_id = auth.uid());

-- Notifications: own only
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Analytics: student inserts own (reads via service role for admin)
CREATE POLICY "analytics_student_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "analytics_student_select" ON public.analytics_events
  FOR SELECT USING (student_id = auth.uid());

-- Public read: subjects, skill_nodes, lessons, badges
ALTER TABLE public.subjects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_public"    ON public.subjects    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "skills_public"      ON public.skill_nodes FOR SELECT USING (is_published = TRUE);
CREATE POLICY "lessons_published"  ON public.lessons     FOR SELECT USING (is_published = TRUE);
CREATE POLICY "badges_public"      ON public.badges      FOR SELECT USING (is_active = TRUE);
