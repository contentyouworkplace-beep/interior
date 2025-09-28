import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMockProjectsForMember } from '@/lib/mockProjects'

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

    // First verify the team member exists and belongs to the user
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Try to fetch projects assigned to this team member
    // We'll handle this gracefully in case the tables don't exist yet
    let projects: any[] = []
    
    console.log('Fetching projects for team member:', id)
    
    try {
      // Fetch projects assigned to this team member through project_tasks
      const { data: taskProjects, error: taskError } = await supabase
        .from('project_tasks')
        .select(`
          *,
          projects (
            id,
            name,
            description,
            status,
            start_date,
            end_date,
            created_at
          )
        `)
        .eq('assigned_to', id)

      console.log('project_tasks query result:', { 
        count: taskProjects?.length, 
        error: taskError?.message 
      })

      if (!taskError && taskProjects && taskProjects.length > 0) {
        // Transform task data to project format with assignment details
        projects = taskProjects.map((task: any) => ({
          id: task.projects?.id || task.project_id,
          name: task.projects?.name || 'Unknown Project',
          description: task.projects?.description || task.description || '',
          status: task.projects?.status || task.status,
          start_date: task.projects?.start_date || task.start_date,
          end_date: task.projects?.end_date || task.end_date,
          created_at: task.projects?.created_at || task.created_at,
          // Task-specific details
          task_id: task.id,
          task_name: task.name,
          task_role: task.role,
          task_status: task.status,
          task_priority: task.priority,
          estimated_hours: task.estimated_hours,
          actual_hours: task.actual_hours,
          completion_percentage: task.completion_percentage
        }))
        
        console.log(`✅ Found ${projects.length} real project assignments from database`)
      } else {
        console.log('No project assignments found in database')
        
        // If no assignments found, check if there are any projects at all
        const { data: allProjects, error: allProjectsError } = await supabase
          .from('projects')
          .select('id, name, status, created_at')
          .eq('user_id', user.id)
          .limit(1)

        if (!allProjectsError && allProjects && allProjects.length > 0) {
          console.log('Projects exist but no assignments found - this is normal')
          projects = []
        } else {
          console.log('No projects found at all, using mock data for testing')
          projects = getMockProjectsForMember(id)
        }
      }
    } catch (error) {
      // If project tables don't exist, use mock assignment system
      console.log('Project tables not found or error occurred, using mock assignment system:', error)
      projects = getMockProjectsForMember(id)
    }

    return NextResponse.json({ 
      projects: projects,
      success: true,
      message: `Found ${projects.length} project assignment(s) for team member`
    })
  } catch (error) {
    console.error('Error fetching team member projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}