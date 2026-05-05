// app/api/analytics/beacon/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const events = await request.json()
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createAdminClient()
    await supabase.from('analytics_events').insert(
      events.slice(0, 20).map((e: Record<string, unknown>) => ({
        student_id:  e.student_id || null,
        event_type:  e.event_type,
        properties:  e.properties ?? {},
        session_id:  e.session_id ?? null,
        device_type: e.device_type ?? null,
      }))
    )

    return NextResponse.json({ ok: true })
  } catch {
    // Never fail on analytics
    return NextResponse.json({ ok: true })
  }
}
