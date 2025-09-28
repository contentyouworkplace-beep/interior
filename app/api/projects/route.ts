import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user projects; include minimal fields needed by the UI
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json({
      projects: projects || [],
      count: projects?.length || 0,
      success: true,
    })
  } catch (err) {
    console.error('Projects API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
