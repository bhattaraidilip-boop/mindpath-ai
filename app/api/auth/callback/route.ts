import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get('code')
  const redirect = searchParams.get('redirect') ?? '/parent/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user role and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        const roleHome: Record<string, string> = {
          student: '/student/dashboard',
          parent:  '/parent/dashboard',
          teacher: '/teacher/dashboard',
          admin:   '/admin/dashboard',
        }

        const destination = roleHome[userData?.role ?? 'parent'] ?? redirect
        return NextResponse.redirect(`${origin}${destination}`)
      }
    }
  }

  // Error fallback
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
