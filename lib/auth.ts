import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type AuthError = {
  message: string
  status?: number
}

export type AuthResponse = {
  user: User | null
  error: AuthError | null
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return {
      user: data.user,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to sign in',
        status: 401,
      },
    }
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { [key: string]: any }
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) throw error

    // If user was created successfully, trigger organization setup
    if (data.user && !data.user.email_confirmed_at) {
      // User needs email confirmation first
      console.log('User created, email confirmation required')
    } else if (data.user) {
      // User is confirmed, trigger organization setup
      try {
        await fetch('/api/dev/setup-auto-organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        console.log('Auto organization setup triggered for new user')
      } catch (setupError) {
        console.log('Auto organization setup failed:', setupError)
        // Don't fail the signup for this
      }
    }

    return {
      user: data.user,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: {
        message: error instanceof Error ? error.message : 'Failed to sign up',
        status: 400,
      },
    }
  }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { error: null }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to sign out',
        status: 500,
      },
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to send reset password email',
        status: 500,
      },
    }
  }
}

export async function updatePassword(password: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) throw error

    return { error: null }
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to update password',
        status: 500,
      },
    }
  }
}

// Session management
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// Auth state change subscription
export function onAuthStateChange(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event as 'SIGNED_IN' | 'SIGNED_OUT', session)
  })
}