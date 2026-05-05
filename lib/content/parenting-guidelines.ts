// lib/content/parenting-guidelines.ts
// MindPath AI — Parenting Guidelines
// Age-specific coaching for parents — a major differentiator

export interface ParentingGuideline {
  grade:       number
  ageRange:    string
  title:       string
  overview:    string
  dailyHabits: string[]
  doThis:      string[]
  avoidThis:   string[]
  weeklyGoal:  string
  talkingPoint: string   // conversation starter for tonight
  waldTarget:  number    // recommended days/week
}

export const PARENTING_GUIDELINES: ParentingGuideline[] = [

  // ─── GRADE 3 (Age 8-9) ────────────────────────────────────────────────────
  {
    grade:    3,
    ageRange: 'Age 8–9',
    title:    'Building the Learning Habit',
    overview: 'Grade 3 is when kids shift from learning to read to reading to learn. Consistency and routine are everything at this age. Your job: make learning a daily non-negotiable — like brushing teeth.',
    dailyHabits: [
      'Same time every day (after school snack is the best window)',
      'No screens until MindPath lesson is done',
      '10–15 minutes maximum — quality over quantity',
      'Celebrate completion, not just correct answers',
    ],
    doThis: [
      'Ask "What did you learn today?" at dinner — be specific',
      'Let them explain a problem to you (teaching = deepest learning)',
      'Put their earned badges on the fridge or family group chat',
      'Make it a competition between siblings — friendly only',
      'Review the parent dashboard together once a week',
    ],
    avoidThis: [
      'Sitting with them the entire session — let them struggle a little',
      'Showing frustration when they get wrong answers',
      'Skipping days "just this once" — streaks are the engine',
      'Comparing their level to other kids',
    ],
    weeklyGoal:   'Complete at least 5 lessons this week across math and reading.',
    talkingPoint: 'Ask your child: "If you were the teacher, how would you explain multiplication to a younger kid?"',
    waldTarget:   5,
  },

  // ─── GRADE 5 (Age 10-11) ──────────────────────────────────────────────────
  {
    grade:    5,
    ageRange: 'Age 10–11',
    title:    'The Critical Middle Years',
    overview: 'Grade 5 is the gateway to middle school. Fractions, decimals, and reading comprehension get significantly harder. Kids who fall behind here often struggle all through high school. Your job: keep the momentum strong.',
    dailyHabits: [
      '15–20 minutes daily — this age can handle more',
      'Mix subjects — math one session, reading the next',
      'Let them pick which lesson to start with (ownership matters)',
      'Friday review: look at the week together on parent dashboard',
    ],
    doThis: [
      'Connect math to real life — "What''s 30% off $80?" at the store',
      'Read together out loud 3x per week — even 10 minutes',
      'Praise effort loudly, correct mistakes quietly',
      'Use their streak as leverage: "You''re on a 7-day streak — don''t break it!"',
      'Set a monthly XP goal together — make it a family challenge',
    ],
    avoidThis: [
      'Letting them skip weekends — WALD needs to stay at 5+',
      'Doing the work for them when they ask for help',
      'Over-scheduling — tired kids can''t learn',
      'Ignoring the parent report — check it every Monday morning',
    ],
    weeklyGoal:   'Maintain a 5+ day streak and complete at least 2 math AND 2 reading lessons.',
    talkingPoint: 'Ask your child: "What''s one thing you learned this week that surprised you or that you didn''t know before?"',
    waldTarget:   5,
  },

  // ─── GRADE 9 (Age 14-15) ──────────────────────────────────────────────────
  {
    grade:    9,
    ageRange: 'Age 14–15',
    title:    'High School: Laying the Foundation',
    overview: 'Grade 9 Algebra and English are the two subjects that predict SAT scores, college readiness, and career paths. This is no longer optional — this is the foundation. Your job as a parent shifts from "making them do it" to "showing them why it matters."',
    dailyHabits: [
      '20–30 minutes daily — high school needs deeper practice',
      'No phones during session — this age needs distraction-free time',
      'Evening sessions work well (7–9pm) if mornings are busy',
      'Connect every lesson to a real-world goal they care about',
    ],
    doThis: [
      'Have a direct conversation: "Algebra now = more options later"',
      'Show them the SAT math section — make it concrete and real',
      'Give them autonomy: let them pick lesson order and pace',
      'Acknowledge hard work publicly — teen validation matters',
      'Check the parent dashboard weekly — know their mastery scores',
      'If they hit 80%+ mastery in a subject, celebrate it seriously',
    ],
    avoidThis: [
      'Nagging — at this age it backfires completely',
      'Comparing them to siblings or other kids',
      'Ignoring missed days — 3 missed days needs a direct conversation',
      'Thinking "they''ll figure it out in school" — supplemental practice is the edge',
    ],
    weeklyGoal:   'Complete at least 4 sessions with 75%+ average score across all subjects.',
    talkingPoint: 'Ask your teen: "If you had to explain what a linear equation IS in one sentence — not how to solve it, but what it actually represents — what would you say?"',
    waldTarget:   4,
  },
]

export function getGuidelineForGrade(grade: number): ParentingGuideline | undefined {
  return PARENTING_GUIDELINES.find(g => g.grade === grade)
}

// Special combined insight for families with multiple kids
export const MULTI_KID_TIPS = [
  'Create a family leaderboard — kids compete on total XP earned per week',
  'Let the older child tutor the younger one on something they mastered',
  'Family "learning hour" — everyone does their session at the same time',
  'Weekly family report review — show all kids their dashboards together',
  'Shared streak goal: if ALL kids hit 5 days this week, family reward',
]

// Dilli's specific family insight (3 kids, grades 3, 5, 9)
export const FAMILY_INSIGHT = {
  summary: "You have kids at three critical learning stages — elementary mastery, middle school bridge, and high school foundation. The biggest risk is your Grade 9 student falling behind on Algebra while you focus energy on the younger two. Set Grade 9 as highest priority for parent check-ins.",
  priority: [
    { grade: 9, reason: 'Algebra 1 determines college readiness — most urgent to monitor' },
    { grade: 5, reason: 'Fraction and decimal mastery before middle school is critical' },
    { grade: 3, reason: 'Building the habit now pays dividends for 10 years' },
  ],
  weeklyRitualSuggestion: 'Every Sunday evening: 5-minute family check-in. Each kid shares one thing they learned. You review the parent dashboard. Takes 10 minutes, builds culture.',
}
