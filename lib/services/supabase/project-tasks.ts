import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()

export async function addTask(task: Omit<Database['public']['Tables']['project_tasks']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
  return supabase.from('project_tasks').insert([task]).select()
}

export async function listTasksByProject(projectId: string) {
  return supabase.from('project_tasks').select('*').eq('project_id', projectId)
}

export async function updateTaskCompletion(taskId: string, completed: boolean) {
  return supabase
    .from('project_tasks')
    .update({
      status: completed ? 'completed' : 'in_progress',
      completion_percentage: completed ? 100 : 0,
    })
    .eq('id', taskId)
    .select()
}
