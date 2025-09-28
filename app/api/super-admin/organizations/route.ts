import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth/isSuperAdmin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const allowed = await isSuperAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createClient() as any
  const { data, error } = await supabase
    .from('orgs_with_license')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ organizations: data ?? [] })
}

export async function POST(request: NextRequest) {
  const allowed = await isSuperAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createClient() as any
  const body = await request.json()
  const { name, description, plan_code = 'STARTER', starts_on, ends_on, amount_cents = 0, currency = 'INR', sales_city, sales_rep, channel } = body || {}

  if (!name) return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })

  // Create organization
  const { data: org, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name, description })
    .select('*')
    .single()

  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })

  // Get plan
  const { data: plan, error: planErr } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('code', plan_code)
    .maybeSingle()

  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })
  if (!plan) return NextResponse.json({ error: `Plan not found: ${plan_code}` }, { status: 400 })

  // Create license
  const { data: license, error: licErr } = await supabase
    .from('licenses')
    .insert({
      organization_id: org.id,
      plan_id: plan.id,
      status: 'active',
      starts_on: starts_on ?? new Date().toISOString().slice(0, 10),
      ends_on,
      amount_cents,
      currency,
      sales_city,
      sales_rep,
      channel
    })
    .select('*')
    .single()

  if (licErr) return NextResponse.json({ error: licErr.message }, { status: 500 })

  return NextResponse.json({ organization: org, license })
}
