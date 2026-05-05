-- MindPath AI — Seed Data (Phase 1)
-- Run after 001_core_schema.sql

-- ============================================================
-- SUBJECTS
-- ============================================================
INSERT INTO public.subjects (id, slug, name, icon, color, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'math',       'Math',       '🔢', '#FF9800', 1),
  ('22222222-2222-2222-2222-222222222222', 'reading',    'Reading',    '📚', '#4CAF50', 2),
  ('33333333-3333-3333-3333-333333333333', 'vocabulary', 'Vocabulary', '💬', '#9C27B0', 3),
  ('44444444-4444-4444-4444-444444444444', 'writing',    'Writing',    '✏️',  '#FFC107', 4),
  ('55555555-5555-5555-5555-555555555555', 'science',    'Science',    '🔬', '#2196F3', 5);

-- ============================================================
-- SKILL NODES — Math (Grade K-2 only for Phase 1)
-- ============================================================
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  -- PreK / Kindergarten
  ('aa000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 0, 'math-prek-counting-10',    'Counting to 10',         'Count objects from 1 to 10',         '{}',                                                                   80, 1,  TRUE),
  ('aa000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 0, 'math-prek-number-recog',   'Number Recognition',     'Recognize and write numbers 1-10',   '{aa000001-0000-0000-0000-000000000001}',                                80, 2,  TRUE),
  ('aa000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 0, 'math-prek-comparing',      'Comparing Numbers',      'More, less, and equal to 10',        '{aa000001-0000-0000-0000-000000000001}',                                80, 3,  TRUE),
  -- Grade 1
  ('aa000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 1, 'math-g1-counting-20',      'Counting to 20',         'Count and write numbers to 20',      '{aa000002-0000-0000-0000-000000000002}',                                80, 4,  TRUE),
  ('aa000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 1, 'math-g1-add-to-10',        'Adding to 10',           'Basic addition facts to 10',         '{aa000004-0000-0000-0000-000000000004}',                                80, 5,  TRUE),
  ('aa000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 1, 'math-g1-sub-from-10',      'Subtracting from 10',    'Basic subtraction facts from 10',    '{aa000005-0000-0000-0000-000000000005}',                                80, 6,  TRUE),
  ('aa000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 1, 'math-g1-add-to-20',        'Adding to 20',           'Addition facts to 20',               '{aa000005-0000-0000-0000-000000000005}',                                80, 7,  TRUE),
  -- Grade 2
  ('aa000008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 2, 'math-g2-add-2digit',       '2-Digit Addition',       'Adding two-digit numbers',           '{aa000007-0000-0000-0000-000000000007}',                                80, 8,  TRUE),
  ('aa000009-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 2, 'math-g2-sub-2digit',       '2-Digit Subtraction',    'Subtracting two-digit numbers',      '{aa000006-0000-0000-0000-000000000006,aa000008-0000-0000-0000-000000000008}', 80, 9, TRUE),
  ('aa000010-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 2, 'math-g2-word-problems',    'Word Problems',          'Solve simple word problems',         '{aa000008-0000-0000-0000-000000000008,aa000009-0000-0000-0000-000000000009}', 80, 10, TRUE);

-- ============================================================
-- SKILL NODES — Reading (Grade K-2 only for Phase 1)
-- ============================================================
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  ('bb000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 0, 'read-prek-letters',        'Letter Recognition',     'Identify uppercase letters A-Z',     '{}',                                                                   80, 1,  TRUE),
  ('bb000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 0, 'read-prek-phonics-basic',  'Basic Phonics',          'Letter sounds for A, B, C...',       '{bb000001-0000-0000-0000-000000000001}',                                80, 2,  TRUE),
  ('bb000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 1, 'read-g1-sight-words-50',   'Sight Words 1-50',       'Recognize the first 50 sight words', '{bb000002-0000-0000-0000-000000000002}',                                80, 3,  TRUE),
  ('bb000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 1, 'read-g1-short-vowels',     'Short Vowels',           'Read CVC words with short vowels',   '{bb000002-0000-0000-0000-000000000002}',                                80, 4,  TRUE),
  ('bb000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 1, 'read-g1-fluency',          'Reading Fluency',        'Read simple sentences smoothly',     '{bb000003-0000-0000-0000-000000000003,bb000004-0000-0000-0000-000000000004}', 80, 5, TRUE),
  ('bb000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 2, 'read-g2-comprehension',    'Reading Comprehension',  'Answer questions about a text',      '{bb000005-0000-0000-0000-000000000005}',                                80, 6,  TRUE);

-- ============================================================
-- BADGES (Phase 1 core set)
-- ============================================================
INSERT INTO public.badges (slug, name, description, icon_url, category, criteria, xp_bonus, rarity) VALUES
  -- Streak badges
  ('streak-3',       '3-Day Streak',      'Learned 3 days in a row!',   '/badges/streak-3.svg',    'streak',  '{"type":"streak_days","threshold":3}',   15,  'common'),
  ('streak-7',       '1 Week Strong',     'A full week of learning!',   '/badges/streak-7.svg',    'streak',  '{"type":"streak_days","threshold":7}',   50,  'common'),
  ('streak-14',      '2 Weeks Champion',  '14 days — you are unstoppable!', '/badges/streak-14.svg', 'streak', '{"type":"streak_days","threshold":14}', 100, 'rare'),
  ('streak-30',      '30-Day Legend',     'A month of daily learning!', '/badges/streak-30.svg',   'streak',  '{"type":"streak_days","threshold":30}',  250, 'epic'),
  -- Mastery badges
  ('first-lesson',   'First Step',        'Completed your first lesson!', '/badges/first-lesson.svg', 'mastery', '{"type":"lessons_completed","threshold":1}', 10, 'common'),
  ('lessons-10',     'Getting Started',   '10 lessons completed!',      '/badges/lessons-10.svg',  'mastery', '{"type":"lessons_completed","threshold":10}',  30, 'common'),
  ('lessons-50',     'Dedicated Learner', '50 lessons — impressive!',   '/badges/lessons-50.svg',  'mastery', '{"type":"lessons_completed","threshold":50}', 100, 'rare'),
  ('math-master',    'Math Master',       'Mastered a Math skill!',     '/badges/math-master.svg', 'mastery', '{"type":"mastery_score","threshold":80,"subject":"math"}', 75, 'rare'),
  ('read-master',    'Reading Star',      'Mastered a Reading skill!',  '/badges/read-master.svg', 'mastery', '{"type":"mastery_score","threshold":80,"subject":"reading"}', 75, 'rare'),
  -- Effort badges
  ('placement-done', 'Level Discovered',  'Completed placement test!',  '/badges/placement.svg',   'effort',  '{"type":"manual"}', 25, 'common'),
  ('perfect-score',  'Perfect!',          'Got 100% on a lesson!',      '/badges/perfect.svg',     'speed',   '{"type":"perfect_score"}', 30, 'rare'),
  -- Special
  ('early-bird',     'Early Bird',        'Learned before 8am!',        '/badges/early-bird.svg',  'effort',  '{"type":"manual"}', 20, 'common'),
  ('comeback',       'Comeback Kid',      'Returned after 3+ days away!','/badges/comeback.svg',   'effort',  '{"type":"manual"}', 25, 'common');

-- ============================================================
-- SAMPLE LESSONS — Math Grade 1 "Adding to 10"
-- ============================================================
INSERT INTO public.lessons (skill_id, subject_id, grade_level, lesson_number, title, lesson_type, content, estimated_minutes, xp_reward, difficulty_level, is_published) VALUES
(
  'aa000005-0000-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  1, 1,
  'Adding Small Numbers',
  'practice',
  '{
    "intro": {
      "text": "Let''s practice adding! When we add, we put numbers together to make a bigger number. 🌟",
      "image_url": null
    },
    "questions": [
      {
        "id": "q1",
        "question_type": "multiple_choice",
        "content": {
          "text": "What is 2 + 3?",
          "options": [
            {"id": "a", "text": "4"},
            {"id": "b", "text": "5"},
            {"id": "c", "text": "6"},
            {"id": "d", "text": "3"}
          ],
          "correct_answer": "b"
        },
        "difficulty": 1,
        "hint": "Try counting up from 2: 3, 4, 5!",
        "explanation": "2 + 3 = 5. Start at 2 and count up 3 more: 3, 4, 5!"
      },
      {
        "id": "q2",
        "question_type": "fill_blank",
        "content": {
          "text": "1 + 4 = ___",
          "fill_blank_template": "1 + 4 = ___",
          "correct_answer": "5"
        },
        "difficulty": 1,
        "hint": "Start at 1 and count up 4 more.",
        "explanation": "1 + 4 = 5. Start at 1 and count: 2, 3, 4, 5!"
      },
      {
        "id": "q3",
        "question_type": "multiple_choice",
        "content": {
          "text": "There are 3 apples 🍎🍎🍎 and 4 oranges 🍊🍊🍊🍊. How many fruits in total?",
          "options": [
            {"id": "a", "text": "6"},
            {"id": "b", "text": "8"},
            {"id": "c", "text": "7"},
            {"id": "d", "text": "5"}
          ],
          "correct_answer": "c"
        },
        "difficulty": 2,
        "hint": "Count all the fruits: 3 apples + 4 oranges.",
        "explanation": "3 + 4 = 7. Count them all: 1, 2, 3 (apples), 4, 5, 6, 7 (oranges)!"
      },
      {
        "id": "q4",
        "question_type": "multiple_choice",
        "content": {
          "text": "What is 5 + 5?",
          "options": [
            {"id": "a", "text": "9"},
            {"id": "b", "text": "11"},
            {"id": "c", "text": "10"},
            {"id": "d", "text": "8"}
          ],
          "correct_answer": "c"
        },
        "difficulty": 1,
        "hint": "5 + 5 is a doubles fact!",
        "explanation": "5 + 5 = 10. When you add the same number twice, it''s called a double!"
      },
      {
        "id": "q5",
        "question_type": "fill_blank",
        "content": {
          "text": "6 + ___ = 10",
          "fill_blank_template": "6 + ___ = 10",
          "correct_answer": "4"
        },
        "difficulty": 3,
        "hint": "How many more do you need to get from 6 to 10?",
        "explanation": "6 + 4 = 10. Count up from 6: 7, 8, 9, 10 — that''s 4 more!"
      }
    ],
    "summary": "Great work adding numbers! Remember: addition means putting numbers together. 🌟"
  }',
  10, 15, 1, TRUE
),
-- Lesson 2: More adding practice
(
  'aa000005-0000-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  1, 2,
  'Addition Stories',
  'practice',
  '{
    "intro": {
      "text": "Addition happens everywhere! Let''s find addition in stories. 📖"
    },
    "questions": [
      {
        "id": "q1",
        "question_type": "multiple_choice",
        "content": {
          "text": "Mia has 2 cats 🐱🐱. She gets 1 more cat 🐱. How many cats does Mia have now?",
          "options": [
            {"id": "a", "text": "2"},
            {"id": "b", "text": "4"},
            {"id": "c", "text": "3"},
            {"id": "d", "text": "1"}
          ],
          "correct_answer": "c"
        },
        "difficulty": 1,
        "hint": "Count all of Mia''s cats together.",
        "explanation": "2 + 1 = 3. Mia had 2 cats and got 1 more, so now she has 3!"
      },
      {
        "id": "q2",
        "question_type": "multiple_choice",
        "content": {
          "text": "Tom scored 4 goals ⚽ in the morning and 3 goals ⚽ in the afternoon. How many goals total?",
          "options": [
            {"id": "a", "text": "6"},
            {"id": "b", "text": "7"},
            {"id": "c", "text": "8"},
            {"id": "d", "text": "5"}
          ],
          "correct_answer": "b"
        },
        "difficulty": 2,
        "hint": "Add the morning goals and afternoon goals.",
        "explanation": "4 + 3 = 7. Tom scored 4 in the morning and 3 more in the afternoon!"
      }
    ],
    "summary": "You are great at addition stories! Keep going! 🚀"
  }',
  8, 15, 1, TRUE
);

-- ============================================================
-- SAMPLE LESSONS — Reading Grade 1 "Sight Words"
-- ============================================================
INSERT INTO public.lessons (skill_id, subject_id, grade_level, lesson_number, title, lesson_type, content, estimated_minutes, xp_reward, difficulty_level, is_published) VALUES
(
  'bb000003-0000-0000-0000-000000000003',
  '22222222-2222-2222-2222-222222222222',
  1, 1,
  'First Sight Words',
  'practice',
  '{
    "intro": {
      "text": "Sight words are special words we recognize right away! Let''s learn them. 👁️"
    },
    "questions": [
      {
        "id": "q1",
        "question_type": "multiple_choice",
        "content": {
          "text": "Which word is ''the''?",
          "options": [
            {"id": "a", "text": "teh"},
            {"id": "b", "text": "the"},
            {"id": "c", "text": "hte"},
            {"id": "d", "text": "eth"}
          ],
          "correct_answer": "b"
        },
        "difficulty": 1,
        "hint": "It starts with t-h.",
        "explanation": "''The'' is spelled t-h-e. It''s one of the most common words in English!"
      },
      {
        "id": "q2",
        "question_type": "multiple_choice",
        "content": {
          "text": "Which word is ''and''?",
          "options": [
            {"id": "a", "text": "nad"},
            {"id": "b", "text": "dan"},
            {"id": "c", "text": "and"},
            {"id": "d", "text": "adn"}
          ],
          "correct_answer": "c"
        },
        "difficulty": 1,
        "hint": "It starts with the letter a.",
        "explanation": "''And'' connects two things together, like ''cats and dogs''!"
      },
      {
        "id": "q3",
        "question_type": "fill_blank",
        "content": {
          "text": "The cat sat ___ the mat. (and / on / is)",
          "fill_blank_template": "The cat sat ___ the mat.",
          "word_bank": ["and", "on", "is"],
          "correct_answer": "on"
        },
        "difficulty": 2,
        "hint": "Where is the cat? On top of the mat!",
        "explanation": "''On'' tells us where the cat is — sitting ON the mat!"
      }
    ],
    "summary": "Amazing! You are learning sight words so fast! 🌟"
  }',
  8, 15, 1, TRUE
);

-- ============================================================
-- PLACEMENT TEST LESSONS
-- ============================================================
INSERT INTO public.lessons (subject_id, grade_level, lesson_number, title, lesson_type, content, estimated_minutes, xp_reward, difficulty_level, is_published) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  0, 1,
  'Math Placement Test',
  'placement',
  '{
    "intro": {
      "text": "Let''s discover your math superpower! Answer these questions and we''ll find the perfect starting point just for you. 🚀"
    },
    "questions": [
      {"id": "p1", "question_type": "multiple_choice", "content": {"text": "How many stars? ⭐⭐⭐", "options": [{"id":"a","text":"2"},{"id":"b","text":"3"},{"id":"c","text":"4"},{"id":"d","text":"1"}], "correct_answer": "b"}, "difficulty": 1, "hint": "Count the stars!", "explanation": "There are 3 stars!"},
      {"id": "p2", "question_type": "multiple_choice", "content": {"text": "What is 2 + 2?", "options": [{"id":"a","text":"3"},{"id":"b","text":"5"},{"id":"c","text":"4"},{"id":"d","text":"2"}], "correct_answer": "c"}, "difficulty": 1, "hint": "Count up from 2.", "explanation": "2 + 2 = 4!"},
      {"id": "p3", "question_type": "multiple_choice", "content": {"text": "What is 5 + 3?", "options": [{"id":"a","text":"7"},{"id":"b","text":"9"},{"id":"c","text":"6"},{"id":"d","text":"8"}], "correct_answer": "d"}, "difficulty": 2, "hint": "Count up from 5.", "explanation": "5 + 3 = 8!"},
      {"id": "p4", "question_type": "fill_blank", "content": {"text": "10 + 5 = ___", "fill_blank_template": "10 + 5 = ___", "correct_answer": "15"}, "difficulty": 3, "hint": "Start at 10 and count up 5.", "explanation": "10 + 5 = 15!"},
      {"id": "p5", "question_type": "multiple_choice", "content": {"text": "What is 24 + 13?", "options": [{"id":"a","text":"36"},{"id":"b","text":"37"},{"id":"c","text":"38"},{"id":"d","text":"35"}], "correct_answer": "b"}, "difficulty": 4, "hint": "Add the tens first, then the ones.", "explanation": "24 + 13 = 37. 20+10=30, then 4+3=7, so 37!"}
    ],
    "summary": "Placement complete! We''ve found your perfect starting level. 🎯"
  }',
  10, 25, 1, TRUE
);
