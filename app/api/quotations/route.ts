import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST: Create new quotation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: POST /api/quotations - Starting')
    const supabase = createClient()
    
    // Temporary: Use hardcoded user ID for testing (same as clients API)
    const userId = "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6"
    
    const body = await request.json()
    console.log('📦 API: Quotation data received:', JSON.stringify(body).substring(0, 500) + '...')
    
    const { 
      client_id,
      project_id,
      quotation_number,
      title,
      description,
      total_amount,
      tax_amount,
      discount_amount,
      valid_until,
      terms,
      notes,
      items, // Array of quotation items
      issue_date,
      subtotal,
      gst_type,
      tax_rate,
      currency,
      template
    } = body

    // Validate required fields
    if (!client_id || !title || !total_amount) {
      console.log('❌ API: Validation failed - missing required fields')
      return NextResponse.json(
        { error: 'Client, title, and total amount are required' },
        { status: 400 }
      )
    }

    // Verify client belongs to user (using hardcoded user ID)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', userId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Invalid client selected' },
        { status: 400 }
      )
    }

    // Generate quotation number if not provided
    let finalQuotationNumber = quotation_number
    if (!finalQuotationNumber) {
      const { count } = await supabase
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      finalQuotationNumber = `QUO-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`
    }

    // Create new quotation
    console.log('🔄 API: Creating new quotation')
    
    const quotationData = {
        user_id: userId,
        client_id,
        project_id: project_id || null,
        quotation_number: finalQuotationNumber,
        title,
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        valid_until: valid_until || null,
        subtotal: subtotal || (total_amount - (tax_amount || 0)),
        tax_rate: tax_rate || 18,
        tax_amount: tax_amount || 0,
        discount_amount: discount_amount || 0,
        total_amount,
        currency: currency || 'INR',
        notes: notes || null,
        terms: terms || null,
        // Using terms instead of terms_conditions to match DB structure
        items: items || [],
        status: 'draft'
    };
    
    console.log('📤 API: Quotation data to insert:', JSON.stringify(quotationData).substring(0, 500) + '...')
    
    const { data: newQuotation, error: createError } = await supabase
      .from('quotations')
      .insert(quotationData)
      .select()
      .single()

    if (createError) {
      console.error('❌ API Error creating quotation:', createError)
      return NextResponse.json(
        { error: 'Failed to create quotation', details: createError.message },
        { status: 500 }
      )
    }

    console.log('✅ API: Quotation created successfully:', newQuotation?.id)
    return NextResponse.json({
      quotation: newQuotation,
      success: true,
      message: 'Quotation created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('💥 API: Quotation creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET: Fetch quotations
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Temporary: Use hardcoded user ID for testing (same as clients API)
    const userId = "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6"

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    let query = supabase
      .from('quotations')
      .select(`
        id,
        quotation_number,
        title,
        total_amount,
        status,
        valid_until,
        created_at,
        clients (
          first_name,
          last_name,
          company
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: quotations, error: quotationsError } = await query

    if (quotationsError) {
      console.error('Error fetching quotations:', quotationsError)
      return NextResponse.json(
        { error: 'Failed to fetch quotations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      quotations: quotations || [],
      success: true
    })

  } catch (error) {
    console.error('Quotations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    )
  }
}