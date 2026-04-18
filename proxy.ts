import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password']
const AUTH_ONLY_PATHS = ['/login', '/signup', '/forgot-password']

const ROLE_PATHS: Record<string, string[]> = {
  '/teacher': ['teacher', 'school_admin', 'super_admin'],
  '/student': ['student'],
  '/admin': ['school_admin', 'super_admin'],
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // If no user and accessing protected route → redirect to login
  if (!user && !PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If authenticated user hits auth-only pages → redirect to dashboard
  if (user && AUTH_ONLY_PATHS.some(p => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Role-based path protection
  if (user) {
    const role = user.app_metadata?.role as string | undefined
    for (const [pathPrefix, allowedRoles] of Object.entries(ROLE_PATHS)) {
      if (pathname.startsWith(pathPrefix) && role && !allowedRoles.includes(role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
