import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching vendor analytics for user:', user.id)

    // Get vendor counts by category
    const { data: categoryStats, error: categoryError } = await supabase
      .from('vendors')
      .select('category')
      .eq('user_id', user.id)

    if (categoryError) {
      console.error('Category stats error:', categoryError)
      return NextResponse.json({ error: 'Failed to fetch category stats' }, { status: 500 })
    }

    // Get vendor counts by status
    const { data: statusStats, error: statusError } = await supabase
      .from('vendors')
      .select('status')
      .eq('user_id', user.id)

    if (statusError) {
      console.error('Status stats error:', statusError)
      return NextResponse.json({ error: 'Failed to fetch status stats' }, { status: 500 })
    }

    // Get top vendors by project count
    const { data: topVendors, error: topVendorsError } = await supabase
      .from('vendors')
      .select(`
        id,
        name,
        category,
        rating,
        vendor_projects:vendor_projects(count)
      `)
      .eq('user_id', user.id)
      .limit(10)

    if (topVendorsError) {
      console.error('Top vendors error:', topVendorsError)
      return NextResponse.json({ error: 'Failed to fetch top vendors' }, { status: 500 })
    }

    // Get recent vendor activity
    const { data: recentVendors, error: recentError } = await supabase
      .from('vendors')
      .select('id, name, category, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Recent vendors error:', recentError)
      return NextResponse.json({ error: 'Failed to fetch recent vendors' }, { status: 500 })
    }

    // Process category statistics
    const categoryMap = (categoryStats || []).reduce((acc, vendor) => {
      const category = vendor.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const categoriesData = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (categoryStats?.length || 1)) * 100)
    }))

    // Process status statistics
    const statusMap = (statusStats || []).reduce((acc, vendor) => {
      const status = vendor.status || 'active'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const statusData = Object.entries(statusMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (statusStats?.length || 1)) * 100)
    }))

    // Process top vendors
    const processedTopVendors = (topVendors || [])
      .map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        rating: vendor.rating || 0,
        projectCount: vendor.vendor_projects?.[0]?.count || 0
      }))
      .sort((a, b) => b.projectCount - a.projectCount)

    // Calculate summary metrics
    const totalVendors = categoryStats?.length || 0
    const activeVendors = statusMap.active || 0
    const averageRating = totalVendors > 0 ? 
      (topVendors || []).reduce((sum, v) => sum + (v.rating || 0), 0) / totalVendors : 0

    const analytics = {
      summary: {
        totalVendors,
        activeVendors,
        inactiveVendors: statusMap.inactive || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        categoriesCount: Object.keys(categoryMap).length
      },
      categories: categoriesData,
      status: statusData,
      topVendors: processedTopVendors,
      recentActivity: recentVendors || []
    }

    console.log('Vendor analytics calculated successfully')

    return NextResponse.json({
      data: analytics,
      message: 'Vendor analytics fetched successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}