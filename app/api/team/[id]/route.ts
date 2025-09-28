import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch specific team member
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      data: teamMember,
      message: 'Team member fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await request.json()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    const { name, email, phone, role, status, monthly_salary } = body
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    // Update team member
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .update({
        name,
        email,
        phone,
        role,
        status,
        salary: monthly_salary, // Map monthly_salary to existing salary column
        advance_salary: body.advance_salary, // Add advance_salary support
        notes: body.notes, // Add notes support
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: teamMember,
      message: 'Team member updated successfully'
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id } = params

    console.log('Attempting to delete team member with ID:', id)

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // First check if the team member exists
    const { data: existingMember, error: checkError } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError) {
      console.error('Error checking team member existence:', checkError)
      if (checkError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('Found team member to delete:', existingMember)

    // FORCE DELETE: Unassign from all related tables before deletion
    let tasksUnassigned = 0
    
    try {
      // Unassign from project_tasks if table exists
      const { data: assignedTasks, error: taskCheckError } = await supabase
        .from('project_tasks')
        .select('id, title')
        .eq('assigned_to', id)

      if (!taskCheckError && assignedTasks && assignedTasks.length > 0) {
        console.log(`Team member has ${assignedTasks.length} assigned tasks, force unassigning them`)
        
        const { error: unassignError } = await supabase
          .from('project_tasks')
          .update({ assigned_to: null })
          .eq('assigned_to', id)

        if (!unassignError) {
          tasksUnassigned = assignedTasks.length
          console.log('Successfully force unassigned all tasks')
        } else {
          console.error('Error unassigning tasks:', unassignError)
        }
      }
    } catch (taskError) {
      console.log('No project_tasks table or different structure, continuing with deletion')
    }

    try {
      // Also try to unassign from any other tables that might reference this team member
      // Since we don't know the exact schema, we'll skip direct project updates for now
      console.log('Skipping direct project assignments cleanup - not applicable')
    } catch (projectError) {
      console.log('No direct project assignments or different structure')
    }

    // FORCE DELETE: Now delete the team member regardless of any remaining constraints
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      
      // If it's still a foreign key constraint, try to handle other possible references
      if (deleteError.code === '23503') {
        console.log('Foreign key constraint detected, attempting to clean up all references')
        
        // Try to clean up any other possible references
        try {
          // You can add more cleanup operations here for other tables that might reference team_members
          // For now, return a more helpful error
          return NextResponse.json({ 
            error: 'Cannot force delete: Team member has references in other parts of the system. Please contact support.' 
          }, { status: 409 })
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError)
        }
      }
      
      return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
    }

    console.log('Team member force deleted successfully')

    return NextResponse.json({ 
      message: tasksUnassigned > 0 
        ? `Team member deleted successfully. ${tasksUnassigned} task(s) were unassigned.`
        : 'Team member deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}