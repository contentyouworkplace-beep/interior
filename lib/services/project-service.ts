import { BaseService, type ServiceResponse, type Tables } from './base-service'
import { supabase } from '@/lib/supabase'

export class ProjectService extends BaseService<'projects'> {
  constructor() {
    super('projects')
  }

  async getProjects(
    options: {
      page?: number
      limit?: number
      orderBy?: { column: string; ascending?: boolean }
      filters?: Partial<Tables['projects']['Row']>
    } = {}
  ): Promise<ServiceResponse<Tables['projects']['Row'][]>> {
    return this.getList(options)
  }

  async getProject(id: string): Promise<ServiceResponse<Tables['projects']['Row']>> {
    return this.getById(id)
  }

  async createProject(
    data: Tables['projects']['Insert']
  ): Promise<ServiceResponse<Tables['projects']['Row']>> {
    return this.create(data)
  }

  async updateProject(
    id: string,
    data: Tables['projects']['Update']
  ): Promise<ServiceResponse<Tables['projects']['Row']>> {
    return this.update(id, data)
  }

  async deleteProject(id: string): Promise<ServiceResponse<null>> {
    return this.delete(id)
  }

  async getProjectCount(filters: Partial<Tables['projects']['Row']> = {}): Promise<ServiceResponse<number>> {
    return this.count(filters)
  }

  async searchProjects(
    query: string,
    options: {
      limit?: number
      filters?: Partial<Tables['projects']['Row']>
    } = {}
  ): Promise<ServiceResponse<Tables['projects']['Row'][]>> {
    const searchFields = ['name', 'description', 'address', 'client_name']
    const { limit = 10, filters = {} } = options

    try {
      let dbQuery = supabase
        .from(this.tableName)
        .select('*')
        .limit(limit)

      // Add text search conditions
      const searchConditions = searchFields.map(field => 
        `${field}.ilike.%${query}%`
      )
      dbQuery = dbQuery.or(searchConditions.join(','))

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          dbQuery = dbQuery.eq(key, value)
        }
      })

      const { data, error } = await dbQuery

      if (error) throw error

      return {
        data: data as Tables['projects']['Row'][],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  // Specialized queries
  async getActiveProjects(): Promise<ServiceResponse<Tables['projects']['Row'][]>> {
    return this.getList({
      filters: { status: 'active' },
      orderBy: { column: 'start_date', ascending: false },
    })
  }

  async getCompletedProjects(): Promise<ServiceResponse<Tables['projects']['Row'][]>> {
    return this.getList({
      filters: { status: 'completed' },
      orderBy: { column: 'completion_date', ascending: false },
    })
  }

  async getProjectsByClient(clientId: string): Promise<ServiceResponse<Tables['projects']['Row'][]>> {
    return this.getList({
      filters: { client_id: clientId },
      orderBy: { column: 'start_date', ascending: false },
    })
  }

  async getProjectsByStatus(status: string): Promise<ServiceResponse<Tables['projects']['Row'][]>> {
    return this.getList({
      filters: { status },
      orderBy: { column: 'start_date', ascending: false },
    })
  }

  async getProjectsWithAssets(
    options: {
      page?: number
      limit?: number
      filters?: Partial<Tables['projects']['Row']>
    } = {}
  ): Promise<ServiceResponse<(Tables['projects']['Row'] & { assets: Tables['project_assets']['Row'][] })[]>> {
    try {
      const { page = 1, limit = 10, filters = {} } = options
      
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          assets:project_assets(*)
        `)
        .range((page - 1) * limit, page * limit - 1)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query

      if (error) throw error

      return {
        data: (data as any[])?.map(item => ({
          ...item,
          assets: Array.isArray(item.assets) ? item.assets : []
        })) as (Tables['projects']['Row'] & { assets: Tables['project_assets']['Row'][] })[] || [],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  async updateProjectStatus(
    id: string,
    status: string
  ): Promise<ServiceResponse<Tables['projects']['Row']>> {
    return this.update(id, {
      status,
      updated_at: new Date().toISOString(),
    })
  }

  async addTeamMember(
    projectId: string,
    teamMemberId: string,
    role?: string,
    isManager: boolean = false
  ): Promise<ServiceResponse<Tables['project_team_members']['Row']>> {
    try {
      const { data, error } = await supabase
        .from('project_team_members')
        .insert({
          project_id: projectId,
          user_id: (await this.getCurrentUser()).id,
          team_member_id: teamMemberId,
          role,
          is_manager: isManager
        })
        .select()
        .single()

      if (error) throw error

      return {
        data: data as Tables['project_team_members']['Row'],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  async removeTeamMember(
    projectId: string,
    teamMemberId: string
  ): Promise<ServiceResponse<null>> {
    try {
      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .match({ project_id: projectId, team_member_id: teamMemberId })

      if (error) throw error

      return {
        data: null,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  private async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('No user found')
    return user
  }
}