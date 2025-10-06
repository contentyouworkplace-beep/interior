import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type TaskType = 'meeting' | 'deadline' | 'personal' | 'call'

const ALLOWED_TASK_TYPES: TaskType[] = ['meeting', 'deadline', 'personal', 'call']
function normalizeTaskType(t?: string | null): TaskType {
  if (!t) return 'personal'
  const v = String(t).toLowerCase().trim()
  if (v === 'task') return 'personal'
  return (ALLOWED_TASK_TYPES.includes(v as TaskType) ? (v as TaskType) : 'personal')
}

// Helper to format HH:MM:SS to HH:MM AM/PM
function formatTimeToDisplay(t?: string | null) {
  if (!t) return ''
  // Expecting 'HH:MM' or 'HH:MM:SS'
  const [hh, mm] = t.split(':')
  let h = Number(hh)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mm} ${ampm}`
}

// Parse time from either 'HH:MM' or 'HH:MM AM/PM' into 'HH:MM:SS'
function parseIncomingTime(time: string): string | null {
  if (!time) return null
  const ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10)
    const m = ampmMatch[2]
    const mer = ampmMatch[3].toUpperCase()
    if (mer === 'PM' && h < 12) h += 12
    if (mer === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}:00`
  }
  const simple = time.match(/^(\d{2}):(\d{2})$/)
  if (simple) {
    return `${simple[1]}:${simple[2]}:00`
  }
  return null
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

    // Fetch tasks for this user and date from Supabase
    const { data, error } = await supabase
      .from('tasks')
      .select('id,title,scheduled_time,type,completed')
      .eq('user_id', user.id)
      .eq('scheduled_date', date)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Tasks query error:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    const tasks = (data || []).map(t => ({
      id: t.id,
      title: t.title,
      time: formatTimeToDisplay(t.scheduled_time as unknown as string),
      type: normalizeTaskType(t.type as unknown as string),
      completed: !!t.completed
    }))

    return NextResponse.json({ tasks, success: true })

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
  const { title, time, date, type = 'personal' } = body

    // Validate required fields
    if (!title || !time || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, time, date' },
        { status: 400 }
      )
    }

    // Convert time to DB format
    const dbTime = parseIncomingTime(time)

    const insertPayload = {
      title,
      scheduled_date: date,
      scheduled_time: dbTime,
      type: normalizeTaskType(type),
      completed: false,
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertPayload)
      .select('id,title,scheduled_time,type,completed')
      .single()

    if (error) {
      console.error('Create task insert error:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    const created = {
      id: data.id,
      title: data.title,
      time: formatTimeToDisplay(data.scheduled_time as unknown as string),
      type: (data.type || 'personal') as 'meeting' | 'deadline' | 'personal' | 'call',
      completed: !!data.completed
    }

    return NextResponse.json({ task: created, success: true })

  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}