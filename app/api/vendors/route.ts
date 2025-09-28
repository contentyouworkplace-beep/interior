import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching vendors for auth ID:', user.id)

    // For development, temporarily get all vendors without user_id filter
    let query = supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: vendors, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
    }

    console.log(`Found ${vendors?.length || 0} vendors`)

    return NextResponse.json({ 
      data: vendors || [],
      message: 'Vendors fetched successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Creating vendor for user:', user.id)
    console.log('Vendor data:', body)

    // Validate required fields
    const { name, category } = body
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' }, 
        { status: 400 }
      )
    }

    // Prepare vendor data
    const vendorData = {
      user_id: user.id,
      name: name.trim(),
      category: category.trim(),
      contact_person: body.contact_person?.trim() || '',
      phone: body.phone?.trim() || '',
      email: body.email?.trim() || '',
      address: body.address?.trim() || '',
      gstin: body.gstin?.trim() || '',
      rating: body.rating ? parseFloat(body.rating) : null,
      status: body.status || 'active',
      notes: body.notes?.trim() || '',
    }

    // Insert vendor
    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
    }

    console.log('Vendor created successfully:', vendor.id)

    return NextResponse.json({
      data: vendor,
      message: 'Vendor created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, ...updateData } = body

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    console.log('Updating vendor:', id, 'for user:', user.id)

    // Prepare update data to match actual table schema
    const cleanUpdateData = {
      name: updateData.name?.trim(),
      contact_person: updateData.contact_person?.trim() || null,
      category: updateData.category?.trim() || null,
      email: updateData.email?.trim() || null,
      phone: updateData.phone?.trim() || null,
      whatsapp_number: updateData.whatsapp_number?.trim() || null,
      address: updateData.address?.trim() || null,
      city: updateData.city?.trim() || null,
      notes: updateData.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    // Remove undefined values
    Object.keys(cleanUpdateData).forEach(key => {
      if ((cleanUpdateData as any)[key] === undefined) {
        delete (cleanUpdateData as any)[key]
      }
    })

    // Update vendor
    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(cleanUpdateData)
      .eq('id', id)
      // Temporarily removed user_id filter for development
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 })
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found or unauthorized' }, { status: 404 })
    }

    console.log('Vendor updated successfully:', vendor.id)

    return NextResponse.json({
      data: vendor,
      message: 'Vendor updated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    console.log('Deleting vendor:', id, 'for user:', user.id)

    // Delete vendor (cascade will handle related records)
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this vendor

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 })
    }

    console.log('Vendor deleted successfully:', id)

    return NextResponse.json({
      message: 'Vendor deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}