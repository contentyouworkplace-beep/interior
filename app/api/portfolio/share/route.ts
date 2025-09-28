import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Generate a unique showcase token
    const generateShareToken = () => {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    
    const showcaseToken = generateShareToken()
    
    // Create a showcase share record
    const showcaseData = {
      project_id: 'showcase', // Special identifier for showcase
      share_type: 'public' as const,
      share_token: showcaseToken,
      expires_at: null, // Showcase links don't expire
      allow_download: true,
      allow_comments: false,
      watermark_enabled: true,
      is_active: true,
      user_id: user.id
    }

    // First, deactivate any existing showcase shares for this user
    await supabase
      .from('portfolio_shares')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('project_id', 'showcase')

    const { data: showcase, error } = await supabase
      .from('portfolio_shares')
      .insert([showcaseData])
      .select()
      .single()

    if (error) {
      console.error('Error creating showcase:', error)
      return NextResponse.json({
        error: `Failed to create showcase: ${error.message}`
      }, { status: 500 })
    }

    // Get the origin from the request headers
    const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000'
    const showcaseUrl = `${origin}/portfolio/showcase/${showcaseToken}`

    return NextResponse.json({
      success: true,
      showcase_url: showcaseUrl
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}