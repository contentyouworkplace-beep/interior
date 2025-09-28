import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const supabase = createApiClient(request)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    console.log('Fetching team payments for member:', params.id, 'month:', month, 'year:', year)

    // First check if team_payments table exists by attempting a simple query
    let tableExists = true
    try {
      const { data: testTable, error: testError } = await supabase
        .from('team_payments')
        .select('id')
        .limit(1)
      
      if (testError && testError.message.includes('does not exist')) {
        tableExists = false
      }
    } catch (error) {
      console.log('Error testing table existence:', error)
      tableExists = false
    }

    if (!tableExists) {
      console.log('team_payments table does not exist. Please create it manually in Supabase.')
      
      // Return instructions for manual table creation
      return NextResponse.json({ 
        error: 'team_payments table missing. Please run the SQL from create-team-payments-table.sql in your Supabase SQL editor.',
        sqlFile: 'create-team-payments-table.sql'
      }, { status: 500 })
    }

    let query = supabase
      .from('team_payments')
      .select('*')
      .eq('team_member_id', params.id)
      .eq('organization_id', user.id)
      .order('payment_date', { ascending: false })

    // Add month/year filters if provided
    if (month > 0 && year > 0) {
      // Compute correct last day of the month to avoid invalid dates like 2025-09-31
      // JS Date: new Date(year, month, 0) gives the last day of the previous month when month is 1-based,
      // so use month+1 and day=0 when month is 0-based. Here month is 1-based from the client.
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate() // month is 1-based, Date(year, month, 0) returns last day of month
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
      query = query.gte('payment_date', startDate).lte('payment_date', endDate)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error('Database error fetching payments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return consistent shape { data: [...] }
    return NextResponse.json({ data: payments || [] })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const supabase = createApiClient(request)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { payment_type, amount, description, notes, payment_date } = body

    console.log('Creating team payment record:', body)

    // First check if team_payments table exists by attempting a simple query
    let tableExists = true
    try {
      const { data: testTable, error: testError } = await supabase
        .from('team_payments')
        .select('id')
        .limit(1)
      
      if (testError && testError.message.includes('does not exist')) {
        tableExists = false
      }
    } catch (error) {
      console.log('Error testing table existence:', error)
      tableExists = false
    }

    if (!tableExists) {
      console.log('team_payments table does not exist. Please create it manually in Supabase.')
      
      // Return instructions for manual table creation
      return NextResponse.json({ 
        error: 'team_payments table missing. Please run the SQL from create-team-payments-table.sql in your Supabase SQL editor.',
        sqlFile: 'create-team-payments-table.sql'
      }, { status: 500 })
    }

    // Insert payment record into team_payments table
    const { data: payment, error } = await supabase
      .from('team_payments')
      .insert([
        {
          team_member_id: params.id,
          organization_id: user.id,
          payment_type,
          amount: parseFloat(amount),
          description,
          notes,
          payment_date: payment_date || new Date().toISOString().split('T')[0],
          status: 'completed',
          payment_mode: 'cash' // default
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error creating team payment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Team payment created successfully:', payment)
    // Return consistent shape
    return NextResponse.json({ data: payment })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}