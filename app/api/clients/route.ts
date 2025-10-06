import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { listClients, createClientRow } from '@/lib/services/supabase/clients'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Query clients directly with the server supabase client
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch clients', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clients: clients || [],
      count: clients?.length || 0,
      success: true
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Prepare client data for database
    const clientData: Database['public']['Tables']['clients']['Insert'] = {
      user_id: user.id,
      first_name: body.first_name?.trim(),
      last_name: body.last_name?.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      alt_phone: body.alt_phone?.trim() || null,
      company: body.company?.trim() || null,
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      notes: body.notes?.trim() || null,
      status: 'active'
    }

    // Create client using server-side client
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create client', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      client: newClient,
      success: true,
      message: 'Client created successfully'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}