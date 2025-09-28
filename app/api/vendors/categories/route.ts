import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching vendor categories for user:', user.id)

    // Get all unique categories with vendor counts
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('category')
      .eq('user_id', user.id)

    if (vendorsError) {
      console.error('Vendors error:', vendorsError)
      return NextResponse.json({ error: 'Failed to fetch vendor categories' }, { status: 500 })
    }

    // Process categories
    const categoryMap = (vendors || []).reduce((acc, vendor) => {
      const category = vendor.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Default categories if none exist
    const defaultCategories = [
      'Contractor',
      'Supplier',
      'Designer',
      'Electrician',
      'Plumber',
      'Painter',
      'Carpenter',
      'Other'
    ]

    // Combine existing categories with defaults
    const allCategories = new Set([
      ...Object.keys(categoryMap),
      ...defaultCategories
    ])

    const categories = Array.from(allCategories).map(category => ({
      name: category,
      count: categoryMap[category] || 0,
      isDefault: defaultCategories.includes(category)
    })).sort((a, b) => {
      // Sort by count descending, then by name
      if (a.count !== b.count) {
        return b.count - a.count
      }
      return a.name.localeCompare(b.name)
    })

    console.log('Vendor categories fetched successfully:', categories.length)

    return NextResponse.json({
      data: categories,
      message: 'Vendor categories fetched successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}