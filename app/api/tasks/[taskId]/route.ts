import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { setTaskCompletion } from '@/lib/task-storage'

// PATCH: Update a task (mainly for toggling completion status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { completed } = body
    const { taskId } = params

    // Store completion state in shared memory
    setTaskCompletion(taskId, completed)

    console.log(`Task ${taskId} updated to completed: ${completed}`)
    
    return NextResponse.json({
      task: {
        id: taskId,
        completed: completed,
        updated_at: new Date().toISOString()
      },
      success: true
    })

  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}