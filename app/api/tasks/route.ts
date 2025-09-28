import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAllCompletionStates, addCustomTask, getCustomTasks } from '@/lib/task-storage'

// Type definition for base tasks
interface BaseTask {
  title: string
  time: string
  type: string
}

// Function to generate different mock tasks based on the date
function generateMockTasks(date: string) {
  const dateObj = new Date(date)
  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, etc.
  const dayOfMonth = dateObj.getDate()
  
  // Get current completion states
  const completionStates = getAllCompletionStates()
  
  let baseTasks: BaseTask[] = []
  
  // Different tasks based on day of week
  switch (dayOfWeek) {
    case 1: // Monday
      baseTasks = [
        { title: 'Team standup meeting', time: '09:00 AM', type: 'meeting' },
        { title: 'Review weekly project goals', time: '10:30 AM', type: 'task' },
        { title: 'Client requirements gathering', time: '02:00 PM', type: 'client' },
        { title: 'Design concept sketches', time: '04:00 PM', type: 'design' }
      ]
      break
    case 2: // Tuesday
      baseTasks = [
        { title: 'Material sourcing research', time: '09:30 AM', type: 'task' },
        { title: 'Vendor quotes review', time: '11:00 AM', type: 'vendor' },
        { title: 'Project timeline update', time: '01:30 PM', type: 'project' },
        { title: 'Budget analysis', time: '03:30 PM', type: 'finance' }
      ]
      break
    case 3: // Wednesday
      baseTasks = [
        { title: 'Site visit - Oak Avenue', time: '10:00 AM', type: 'site' },
        { title: 'Measurement verification', time: '11:30 AM', type: 'task' },
        { title: 'Design presentation prep', time: '02:30 PM', type: 'design' },
        { title: 'Client feedback review', time: '04:30 PM', type: 'client' }
      ]
      break
    case 4: // Thursday
      baseTasks = [
        { title: 'CAD drawing updates', time: '09:00 AM', type: 'design' },
        { title: '3D rendering session', time: '11:00 AM', type: 'design' },
        { title: 'Material samples delivery', time: '01:00 PM', type: 'vendor' },
        { title: 'Project status meeting', time: '03:00 PM', type: 'meeting' }
      ]
      break
    case 5: // Friday
      baseTasks = [
        { title: 'Week review & planning', time: '09:30 AM', type: 'task' },
        { title: 'Invoice processing', time: '11:00 AM', type: 'finance' },
        { title: 'Client presentation', time: '02:00 PM', type: 'client' },
        { title: 'Team wrap-up meeting', time: '04:00 PM', type: 'meeting' }
      ]
      break
    case 6: // Saturday
      baseTasks = [
        { title: 'Showroom visits', time: '10:00 AM', type: 'vendor' },
        { title: 'Inspiration research', time: '12:00 PM', type: 'design' },
        { title: 'Portfolio updates', time: '02:00 PM', type: 'task' }
      ]
      break
    case 0: // Sunday
      baseTasks = [
        { title: 'Week ahead planning', time: '10:00 AM', type: 'task' },
        { title: 'Design trends research', time: '12:00 PM', type: 'design' },
        { title: 'Admin tasks cleanup', time: '02:00 PM', type: 'task' }
      ]
      break
  }
  
  // Add date-specific variation using day of month
  const variations = [
    'Review project deadlines',
    'Update client communications',
    'Organize design assets',
    'Schedule contractor meetings',
    'Prepare cost estimates'
  ]
  
  if (dayOfMonth % 3 === 0) {
    baseTasks.push({
      title: variations[dayOfMonth % variations.length],
      time: '05:00 PM',
      type: 'task'
    })
  }
  
  // Convert to proper task format with unique IDs and apply completion states
  const mockTasks = baseTasks.map((task, index) => {
    const taskId = `${date}-${index}`
    return {
      id: taskId,
      title: task.title,
      time: task.time,
      type: task.type,
      completed: completionStates[taskId] || false,
      date: date
    }
  })

  // Get custom tasks for this date and merge them
  const customTasksForDate = getCustomTasks(date)
  
  // Combine mock tasks with custom tasks
  return [...mockTasks, ...customTasksForDate]
}

// GET: Fetch tasks by date
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get date from query params (default to today)
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Generate date-specific mock tasks
    const mockTasks = generateMockTasks(date)

    return NextResponse.json({
      tasks: mockTasks,
      success: true
    })

  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST: Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, time, date, type = 'task' } = body

    // Validate required fields
    if (!title || !time || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, time, date' },
        { status: 400 }
      )
    }

    // Add the custom task to storage
    const taskId = addCustomTask({
      title,
      time,
      date,
      type,
      completed: false
    })
    
    // Create response task object
    const newTask = {
      id: taskId,
      title,
      time,
      date,
      type,
      completed: false,
      created_at: new Date().toISOString(),
      user_id: user.id
    }

    console.log('✅ Debug Bot: Created new task successfully:', newTask)

    return NextResponse.json({
      task: newTask,
      success: true
    })

  } catch (error) {
    console.error('❌ Debug Bot: Create task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}