import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { organization_id } = body
    if (!organization_id) {
      return NextResponse.json({ success: false, error: 'organization_id required' }, { status: 400 })
    }

    const supabase = createClient()

    const profile = {
      organization_id,
      company_name: 'Demo Company',
      company_tagline: 'Demo Tagline',
      gstin: '27ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      phone: '9876543210',
      email: 'demo@company.com',
      address: '221B Baker Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400001',
      website: 'https://demo.company',
      cin: 'U12345MH2025PTC123456'
    }

    const banking = {
      organization_id,
      bank_name: 'HDFC Bank',
      account_number: '123456789012',
      ifsc_code: 'HDFC0001234'
    }

    const branding = {
      organization_id,
      logo_url: '',
      signature_url: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      quotation_template: 'corporate',
      invoice_template: 'premium'
    }

    const [{ error: pErr }, { error: bErr }, { error: brErr }] = await Promise.all([
      supabase.from('company_profiles').upsert(profile as any),
      supabase.from('banking_info').upsert(banking as any),
      supabase.from('branding').upsert(branding as any)
    ])

    if (pErr || bErr || brErr) {
      const firstErr = pErr || bErr || brErr
      return NextResponse.json({ success: false, error: firstErr?.message || 'Unknown error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Seeded company settings', data: { profile, banking, branding } })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}
