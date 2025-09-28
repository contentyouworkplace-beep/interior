import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Creating team_payments table...')

    // Try to create the team_payments table
    // Since we can't use exec_sql, we'll use a workaround
    // We'll try to insert a record and see what happens
    
    const { data, error } = await supabase
      .from('team_payments')
      .select('count')
      .limit(1)

    if (error && error.code === 'PGRST205') {
      // Table doesn't exist
      return NextResponse.json({
        success: false,
        message: 'team_payments table does not exist',
        instruction: 'Please copy and paste the content from apply-team-payments-table.sql in your Supabase SQL Editor and run it.',
        sqlFile: 'apply-team-payments-table.sql'
      })
    } else if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: error.message
      }, { status: 500 })
    } else {
      return NextResponse.json({
        success: true,
        message: 'team_payments table already exists and is accessible'
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}