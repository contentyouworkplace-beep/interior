import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('PUT plan API called for ID:', params.id)
    const { id } = params
    const updateData = await request.json()
    console.log('Update data received:', updateData)
    
    const adminClient = createAdminClient()
    
    // First check if the plan exists
    const { data: existingPlan, error: fetchError } = await adminClient
      .from('plans')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingPlan) {
      console.error('Plan not found:', fetchError)
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    console.log('Existing plan:', existingPlan)
    
    // Extract only the fields that should be updated
    const allowedFields = [
      'name', 'description', 'price', 'duration_days', 
      'features', 'max_projects', 'max_users', 'support_level', 'is_active'
    ]
    
    const cleanUpdateData: any = {}
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        cleanUpdateData[field] = updateData[field]
      }
    })
    
    cleanUpdateData.updated_at = new Date().toISOString()
    
    console.log('Clean update data:', cleanUpdateData)
    
    const { data, error } = await adminClient
      .from('plans')
      .update(cleanUpdateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating plan:', error)
      return NextResponse.json(
        { error: `Failed to update plan: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Plan updated successfully:', data)
    return NextResponse.json({
      message: 'Plan updated successfully',
      plan: data
    })
  } catch (error) {
    console.error('Error in plan update API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('DELETE plan API called for ID:', params.id)
    const { id } = params
    
    const adminClient = createAdminClient()
    
    // First check if the plan exists
    const { data: existingPlan, error: fetchError } = await adminClient
      .from('plans')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingPlan) {
      console.error('Plan not found:', fetchError)
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    console.log('Found plan to delete:', existingPlan)
    
    // Check if plan is being used by any users
    const { data: subscriptions, error: checkError } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('plan_id', id)
      .limit(1)

    if (checkError) {
      console.error('Error checking plan usage:', checkError)
      // Continue with deletion even if subscriptions table doesn't exist
      console.log('Subscriptions table may not exist, continuing with deletion')
    }

    if (subscriptions && subscriptions.length > 0) {
      console.log('Plan is in use by subscriptions')
      return NextResponse.json(
        { error: 'Cannot delete plan that is currently assigned to users. Please reassign users first.' },
        { status: 400 }
      )
    }

    console.log('Attempting to delete plan:', id)
    const { error: deleteError } = await adminClient
      .from('plans')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting plan:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete plan: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('Plan deleted successfully')
    return NextResponse.json({
      message: 'Plan deleted successfully'
    })
  } catch (error) {
    console.error('Error in plan deletion API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}