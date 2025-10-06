import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get all users with metadata
    const { data: authData } = await supabase.auth.admin.listUsers()
    const allUsers = authData?.users || []

    // Get organizations
    const { data: organizations } = await supabase
      .from('organizations')
      .select('*')

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')

    // Get organization members for proper user-org linking
    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')

    // Get plans
    const { data: plans } = await supabase
      .from('plans')
      .select('*')

    // Calculate total users (this month vs last month)
    const thisMonthUsers = allUsers.filter(u => 
      new Date(u.created_at) >= startOfMonth
    ).length
    const lastMonthUsers = allUsers.filter(u => 
      new Date(u.created_at) >= startOfLastMonth && 
      new Date(u.created_at) <= endOfLastMonth
    ).length
    const userGrowth = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : 0

    // Calculate revenue from real data
    let thisMonthRevenue = 0
    let lastMonthRevenue = 0
    let totalRevenue = 0
    let upcomingRenewals = 0
    let renewalsRevenue = 0

    allUsers.forEach(user => {
      const planId = user.user_metadata?.plan_id
      const expiresAt = user.user_metadata?.expires_at
      const plan = plans?.find(p => p.id === planId)
      const userCreatedAt = new Date(user.created_at)
      
      if (plan && plan.price) {
        totalRevenue += plan.price
        
        // If user created this month, add to this month revenue
        if (userCreatedAt >= startOfMonth) {
          thisMonthRevenue += plan.price
        }
        
        // If user created last month, add to last month revenue
        if (userCreatedAt >= startOfLastMonth && userCreatedAt <= endOfLastMonth) {
          lastMonthRevenue += plan.price
        }
        
        // Check if renewal is in next 7 days
        if (expiresAt) {
          const expiry = new Date(expiresAt)
          if (expiry >= now && expiry <= next7Days) {
            upcomingRenewals++
            renewalsRevenue += plan.price
          }
        }
      }
    })

    // Calculate real revenue growth based on actual last month revenue
    const revenueGrowth = lastMonthRevenue > 0
      ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : thisMonthRevenue > 0 ? 100 : 0

    // Get projects (mock data structure)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, created_at, organization_id, name, status')
      .order('created_at', { ascending: false })

    // Get invoices/quotations if tables exist
    const { data: quotations } = await supabase
      .from('quotations')
      .select('id, created_at, organization_id')
      .gte('created_at', startOfMonth.toISOString())

    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, created_at, organization_id')
      .gte('created_at', startOfMonth.toISOString())

    // Projects by month (last 6 months)
    const projectsByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const count = projects?.filter(p => {
        const created = new Date(p.created_at)
        return created >= monthStart && created <= monthEnd
      }).length || 0
      
      projectsByMonth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count
      })
    }

    // Recent activities (last 50)
    const recentActivities = []
    
    // New signups
    const recentSignups = allUsers
      .filter(u => new Date(u.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      .slice(0, 10)
      .map(u => ({
        type: 'signup',
        user: u.email,
        description: 'New user registered',
        timestamp: u.created_at,
        icon: 'user-plus'
      }))

    // Recent projects
    const recentProjects = (projects || [])
      .slice(0, 10)
      .map(p => ({
        type: 'project',
        user: 'System',
        description: `Project "${p.name}" created`,
        timestamp: p.created_at,
        icon: 'folder'
      }))

    recentActivities.push(...recentSignups, ...recentProjects)
    recentActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // User activity by company - using organization_members table
    const userActivity = allUsers.map(user => {
      const profile = profiles?.find(p => p.id === user.id)
      const memberRecord = orgMembers?.find(m => m.user_id === user.id)
      const org = organizations?.find(o => o.id === memberRecord?.organization_id)
      const userProjects = projects?.filter(p => p.organization_id === memberRecord?.organization_id) || []
      
      return {
        id: user.id,
        email: user.email,
        company: org?.name || 'N/A',
        lastLogin: user.last_sign_in_at,
        projectsCount: userProjects.length,
        storageUsed: '0 MB', // TODO: Integrate with Supabase Storage API
        status: user.user_metadata?.expires_at && 
                new Date(user.user_metadata.expires_at) > now ? 'active' : 'expired'
      }
    })

    // Feature usage stats
    const featureUsage = {
      projects: projects?.length || 0,
      quotations: quotations?.length || 0,
      invoices: invoices?.length || 0,
      activeUsers: allUsers.filter(u => u.last_sign_in_at).length
    }

    return NextResponse.json({
      kpis: {
        totalUsers: allUsers.length,
        userGrowth: parseFloat(userGrowth as string),
        totalRevenue,
        monthlyRevenue: thisMonthRevenue,
        revenueGrowth: parseFloat(revenueGrowth as string),
        thisMonthRevenue,
        upcomingRenewals,
        renewalsRevenue
      },
      charts: {
        projectsByMonth,
        quotationsByMonth: quotations?.length || 0,
        invoicesByMonth: invoices?.length || 0,
        featureUsage
      },
      activities: recentActivities.slice(0, 20),
      userActivity: userActivity.slice(0, 50),
      systemStats: {
        totalOrganizations: organizations?.length || 0,
        totalProjects: projects?.length || 0,
        activeSubscriptions: allUsers.filter(u => 
          u.user_metadata?.expires_at && 
          new Date(u.user_metadata.expires_at) > now
        ).length
      }
    })
  } catch (error) {
    console.error('Overview API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    )
  }
}
