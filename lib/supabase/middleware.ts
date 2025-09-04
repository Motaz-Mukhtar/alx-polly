import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get both user and session data for comprehensive validation
  const [userResponse, sessionResponse] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ])

  const user = userResponse.data.user
  const session = sessionResponse.data.session

  // Check if user exists and session is valid
  if (!user || !session) {
    // No user or invalid session, redirect to login
    if (!request.nextUrl.pathname.startsWith('/login') && 
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/register')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Check if session is expired
  if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
    // Session expired, clear cookies and redirect to login
    supabaseResponse.cookies.delete('sb-access-token')
    supabaseResponse.cookies.delete('sb-refresh-token')
    
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check if user email is verified (only for protected routes)
  if (!request.nextUrl.pathname.startsWith('/login') && 
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/register')) {
    
    if (!user.email_confirmed_at) {
      // Email not verified, redirect to verification page
      const url = request.nextUrl.clone()
      url.pathname = '/auth/verify-email'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}