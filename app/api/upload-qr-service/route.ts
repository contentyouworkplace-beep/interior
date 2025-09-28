import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development for now
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Service uploads disabled in production' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const orgId = formData.get('orgId') as string

    if (!file || !orgId) {
      return NextResponse.json({ error: 'File and organization ID required' }, { status: 400 })
    }

    // Validate file
    if (file.size > 1024 * 1024) { // 1MB
      return NextResponse.json({ error: 'File too large (max 1MB)' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Use service key to upload
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Generate file path
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `qr_codes/${orgId}/${timestamp}-${safeName}`

    // Upload with service key (bypasses RLS)
    const { data, error } = await supabase.storage
      .from('qr-codes')
      .upload(path, file)

    if (error) {
      console.error('Service QR upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(path)

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      path: data.path
    })

  } catch (error) {
    console.error('QR upload service error:', error)
    return NextResponse.json({ 
      error: 'Upload service failed' 
    }, { status: 500 })
  }
}