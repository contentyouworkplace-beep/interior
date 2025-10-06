import { createApiClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST: Create new quotation
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API: POST /api/quotations - Starting')
    const supabase = createApiClient(request)
    
    // Get authenticated user (match clients API behavior)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
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
      discount_type, // may come from UI
      discount_value, // may come from UI
      valid_until,
      terms, // UI sends 'terms' but DB column is terms_conditions
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

    // Verify client is accessible (RLS ensures it belongs to the user)
    const { data: clientRow, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single()
    
    if (clientError || !clientRow) {
      console.warn('⚠️ API: Client not found or inaccessible', { client_id, userId: user.id, clientError })
      return NextResponse.json(
        { error: 'Invalid client selected' },
        { status: 400 }
      )
    }

    // Helper: Generate next quotation number resiliently (works even if SELECT is limited by RLS)
    const generateNextNumber = async (seed?: string): Promise<string> => {
      const year = new Date().getFullYear()
      const prefix = `QUO-${year}-`
      if (seed?.startsWith(prefix)) {
        const m = seed.match(/^(.*-)(\d{4})$/)
        if (m) return `${m[1]}${String(parseInt(m[2], 10) + 1).padStart(4,'0')}`
      }
      try {
        const { data: latest, error: latestErr } = await supabase
          .from('quotations')
          .select('quotation_number')
          .ilike('quotation_number', `${prefix}%`)
          .order('quotation_number', { ascending: false })
          .limit(1)
        if (latestErr) {
          console.warn('⚠️ API: Could not fetch latest quotation number (RLS?). Using base 0001.', latestErr)
          return `${prefix}0001`
        }
        const last = latest?.[0]?.quotation_number as string | undefined
        if (!last) return `${prefix}0001`
        const m = last.match(/^(.*-)(\d{4})$/)
        if (!m) return `${prefix}0001`
        const next = String(parseInt(m[2], 10) + 1).padStart(4,'0')
        return m[1] + next
      } catch (e) {
        console.warn('⚠️ API: Fallback numbering due to unexpected error', e)
        return `${prefix}0001`
      }
    }

    // Generate quotation number if not provided
    let finalQuotationNumber = quotation_number
    if (!finalQuotationNumber) {
      finalQuotationNumber = await generateNextNumber()
    }

    // Create new quotation
    console.log('🔄 API: Creating new quotation')

    // Build initial payload using conservative column set (avoid columns that may not exist in older schema versions)
    const quotationData: Record<string, any> = {
      user_id: user.id,
      client_id,
      project_id: project_id || null,
      quotation_number: finalQuotationNumber,
      title,
      issue_date: issue_date || new Date().toISOString().split('T')[0],
      valid_until: (valid_until || issue_date || new Date().toISOString().split('T')[0]),
      subtotal: subtotal || (total_amount - (tax_amount || 0)),
      tax_rate: tax_rate ?? 18,
      tax_amount: tax_amount || 0,
      total_amount,
      currency: currency || 'INR',
      notes: notes || null,
      status: 'pending',
      template: template || 'modern'
    }

    // Discount handling: system historically used discount_amount; current schema uses discount_type & discount_value
    const unifiedDiscountValue = (discount_value !== undefined ? discount_value : (discount_amount !== undefined ? discount_amount : undefined))
    if (unifiedDiscountValue !== undefined && unifiedDiscountValue !== null && unifiedDiscountValue !== 0) {
      quotationData.discount_value = unifiedDiscountValue
      quotationData.discount_type = discount_type || 'flat'
    }

    // Attempt to map terms -> terms_conditions (will auto-remove if column absent)
    if (terms) {
      quotationData.terms_conditions = terms
    }

    // We DO NOT insert raw items JSON into quotations; items go to quotation_items table separately.
    // (Older schema variants never had an items column; inserting it causes PGRST204 errors.)

    console.log('📤 API: Quotation data initial payload:', JSON.stringify(quotationData).substring(0, 500) + '...')

    // Adaptive insert with fallback removal of unknown columns
    let newQuotation: any = null
    let lastError: any = null
    const maxAttempts = 12
    let removedTermsConditions = false
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const insertPayload: any = { ...quotationData, quotation_number: finalQuotationNumber }
      const { data, error } = await supabase
        .from('quotations')
        .insert(insertPayload as any)
        .select()
        .single()

      if (!error) {
        newQuotation = data
        lastError = null
        break
      }

      // Unique violation -> regenerate number & retry
      if (error?.code === '23505') {
        console.warn(`⚠️ API: quotation_number conflict (${finalQuotationNumber}), regenerating (attempt ${attempt}/${maxAttempts})`)
        finalQuotationNumber = await generateNextNumber(finalQuotationNumber)
        continue
      }

      // Missing column (PGRST204) -> parse column name and remove then retry
      if (error?.code === 'PGRST204' && typeof error.message === 'string') {
        const match = error.message.match(/'([^']+)'/)
        const missingCol = match?.[1]
        if (missingCol && quotationData.hasOwnProperty(missingCol)) {
          console.warn(`⚠️ API: Removing unsupported column '${missingCol}' and retrying (attempt ${attempt}/${maxAttempts})`)
          delete quotationData[missingCol]
          if (missingCol === 'terms_conditions' && terms && !quotationData.terms) {
            quotationData.terms = terms
            removedTermsConditions = true
          }
          continue
        }
      }

      // Any other error -> abort
      lastError = error
      break
    }

    if (lastError || !newQuotation) {
      const explanation = lastError ? lastError.message : 'Insert returned no row (possible missing SELECT RLS policy on quotations)'
      console.error('❌ API Error creating quotation (final):', lastError, 'Final payload keys:', Object.keys(quotationData))
      return NextResponse.json({
        error: 'Failed to create quotation',
        details: explanation,
        removed_columns: Object.keys(body).filter(k => !Object.keys(quotationData).includes(k)),
        hints: [
          removedTermsConditions ? 'Add terms_conditions column to quotations or keep legacy terms column.' : undefined,
          'Ensure RLS SELECT policy: USING (user_id = auth.uid()) so inserted row can be returned.',
          'Consider dedicated sequence for quotation numbers to avoid conflicts.'
        ].filter(Boolean)
      }, { status: 500 })
    }

    console.log('✅ API: Quotation created successfully:', newQuotation?.id)
    
    // Now insert quotation items if provided
    if (items && Array.isArray(items) && items.length > 0 && newQuotation?.id) {
      console.log(`📦 API: Inserting ${items.length} quotation items...`)
      const itemsToInsert = items.map((item: any, index: number) => ({
        quotation_id: newQuotation.id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: item.amount || 0, // 'amount' from client maps to 'total' in DB
        item_order: item.item_order || index + 1
      }))

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('⚠️ API: Error inserting quotation items:', itemsError)
        // Don't fail the whole request, just log the error
      } else {
        console.log('✅ API: Quotation items inserted successfully')
      }
    } else if (items?.length && !newQuotation?.id) {
      console.warn('⚠️ API: Skipped inserting items because quotation id is unavailable (likely missing SELECT RLS policy)')
    }
    
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
  const supabase = createApiClient(request)
    
    // Get authenticated user (match clients API behavior)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    let query = supabase
      .from('quotations')
      .select(`
        *,
        client:clients!quotations_client_id_fkey (
          id,
          first_name,
          last_name,
          company,
          email,
          phone
        ),
        items:quotation_items (
          id,
          description,
          quantity,
          unit_price,
          total,
          item_order
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
        { error: 'Failed to fetch quotations', details: quotationsError.message },
        { status: 500 }
      )
    }

    if (!quotationsError) {
      const count = quotations?.length || 0
      if (count === 0) {
        console.log(`[GET /api/quotations] 0 rows for user ${userId}. RLS active. Policies confirmed. Possible causes: \n` +
          ` - User has no quotations \n` +
          ` - user_id mismatch (check db rows) \n` +
          ` - Policy condition mismatch (auth.uid() vs stored user_id) \n` +
          ` - Using different auth domain / cookie not sent`)
      } else {
        console.log(`[GET /api/quotations] Found ${count} quotations for user ${userId}`)
      }
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