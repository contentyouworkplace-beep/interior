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

  // Check if user is admin
  const isAdmin = user?.email === 'admin@goplnr.com'

  // Redirect admin away from CRM routes to admin panel
  const crmRoutes = ['/dashboard', '/clients', '/projects', '/invoices', '/quotations', '/expenses', '/inventory', '/team', '/calendar', '/reports', '/settings', '/notifications']
  
  if (isAdmin && crmRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Check if user's subscription has expired (skip for admin)
  if (user && !isAdmin && user.user_metadata?.expires_at) {
    const expiresAt = new Date(user.user_metadata.expires_at)
    const now = new Date()
    
    if (expiresAt < now) {
      // Subscription expired - block access to protected routes
      const protectedRoutes = ['/dashboard', '/clients', '/projects', '/invoices', '/quotations', '/expenses', '/inventory', '/team', '/calendar', '/reports', '/settings', '/notifications']
      
      if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        // Sign out the user
        await supabase.auth.signOut()
        // Redirect to login with expiry message
        const url = new URL('/', request.url)
        url.searchParams.set('expired', 'true')
        return NextResponse.redirect(url)
      }
    }
  }

  // Protect authenticated routes
  const protectedRoutes = ['/dashboard', '/clients', '/projects', '/invoices', '/quotations', '/expenses', '/inventory', '/team', '/calendar', '/reports', '/settings', '/notifications', '/admin', '/super-admin']
  
  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect authenticated users from login page
  if (request.nextUrl.pathname === '/' && user) {
    // Admin goes to admin panel, regular users to dashboard
    const redirectUrl = isAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}