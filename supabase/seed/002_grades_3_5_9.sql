-- MindPath AI — Grades 3, 5, 9 Seed Data
-- Run after 001_seed.sql
-- Optimized for Dilli's kids

-- ============================================================
-- SKILL NODES — GRADE 3 MATH
-- ============================================================
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  ('cc000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 3, 'math-g3-multiplication-basic', 'Times Tables 1–5',       'Multiply by 1 through 5',         '{}',                                                                   80, 1, TRUE),
  ('cc000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 3, 'math-g3-multiplication-adv',   'Times Tables 6–12',      'Multiply by 6 through 12',        '{cc000001-0000-0000-0000-000000000001}',                                80, 2, TRUE),
  ('cc000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 3, 'math-g3-division-basic',       'Basic Division',         'Divide using times tables',       '{cc000001-0000-0000-0000-000000000001}',                                80, 3, TRUE),
  ('cc000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 3, 'math-g3-fractions-intro',      'Intro to Fractions',     'Halves, thirds, quarters',        '{cc000003-0000-0000-0000-000000000003}',                                80, 4, TRUE),
  ('cc000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 3, 'math-g3-word-problems',        '3rd Grade Word Problems','Multi-step word problems',        '{cc000002-0000-0000-0000-000000000002,cc000003-0000-0000-0000-000000000003}', 80, 5, TRUE);

-- SKILL NODES — GRADE 3 READING
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  ('dd000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 3, 'read-g3-comprehension',        'Reading Comprehension',  'Understand and analyze passages',  '{}',                                                                  80, 1, TRUE),
  ('dd000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 3, 'read-g3-vocabulary',           'Vocabulary in Context',  'Determine word meaning from text', '{dd000001-0000-0000-0000-000000000001}',                               80, 2, TRUE),
  ('dd000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 3, 'read-g3-main-idea',            'Main Idea & Details',    'Identify main idea and support',   '{dd000001-0000-0000-0000-000000000001}',                               80, 3, TRUE);

-- ============================================================
-- SKILL NODES — GRADE 5 MATH
-- ============================================================
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  ('ee000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 5, 'math-g5-fractions-ops',        'Fraction Operations',    'Add, subtract, multiply fractions','{}',                                                                   80, 1, TRUE),
  ('ee000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 5, 'math-g5-decimals',             'Decimals',               'Add, subtract, multiply decimals', '{ee000001-0000-0000-0000-000000000001}',                                80, 2, TRUE),
  ('ee000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 5, 'math-g5-percentages',          'Percentages',            'Convert and calculate percentages','{ee000002-0000-0000-0000-000000000002}',                                80, 3, TRUE),
  ('ee000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 5, 'math-g5-geometry',             'Basic Geometry',         'Area, perimeter, volume',          '{ee000002-0000-0000-0000-000000000002}',                                80, 4, TRUE),
  ('ee000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 5, 'math-g5-word-problems',        '5th Grade Word Problems','Multi-step real-world problems',   '{ee000003-0000-0000-0000-000000000003,ee000004-0000-0000-0000-000000000004}', 80, 5, TRUE);

-- SKILL NODES — GRADE 5 READING
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  ('ff000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 5, 'read-g5-inference',            'Making Inferences',      'Draw conclusions from text',       '{}',                                                                  80, 1, TRUE),
  ('ff000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 5, 'read-g5-text-structure',       'Text Structure',         'Identify how a text is organized', '{ff000001-0000-0000-0000-000000000001}',                               80, 2, TRUE),
  ('ff000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 5, 'read-g5-authors-purpose',      "Author''s Purpose",      'Identify why the author wrote this','{ff000001-0000-0000-0000-000000000001}',                              80, 3, TRUE);

-- ============================================================
-- SKILL NODES — GRADE 9 MATH (Algebra 1 / Geometry)
-- ============================================================
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  ('gg000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 9, 'math-g9-algebra-linear',       'Linear Equations',       'Solve equations with one variable','{}',                                                                   80, 1, TRUE),
  ('gg000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 9, 'math-g9-algebra-systems',      'Systems of Equations',   'Solve two equations simultaneously','{gg000001-0000-0000-0000-000000000001}',                               80, 2, TRUE),
  ('gg000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 9, 'math-g9-algebra-inequalities', 'Inequalities',           'Solve and graph inequalities',     '{gg000001-0000-0000-0000-000000000001}',                                80, 3, TRUE),
  ('gg000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 9, 'math-g9-geometry-proofs',      'Geometry Basics',        'Lines, angles, triangles, proofs', '{gg000001-0000-0000-0000-000000000001}',                                80, 4, TRUE),
  ('gg000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 9, 'math-g9-functions',            'Functions & Graphs',     'Understand functions, plot graphs', '{gg000002-0000-0000-0000-000000000002}',                               80, 5, TRUE);

-- SKILL NODES — GRADE 9 READING/ELA
INSERT INTO public.skill_nodes (id, subject_id, grade_level, slug, name, description, prerequisite_skill_ids, mastery_threshold, sort_order, is_published) VALUES
  ('hh000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 9, 'read-g9-literary-analysis',    'Literary Analysis',      'Analyze theme, character, plot',   '{}',                                                                  80, 1, TRUE),
  ('hh000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 9, 'read-g9-rhetoric',             'Rhetoric & Argument',    'Identify claims, evidence, logic',  '{hh000001-0000-0000-0000-000000000001}',                              80, 2, TRUE),
  ('hh000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 9, 'read-g9-vocab-advanced',       'Advanced Vocabulary',    'SAT-level vocabulary in context',   '{hh000001-0000-0000-0000-000000000001}',                              80, 3, TRUE);

-- ============================================================
-- LESSONS — GRADE 3 MATH (Times Tables)
-- ============================================================
INSERT INTO public.lessons (skill_id, subject_id, grade_level, lesson_number, title, lesson_type, content, estimated_minutes, xp_reward, difficulty_level, is_published) VALUES
(
  'cc000001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  3, 1, 'Times Tables: 2s and 3s', 'practice',
  '{
    "intro": {"text": "Multiplication is just fast adding! 2×3 means 2 groups of 3. Let''s master the 2s and 3s! ⚡"},
    "questions": [
      {"id":"q1","question_type":"multiple_choice","content":{"text":"What is 2 × 4?","options":[{"id":"a","text":"6"},{"id":"b","text":"8"},{"id":"c","text":"10"},{"id":"d","text":"4"}],"correct_answer":"b"},"difficulty":1,"hint":"Think of 2 groups of 4 objects","explanation":"2 × 4 = 8. Two groups of four: 4 + 4 = 8!"},
      {"id":"q2","question_type":"multiple_choice","content":{"text":"What is 3 × 3?","options":[{"id":"a","text":"6"},{"id":"b","text":"9"},{"id":"c","text":"12"},{"id":"d","text":"8"}],"correct_answer":"b"},"difficulty":1,"hint":"3 groups of 3","explanation":"3 × 3 = 9. This is called a perfect square!"},
      {"id":"q3","question_type":"fill_blank","content":{"text":"2 × 7 = ___","fill_blank_template":"2 × 7 = ___","correct_answer":"14"},"difficulty":2,"hint":"Count by 2s seven times: 2, 4, 6, 8, 10, 12, 14","explanation":"2 × 7 = 14. Counting by 2s: 2,4,6,8,10,12,14!"},
      {"id":"q4","question_type":"multiple_choice","content":{"text":"What is 3 × 7?","options":[{"id":"a","text":"18"},{"id":"b","text":"24"},{"id":"c","text":"21"},{"id":"d","text":"27"}],"correct_answer":"c"},"difficulty":2,"hint":"Count by 3s seven times","explanation":"3 × 7 = 21. Remember: 3,6,9,12,15,18,21!"},
      {"id":"q5","question_type":"fill_blank","content":{"text":"___ × 3 = 15","fill_blank_template":"___ × 3 = 15","correct_answer":"5"},"difficulty":3,"hint":"How many groups of 3 make 15?","explanation":"5 × 3 = 15. Count by 3s: 3,6,9,12,15 — that''s 5 times!"}
    ],
    "summary": "Great work on the 2s and 3s! These are the foundation of all multiplication! 🌟"
  }',
  12, 20, 2, TRUE
);

-- ============================================================
-- LESSONS — GRADE 5 MATH (Fractions)
-- ============================================================
INSERT INTO public.lessons (skill_id, subject_id, grade_level, lesson_number, title, lesson_type, content, estimated_minutes, xp_reward, difficulty_level, is_published) VALUES
(
  'ee000001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  5, 1, 'Adding Fractions with Same Denominator', 'practice',
  '{
    "intro": {"text": "Fractions with the same bottom number are easy to add — just add the tops! 1/4 + 2/4 = 3/4. Let''s practice! 🍕"},
    "questions": [
      {"id":"q1","question_type":"multiple_choice","content":{"text":"What is 1/4 + 2/4?","options":[{"id":"a","text":"3/8"},{"id":"b","text":"3/4"},{"id":"c","text":"2/4"},{"id":"d","text":"1/2"}],"correct_answer":"b"},"difficulty":1,"hint":"Same denominator — just add the numerators","explanation":"1/4 + 2/4 = 3/4. The denominator stays the same, add the numerators: 1+2=3."},
      {"id":"q2","question_type":"fill_blank","content":{"text":"3/8 + 4/8 = ___","fill_blank_template":"3/8 + 4/8 = ___","correct_answer":"7/8"},"difficulty":2,"hint":"Add the top numbers, keep the bottom the same","explanation":"3/8 + 4/8 = 7/8. Just add 3+4=7, keep the 8!"},
      {"id":"q3","question_type":"multiple_choice","content":{"text":"What is 2/5 + 2/5?","options":[{"id":"a","text":"4/10"},{"id":"b","text":"4/5"},{"id":"c","text":"2/5"},{"id":"d","text":"1"}],"correct_answer":"b"},"difficulty":2,"hint":"Add the numerators only","explanation":"2/5 + 2/5 = 4/5. Add the tops: 2+2=4, keep the 5!"},
      {"id":"q4","question_type":"multiple_choice","content":{"text":"Which is greater: 3/7 or 5/7?","options":[{"id":"a","text":"3/7"},{"id":"b","text":"5/7"},{"id":"c","text":"They are equal"},{"id":"d","text":"Cannot tell"}],"correct_answer":"b"},"difficulty":2,"hint":"Same denominator — compare the numerators","explanation":"5/7 > 3/7 because 5 > 3. When denominators are the same, bigger numerator = bigger fraction!"},
      {"id":"q5","question_type":"fill_blank","content":{"text":"5/9 + ___ = 9/9","fill_blank_template":"5/9 + ___ = 9/9","correct_answer":"4/9"},"difficulty":3,"hint":"What do you add to 5 to get 9?","explanation":"5/9 + 4/9 = 9/9. Since 9/9 = 1 whole, you need 4 more ninths!"}
    ],
    "summary": "Excellent fraction work! Remember: same denominator = just add the tops! 🎯"
  }',
  15, 25, 3, TRUE
);

-- ============================================================
-- LESSONS — GRADE 9 MATH (Linear Equations)
-- ============================================================
INSERT INTO public.lessons (skill_id, subject_id, grade_level, lesson_number, title, lesson_type, content, estimated_minutes, xp_reward, difficulty_level, is_published) VALUES
(
  'gg000001-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  9, 1, 'Solving One-Step Linear Equations', 'practice',
  '{
    "intro": {"text": "An equation is like a balanced scale. Whatever you do to one side, you MUST do to the other. Goal: get x alone! Let''s go. 🎯"},
    "questions": [
      {"id":"q1","question_type":"multiple_choice","content":{"text":"Solve: x + 5 = 12","options":[{"id":"a","text":"x = 7"},{"id":"b","text":"x = 17"},{"id":"c","text":"x = 6"},{"id":"d","text":"x = 8"}],"correct_answer":"a"},"difficulty":1,"hint":"Subtract 5 from both sides","explanation":"x + 5 = 12 → x = 12 - 5 → x = 7. Subtract 5 from both sides to isolate x."},
      {"id":"q2","question_type":"fill_blank","content":{"text":"Solve: x - 8 = 3. x = ___","fill_blank_template":"x = ___","correct_answer":"11"},"difficulty":1,"hint":"Add 8 to both sides","explanation":"x - 8 = 3 → x = 3 + 8 → x = 11. Add 8 to both sides!"},
      {"id":"q3","question_type":"multiple_choice","content":{"text":"Solve: 3x = 21","options":[{"id":"a","text":"x = 63"},{"id":"b","text":"x = 18"},{"id":"c","text":"x = 7"},{"id":"d","text":"x = 24"}],"correct_answer":"c"},"difficulty":2,"hint":"Divide both sides by 3","explanation":"3x = 21 → x = 21 ÷ 3 → x = 7. Divide both sides by the coefficient!"},
      {"id":"q4","question_type":"fill_blank","content":{"text":"Solve: x/4 = 6. x = ___","fill_blank_template":"x = ___","correct_answer":"24"},"difficulty":2,"hint":"Multiply both sides by 4","explanation":"x/4 = 6 → x = 6 × 4 → x = 24. Multiply both sides by 4!"},
      {"id":"q5","question_type":"multiple_choice","content":{"text":"Solve: 2x + 3 = 11","options":[{"id":"a","text":"x = 7"},{"id":"b","text":"x = 4"},{"id":"c","text":"x = 5"},{"id":"d","text":"x = 3"}],"correct_answer":"b"},"difficulty":3,"hint":"First subtract 3, then divide by 2","explanation":"2x + 3 = 11 → 2x = 8 → x = 4. Two steps: subtract 3 first, then divide by 2!"}
    ],
    "summary": "Solid algebra foundation! Remember: keep the equation balanced — same operation on both sides. 💪"
  }',
  20, 30, 3, TRUE
);

-- ============================================================
-- PLACEMENT TESTS FOR GRADES 3, 5, 9
-- ============================================================
INSERT INTO public.lessons (subject_id, grade_level, lesson_number, title, lesson_type, content, estimated_minutes, xp_reward, difficulty_level, is_published) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  3, 2, 'Grade 3-5 Math Placement', 'placement',
  '{
    "intro": {"text": "Let''s find your math level! Answer honestly — there''s no wrong starting point. We''ll find exactly where YOU are. 🎯"},
    "questions": [
      {"id":"p1","question_type":"multiple_choice","content":{"text":"What is 6 × 7?","options":[{"id":"a","text":"42"},{"id":"b","text":"48"},{"id":"c","text":"36"},{"id":"d","text":"54"}],"correct_answer":"a"},"difficulty":2,"hint":"Count by 6s seven times","explanation":"6 × 7 = 42!"},
      {"id":"p2","question_type":"fill_blank","content":{"text":"56 ÷ 8 = ___","fill_blank_template":"56 ÷ 8 = ___","correct_answer":"7"},"difficulty":2,"hint":"What times 8 equals 56?","explanation":"56 ÷ 8 = 7 because 8 × 7 = 56!"},
      {"id":"p3","question_type":"multiple_choice","content":{"text":"What is 1/4 + 1/4?","options":[{"id":"a","text":"2/8"},{"id":"b","text":"1/2"},{"id":"c","text":"2/4"},{"id":"d","text":"1/4"}],"correct_answer":"c"},"difficulty":3,"hint":"Add the numerators, keep the denominator","explanation":"1/4 + 1/4 = 2/4 (which also equals 1/2)!"},
      {"id":"p4","question_type":"multiple_choice","content":{"text":"What is 15% of 200?","options":[{"id":"a","text":"15"},{"id":"b","text":"30"},{"id":"c","text":"25"},{"id":"d","text":"20"}],"correct_answer":"b"},"difficulty":4,"hint":"15% = 15/100. Multiply 200 × 0.15","explanation":"15% of 200 = 200 × 0.15 = 30!"},
      {"id":"p5","question_type":"fill_blank","content":{"text":"Solve: 2x + 4 = 14. x = ___","fill_blank_template":"x = ___","correct_answer":"5"},"difficulty":5,"hint":"Subtract 4, then divide by 2","explanation":"2x + 4 = 14 → 2x = 10 → x = 5!"}
    ],
    "summary": "Placement complete! Your personalized path is ready. 🚀"
  }',
  8, 25, 2, TRUE
),
(
  '11111111-1111-1111-1111-111111111111',
  9, 2, 'Grade 9 Math Placement', 'placement',
  '{
    "intro": {"text": "High school math assessment. This helps us find exactly where to start so you''re never bored AND never lost. Let''s go! 🎯"},
    "questions": [
      {"id":"p1","question_type":"fill_blank","content":{"text":"Solve: 3x - 6 = 15. x = ___","fill_blank_template":"x = ___","correct_answer":"7"},"difficulty":3,"hint":"Add 6 to both sides, then divide by 3","explanation":"3x - 6 = 15 → 3x = 21 → x = 7!"},
      {"id":"p2","question_type":"multiple_choice","content":{"text":"What is the slope of y = 3x + 2?","options":[{"id":"a","text":"2"},{"id":"b","text":"3"},{"id":"c","text":"3x"},{"id":"d","text":"1/3"}],"correct_answer":"b"},"difficulty":3,"hint":"In y = mx + b, m is the slope","explanation":"In y = 3x + 2, slope m = 3!"},
      {"id":"p3","question_type":"fill_blank","content":{"text":"Simplify: 2(3x + 4) = ___","fill_blank_template":"= ___","correct_answer":"6x + 8"},"difficulty":4,"hint":"Distribute the 2 to both terms","explanation":"2(3x + 4) = 2×3x + 2×4 = 6x + 8!"},
      {"id":"p4","question_type":"multiple_choice","content":{"text":"Solve the system: x + y = 10, x - y = 4. What is x?","options":[{"id":"a","text":"7"},{"id":"b","text":"3"},{"id":"c","text":"6"},{"id":"d","text":"8"}],"correct_answer":"a"},"difficulty":5,"hint":"Add the two equations together","explanation":"Adding: 2x = 14, so x = 7!"},
      {"id":"p5","question_type":"fill_blank","content":{"text":"Factor: x² + 5x + 6 = (x + 2)(x + ___)","fill_blank_template":"(x + 2)(x + ___)","correct_answer":"3"},"difficulty":5,"hint":"Find two numbers that multiply to 6 and add to 5","explanation":"x² + 5x + 6 = (x+2)(x+3) because 2×3=6 and 2+3=5!"}
    ],
    "summary": "Algebra placement done! We''ll build from exactly where you are. 💪"
  }',
  10, 25, 4, TRUE
);
