import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()

type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type Project = Database['public']['Tables']['projects']['Row']
type TeamAssignmentInput = {
  team_member_id: string
  role?: string | null
  is_manager?: boolean
}
type PhaseInput = {
  name: string
  description?: string | null
  position?: number
  start_date?: string | null
  end_date?: string | null
}

export interface CreateProjectPayload {
  project: Omit<ProjectInsert, 'id' | 'completion_percentage' | 'created_at' | 'updated_at'> & { completion_percentage?: number }
  team?: TeamAssignmentInput[]
  phases?: PhaseInput[]
}

export interface CreateProjectResult {
  project: Project
  team?: Database['public']['Tables']['project_team_members']['Row'][]
  phases?: Database['public']['Tables']['project_phases']['Row'][]
}

/**
 * Creates a project along with optional team assignments & phases.
 * Since Supabase JS client has no multi-statement transaction at this layer,
 * we simulate a best-effort transaction: if a later step fails we attempt cleanup.
 * For stricter guarantees, promote this to a Postgres RPC / SQL function later.
 */
export async function createProjectWithRelations(payload: CreateProjectPayload): Promise<CreateProjectResult> {
  const { project, team = [], phases = [] } = payload

  // 1. Insert base project
  const { data: projectRows, error: projectError } = await supabase
    .from('projects')
    .insert([{ ...project, completion_percentage: project.completion_percentage ?? 0 }])
    .select()
    .limit(1)

  if (projectError || !projectRows || projectRows.length === 0) {
    throw projectError || new Error('Project insert failed')
  }
  const createdProject = projectRows[0]

  let insertedTeam: CreateProjectResult['team'] = []
  let insertedPhases: CreateProjectResult['phases'] = []

  try {
    // 2. Insert team assignments (if any)
    if (team.length > 0) {
      const teamRecords = team.map(t => ({
        user_id: createdProject.user_id,
        project_id: createdProject.id,
        team_member_id: t.team_member_id,
        role: t.role ?? null,
        is_manager: t.is_manager ?? false
      }))
      const { data, error } = await supabase
        .from('project_team_members')
        .insert(teamRecords)
        .select()
      if (error) throw error
      insertedTeam = data || []
    }

    // 3. Insert phases (if any)
    if (phases.length > 0) {
      const sorted = phases
        .map((p, idx) => ({
          user_id: createdProject.user_id,
            project_id: createdProject.id,
          name: p.name,
          description: p.description ?? null,
          position: p.position ?? idx,
          status: 'pending',
          start_date: p.start_date ?? null,
          end_date: p.end_date ?? null
        }))
        .sort((a, b) => a.position - b.position)
      const { data, error } = await supabase
        .from('project_phases')
        .insert(sorted)
        .select()
      if (error) throw error
      insertedPhases = data || []
    }
  } catch (relationsError) {
    // Attempt rollback (best effort)
    await supabase.from('project_team_members').delete().eq('project_id', createdProject.id)
    await supabase.from('project_phases').delete().eq('project_id', createdProject.id)
    await supabase.from('projects').delete().eq('id', createdProject.id)
    throw relationsError
  }

  return { project: createdProject, team: insertedTeam, phases: insertedPhases }
}

export const projectsService = {
  createWithRelations: createProjectWithRelations,
}