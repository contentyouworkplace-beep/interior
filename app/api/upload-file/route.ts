import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Upload API called')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const vendorId = formData.get('vendorId') as string
    
    console.log('📋 Request data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      vendorId,
    })
    
    if (!file || !vendorId) {
      console.error('❌ Missing required fields:', { hasFile: !!file, hasVendorId: !!vendorId })
      return NextResponse.json({ 
        error: 'File and vendorId are required' 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = new Date().getTime()
    const fileExt = file.name.split('.').pop() || ''
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '-')
    const fileName = `${timestamp}-${safeFileName}`
    const filePath = `vendors/${vendorId}/${fileName}`

    console.log('📤 Uploading file:', file.name, 'to path:', filePath)

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: `Storage upload failed: ${uploadError.message}` 
      }, { status: 500 })
    }

    console.log('✅ File uploaded successfully:', uploadData)

    // Save file metadata to database
    console.log('💾 Attempting database insert with fields:', {
      vendor_id: vendorId,
      filename: fileName,
      file_name: file.name,
      original_filename: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream'
    })
    
    const { data: dbData, error: dbError } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: vendorId,
        filename: fileName,
        file_name: file.name,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream'
      })
      .select()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      // Try to clean up the uploaded file
      await supabase.storage
        .from('client-files')
        .remove([filePath])
      
      return NextResponse.json({ 
        error: `Database error: ${dbError.message}` 
      }, { status: 500 })
    }

    console.log('✅ File metadata saved successfully')

    return NextResponse.json({ 
      success: true,
      data: {
        file_path: filePath,
        file_name: file.name,
        file_size: file.size
      }
    })

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: error.message || 'Unexpected error occurred' 
    }, { status: 500 })
  }
}