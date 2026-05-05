// lib/openai/tutor.ts
// MindPath AI — AI Tutor with COPPA Safety Layer

import OpenAI from 'openai'
import type { AIMessage, AgeGroup } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── AGE PROFILES ─────────────────────────────────────────────────────────────
const AGE_PROFILES: Record<AgeGroup, {
  maxWords:    number
  systemPrompt: string
  maxTokens:   number
}> = {
  ages_4_6: {
    maxWords:    30,
    maxTokens:   120,
    systemPrompt: `You are Buddy, a friendly cartoon bear who helps young children learn.
RULES (never break these):
- Use ONLY very simple words a 4-6 year old understands
- Maximum 1-2 short sentences per response
- Always be warm, encouraging, and excited
- Use 1-2 emojis per response
- NEVER give the direct answer — guide the child to find it
- Say "Great try!" or "You're so close!" for wrong answers
- NEVER ask for any personal information
- NEVER mention websites, apps, or anything outside learning
- NEVER discuss violence, fear, sadness, or anything scary
- If unsure what to say, respond: "Ask your parent or teacher for help! 🌟"`,
  },
  ages_7_10: {
    maxWords:    80,
    maxTokens:   200,
    systemPrompt: `You are a friendly, encouraging learning helper for children ages 7-10.
RULES (never break these):
- Use simple, clear language appropriate for elementary school
- Explain step-by-step — never more than 3 steps
- Use familiar real-world examples (food, animals, sports, games)
- Be encouraging — always celebrate effort, not just correct answers
- NEVER give the direct answer — help the child discover it themselves
- For math: describe the process, not the answer
- NEVER ask for personal information
- NEVER mention social media, news, or outside world topics
- NEVER discuss anything scary, violent, or inappropriate
- If stuck: "This is tricky! Let's try together. First, let's think about..."
- End with: "You've got this! 💪"`,
  },
  ages_11_14: {
    maxWords:    150,
    maxTokens:   350,
    systemPrompt: `You are a clear, encouraging academic helper for middle school students ages 11-14.
RULES (never break these):
- Use clear, age-appropriate academic language
- Explain concepts with relatable examples
- Ask guiding questions to lead the student to the answer — never give it directly
- For math: show the method/approach, not the final calculation
- Validate their thinking: "I see why you thought that — here's another way to look at it"
- NEVER ask for personal information
- NEVER discuss social media, relationships, politics, news, or anything off-topic
- Stay strictly on the academic topic at hand
- End with a thinking question: "What do you think happens next if...?"`,
  },
  ages_15_18: {
    maxWords:    250,
    maxTokens:   500,
    systemPrompt: `You are a knowledgeable, concise academic tutor for high school students ages 15-18.
RULES (never break these):
- Use precise academic language appropriate for high school
- Explain the WHY behind concepts, not just the HOW
- Use the Socratic method — ask guiding questions before explaining
- For math/science: explain the principle, then the method — never just the answer
- Connect concepts to real applications where relevant
- Be direct and efficient — no fluff
- NEVER ask for personal information
- NEVER discuss anything outside academics (no politics, relationships, social media, news)
- If a question is outside your scope: "That's worth asking your teacher about in class."`,
  },
}

// ─── AGE GROUP FROM DATE OF BIRTH ────────────────────────────────────────────
export function getAgeGroup(dateOfBirth: string | null, gradeLevel: number): AgeGroup {
  if (!dateOfBirth) {
    // Fallback to grade level
    if (gradeLevel <= 1) return 'ages_4_6'
    if (gradeLevel <= 4) return 'ages_7_10'
    if (gradeLevel <= 8) return 'ages_11_14'
    return 'ages_15_18'
  }

  const age = Math.floor(
    (Date.now() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  )

  if (age <= 6)  return 'ages_4_6'
  if (age <= 10) return 'ages_7_10'
  if (age <= 14) return 'ages_11_14'
  return 'ages_15_18'
}

// ─── CONTENT SAFETY FILTER ───────────────────────────────────────────────────
const FORBIDDEN_PATTERNS = [
  /\b(password|address|phone|credit card|social security)\b/i,
  /\b(facebook|instagram|tiktok|youtube|snapchat|twitter|discord)\b/i,
  /\b(kill|die|death|violent|weapon|drug|alcohol|sex|hate)\b/i,
  /https?:\/\//i,  // no external URLs
  /\b(ugly|stupid|dumb|idiot|loser)\b/i,
]

function isSafeResponse(text: string): boolean {
  return !FORBIDDEN_PATTERNS.some(pattern => pattern.test(text))
}

const SAFE_FALLBACK = "I'm not sure about that one! Ask your parent or teacher — they'll know! 🌟"

// ─── MAIN AI TUTOR FUNCTION ───────────────────────────────────────────────────
export async function getAITutorResponse(params: {
  studentName:   string
  ageGroup:      AgeGroup
  questionText:  string
  subjectName:   string
  explanation:   string | null
  history:       AIMessage[]
  userMessage:   string
}): Promise<{ response: string; safe: boolean }> {
  const profile = AGE_PROFILES[params.ageGroup]

  // Build context message
  const contextBlock = `
CURRENT LESSON CONTEXT:
- Subject: ${params.subjectName}
- Question the student is working on: "${params.questionText}"
- Correct explanation (for your reference only — do NOT reveal this): "${params.explanation ?? 'N/A'}"
- Student's name: ${params.studentName}

Remember: Guide them to the answer. Never give it directly.
`.trim()

  // Build messages array (keep last 6 turns of history to control tokens)
  const recentHistory = params.history.slice(-6)
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: profile.systemPrompt + '\n\n' + contextBlock },
    ...recentHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: params.userMessage },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o-mini',           // cost-efficient for MVP
      messages,
      max_tokens:  profile.maxTokens,
      temperature: 0.5,                     // lower = more consistent for education
    })

    const rawResponse = completion.choices[0]?.message?.content ?? SAFE_FALLBACK

    // Safety check
    if (!isSafeResponse(rawResponse)) {
      return { response: SAFE_FALLBACK, safe: false }
    }

    return { response: rawResponse, safe: true }
  } catch (error) {
    console.error('AI tutor error:', error)
    return { response: SAFE_FALLBACK, safe: false }
  }
}

// ─── ANSWER VALIDATION (Deterministic — NOT AI) ──────────────────────────────
// Math answers are NEVER validated by AI. Deterministic only.
export function validateAnswer(
  questionType: string,
  studentAnswer: unknown,
  correctAnswer: string | string[]
): boolean {
  const normalize = (s: string) => s.toString().trim().toLowerCase()

  if (Array.isArray(correctAnswer)) {
    return correctAnswer.some(ca =>
      normalize(String(studentAnswer)) === normalize(ca)
    )
  }

  return normalize(String(studentAnswer)) === normalize(correctAnswer)
}

// ─── STEP-BY-STEP EXPLANATION ────────────────────────────────────────────────
export async function getStepByStepExplanation(params: {
  ageGroup:     AgeGroup
  questionText: string
  correctAnswer: string
  subjectName:  string
  studentName:  string
}): Promise<string> {
  const profile = AGE_PROFILES[params.ageGroup]

  const prompt = `
The student ${params.studentName} got this ${params.subjectName} question wrong.
Question: "${params.questionText}"
The correct answer is: "${params.correctAnswer}"

Explain WHY this is the answer in a step-by-step way appropriate for your age group.
Do NOT just say "the answer is X". Walk them through the thinking process.
Keep it encouraging and brief.
`.trim()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: profile.systemPrompt },
        { role: 'user',   content: prompt },
      ],
      max_tokens:  profile.maxTokens,
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content ?? SAFE_FALLBACK

    if (!isSafeResponse(response)) return SAFE_FALLBACK
    return response
  } catch {
    return SAFE_FALLBACK
  }
}
