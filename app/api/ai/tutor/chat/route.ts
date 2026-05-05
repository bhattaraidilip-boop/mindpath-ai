// app/api/ai/tutor/chat/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAITutorResponse, getAgeGroup } from '@/lib/openai/tutor'
import type { AIMessage } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, questionId, sessionId, conversationId } = await request.json()

    if (!message || message.length > 500) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // Get student profile for age group
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('display_name, date_of_birth, grade_level')
      .eq('user_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const ageGroup = getAgeGroup(profile.date_of_birth, profile.grade_level)

    // Get question context if provided
    let questionText = ''
    let explanation  = null
    let subjectName  = 'this subject'

    if (questionId && sessionId) {
      const { data: session } = await supabase
        .from('learning_sessions')
        .select('lesson_id')
        .eq('id', sessionId)
        .eq('student_id', user.id)
        .single()

      if (session) {
        const { data: lesson } = await supabase
          .from('lessons')
          .select('content, subject_id, subjects(name)')
          .eq('id', session.lesson_id)
          .single()

        if (lesson) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const questions = (lesson.content as any)?.questions ?? []
          const q = questions.find((q: { id: string }) => q.id === questionId)
          questionText = q?.content?.text ?? ''
          explanation  = q?.explanation ?? null
          subjectName  = (lesson as any).subjects?.name ?? 'this subject'
        }
      }
    }

    // Get or create conversation
    let conversation = null
    if (conversationId) {
      const { data } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('student_id', user.id)
        .single()
      conversation = data
    }

    const history: AIMessage[] = (conversation?.messages as AIMessage[]) ?? []

    // Get AI response
    const { response, safe } = await getAITutorResponse({
      studentName:  profile.display_name,
      ageGroup,
      questionText,
      subjectName,
      explanation,
      history,
      userMessage: message,
    })

    // Update conversation history
    const newHistory: AIMessage[] = [
      ...history,
      { role: 'user',      content: message,  timestamp: new Date().toISOString() },
      { role: 'assistant', content: response, timestamp: new Date().toISOString() },
    ]

    // Upsert conversation (keep last 20 messages to control storage)
    const savedMessages = newHistory.slice(-20)

    let savedConvId = conversationId
    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ messages: savedMessages, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    } else {
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({ student_id: user.id, session_id: sessionId ?? null, messages: savedMessages })
        .select('id')
        .single()
      savedConvId = newConv?.id
    }

    return NextResponse.json({
      data: { response, safe, conversationId: savedConvId },
      error: null,
    })
  } catch (error) {
    console.error('AI tutor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
