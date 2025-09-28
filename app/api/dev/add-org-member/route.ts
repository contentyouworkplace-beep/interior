import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { organization_id, user_id, role } = body
    if (!organization_id || !user_id) {
      return NextResponse.json({ success: false, error: 'organization_id and user_id required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('organization_members')
      .upsert({ organization_id, user_id, role: role || 'admin' }, { onConflict: 'organization_id,user_id' })
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 })
  }
}
