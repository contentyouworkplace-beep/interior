import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/reset-password', '/auth/callback']

export async function middleware(request: NextRequest) {
  // Initialize response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect authenticated routes
  const protectedRoutes = ['/dashboard', '/clients', '/projects', '/invoices', '/quotations', '/expenses', '/inventory', '/team', '/calendar', '/reports', '/settings', '/notifications', '/admin', '/super-admin']
  
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect authenticated users from login page
  if (request.nextUrl.pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}