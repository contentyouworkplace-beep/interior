import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminUserServer } from '@/lib/admin/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // For now, skip admin check in development
    // const isAdmin = await isAdminUserServer()
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get active users (signed in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const activeUsers = authUsers?.users.filter(user => 
      user.last_sign_in_at && new Date(user.last_sign_in_at) > new Date(thirtyDaysAgo)
    ).length || 0
    
    // Get total organizations
    const { count: totalOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
    
    // Calculate revenue (mock data for now)
    const revenue = (totalUsers || 0) * 1500 // Average ₹1500 per user
    
    return NextResponse.json({
      total_users: totalUsers || 0,
      active_users: activeUsers,
      total_organizations: totalOrganizations || 0,
      revenue
    })
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}