import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { orgId, logoUrl, signatureUrl, qrCodeUrl, primaryColor, secondaryColor, quotationTemplate, invoiceTemplate } = body

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Use service key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_KEY!
    
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Upsert branding record with service key (bypasses RLS)
    const { data, error } = await supabase
      .from('branding')
      .upsert({
        organization_id: orgId,
        logo_url: logoUrl || '',
        signature_url: signatureUrl || '',
        qr_code_url: qrCodeUrl || '',
        primary_color: primaryColor || '#3B82F6',
        secondary_color: secondaryColor || '#1E40AF',
        quotation_template: quotationTemplate || 'modern',
        invoice_template: invoiceTemplate || 'modern',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id'
      })
      .select()

    if (error) {
      console.error('Service upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Branding data saved successfully using service key' 
    })
  } catch (error) {
    console.error('Service branding save error:', error)
    return NextResponse.json({ 
      error: 'Failed to save branding data' 
    }, { status: 500 })
  }
}