import { NextRequest, NextResponse } from 'next/server'
import { isSuperAdmin } from '@/lib/auth/isSuperAdmin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const allowed = await isSuperAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createClient() as any
  const { data, error } = await supabase
    .from('licenses')
    .select('*, subscription_plans(*), organizations(name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ licenses: data ?? [] })
}

export async function POST(request: NextRequest) {
  const allowed = await isSuperAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createClient() as any
  const body = await request.json()
  const { organization_id, plan_code, starts_on, ends_on, amount_cents = 0, currency = 'INR', sales_city, sales_rep, channel, status = 'active' } = body || {}
  if (!organization_id || !plan_code) return NextResponse.json({ error: 'organization_id and plan_code are required' }, { status: 400 })

  const { data: plan, error: planErr } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('code', plan_code)
    .maybeSingle()
  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })
  if (!plan) return NextResponse.json({ error: `Plan not found: ${plan_code}` }, { status: 400 })

  const { data, error } = await supabase
    .from('licenses')
    .insert({
      organization_id,
      plan_id: plan.id,
      starts_on, ends_on, amount_cents, currency, sales_city, sales_rep, channel, status
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ license: data })
}

export async function PUT(request: NextRequest) {
  const allowed = await isSuperAdmin()
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createClient() as any
  const body = await request.json()
  const { id, ...updates } = body || {}
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('licenses')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ license: data })
}
