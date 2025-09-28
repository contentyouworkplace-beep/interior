import { createApiClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.log('Authenticated user:', user.id)
    
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    console.log('Fetching company settings for orgId:', orgId)

    // Fetch all company data in parallel
    const [profileRes, bankingRes, brandingRes] = await Promise.all([
      supabase.from('company_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
      supabase.from('banking_info').select('*').eq('organization_id', orgId).maybeSingle(),
      supabase.from('branding').select('*').eq('organization_id', orgId).maybeSingle(),
    ])

    console.log('Profile result:', profileRes)
    console.log('Banking result:', bankingRes)
    console.log('Branding result:', brandingRes)

    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileRes.error)
      return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 })
    }

    if (bankingRes.error && bankingRes.error.code !== 'PGRST116') {
      console.error('Banking fetch error:', bankingRes.error)
      return NextResponse.json({ error: 'Failed to fetch banking info' }, { status: 500 })
    }

    if (brandingRes.error && brandingRes.error.code !== 'PGRST116') {
      console.error('Branding fetch error:', brandingRes.error)
      return NextResponse.json({ error: 'Failed to fetch branding info' }, { status: 500 })
    }

    const data = {
      profile: profileRes.data,
      banking: bankingRes.data,
      branding: brandingRes.data
    }

    console.log('Returning company settings:', data)

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Company settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    console.log('Authenticated user for POST:', user.id)
    
    const body = await request.json()
    const { orgId, profile, banking, branding } = body

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    console.log('Updating company settings for orgId:', orgId)
    console.log('Received data:', { profile, banking, branding })

    const updates = []

    // Helper: check if an object has at least one non-empty value
    const hasMeaningfulKeys = (obj: Record<string, any> | null | undefined) => {
      if (!obj) return false
      return Object.values(obj).some((v) => {
        if (v === undefined || v === null) return false
        if (typeof v === 'string') return v.trim() !== ''
        return true
      })
    }

    // Update company profile if provided and has meaningful keys
    if (profile && hasMeaningfulKeys(profile)) {
      const profileData: Record<string, any> = {
        organization_id: orgId,
        updated_at: new Date().toISOString()
      }

      // Only assign keys that are actually provided (avoid defaulting to empty strings)
      const allowedProfileKeys = [
        'company_name', 'company_tagline', 'gstin', 'pan', 'phone', 'email',
        'address', 'city', 'state', 'pin_code', 'website', 'cin', 'terms_and_conditions'
      ]
      allowedProfileKeys.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(profile, k)) {
          profileData[k] = profile[k]
        }
      })

      console.log('Upserting profile data:', profileData)

      const { error: profileError } = await supabase
        .from('company_profiles')
        .upsert(profileData as any)

      if (profileError) {
        console.error('Profile upsert error:', profileError)
        throw new Error(`Failed to update company profile: ${profileError.message}`)
      }
      updates.push('profile')
    }

    // Update banking info if provided
    if (banking && hasMeaningfulKeys(banking)) {
      const bankingData: Record<string, any> = {
        organization_id: orgId,
        updated_at: new Date().toISOString()
      }

      const allowedBankingKeys = ['bank_name', 'account_number', 'ifsc_code']
      allowedBankingKeys.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(banking, k)) {
          bankingData[k] = banking[k]
        }
      })

      console.log('Upserting banking data:', bankingData)

      const { error: bankingError } = await supabase
        .from('banking_info')
        .upsert(bankingData as any)

      if (bankingError) {
        console.error('Banking upsert error:', bankingError)
        throw new Error(`Failed to update banking info: ${bankingError.message}`)
      }
      updates.push('banking')
    }

    // Update branding info if provided
    if (branding && hasMeaningfulKeys(branding)) {
      const brandingData: Record<string, any> = {
        organization_id: orgId,
        updated_at: new Date().toISOString()
      }

      const allowedBrandingKeys = [
        'logo_url', 'signature_url', 'qr_code_url', 'primary_color', 'secondary_color',
        'quotation_template', 'invoice_template'
      ]
      allowedBrandingKeys.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(branding, k)) {
          brandingData[k] = branding[k]
        }
      })

      console.log('Upserting branding data:', brandingData)

      const { error: brandingError } = await supabase
        .from('branding')
        .upsert(brandingData as any)

      if (brandingError) {
        console.error('Branding upsert error:', brandingError)
        console.log('Attempting to use service key fallback...')
        
        // Try using service key as fallback
        try {
          const serviceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dev/save-branding-service`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orgId,
              logoUrl: brandingData.logo_url,
              signatureUrl: brandingData.signature_url,
              qrCodeUrl: brandingData.qr_code_url,
              primaryColor: brandingData.primary_color,
              secondaryColor: brandingData.secondary_color,
              quotationTemplate: brandingData.quotation_template,
              invoiceTemplate: brandingData.invoice_template
            })
          })
          
          const serviceResult = await serviceResponse.json()
          if (!serviceResult.success) {
            throw new Error(serviceResult.error)
          }
          console.log('Service key fallback successful')
        } catch (serviceError) {
          console.error('Service key fallback also failed:', serviceError)
          throw new Error(`Failed to update branding info: ${brandingError.message}`)
        }
      }
      updates.push('branding')
    }

    console.log('Successfully updated:', updates.join(', '))

    // Fetch the updated data to return
    const [updatedProfile, updatedBanking, updatedBranding] = await Promise.all([
      supabase.from('company_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
      supabase.from('banking_info').select('*').eq('organization_id', orgId).maybeSingle(),
      supabase.from('branding').select('*').eq('organization_id', orgId).maybeSingle(),
    ])

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.join(', ')} successfully`,
      data: {
        profile: updatedProfile.data,
        banking: updatedBanking.data,
        branding: updatedBranding.data
      }
    })

  } catch (error: any) {
    console.error('Company settings POST error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to update company settings' 
    }, { status: 500 })
  }
}