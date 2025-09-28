import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.vendorId
    console.log('Fetching files for vendor:', vendorId, 'user:', user.id)

    // First verify the vendor belongs to the user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get files for this vendor
    const { data: files, error } = await supabase
      .from('vendor_files')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
    }

    console.log(`Found ${files?.length || 0} files for vendor`)

    return NextResponse.json({
      files: files || [],
      count: files?.length || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.vendorId
    const body = await request.json()

    console.log('Creating file record for vendor:', vendorId, 'file:', body.filename)

    // First verify the vendor belongs to the user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Validate required fields
    const { filename, original_filename, file_path, file_size, mime_type } = body
    if (!filename || !original_filename || !file_path || !file_size || !mime_type) {
      return NextResponse.json(
        { error: 'Missing required file fields' }, 
        { status: 400 }
      )
    }

    // Prepare file data
    const fileData = {
      vendor_id: vendorId,
      user_id: user.id,
      filename: filename.trim(),
      original_filename: original_filename.trim(),
      file_path: file_path.trim(),
      file_size: parseInt(file_size),
      mime_type: mime_type.trim(),
      category: body.category?.trim() || 'general',
      description: body.description?.trim() || '',
    }

    // Insert file record
    const { data: file, error } = await supabase
      .from('vendor_files')
      .insert([fileData])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 })
    }

    console.log('File record created successfully:', file.id)

    return NextResponse.json({
      data: file,
      message: 'File record created successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.vendorId
    const url = new URL(request.url)
    const fileId = url.searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    console.log('Deleting file:', fileId, 'for vendor:', vendorId)

    // Delete file record (user must own both the vendor and the file)
    const { error } = await supabase
      .from('vendor_files')
      .delete()
      .eq('id', fileId)
      .eq('vendor_id', vendorId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    console.log('File deleted successfully')

    return NextResponse.json({
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}