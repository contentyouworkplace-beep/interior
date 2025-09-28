import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/types/database'

export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type CreateTeamMemberData = Database['public']['Tables']['team_members']['Insert']
export type UpdateTeamMemberData = Database['public']['Tables']['team_members']['Update']

export class TeamService {
  // Get all team members for the authenticated user
  static async getTeamMembers(): Promise<{ data: TeamMember[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Get a single team member by ID
  static async getTeamMember(id: string): Promise<{ data: TeamMember | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create a new team member
  static async createTeamMember(memberData: Omit<CreateTeamMemberData, 'user_id'>): Promise<{ data: TeamMember | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          ...memberData,
          user_id: user.id,
          status: memberData.status || 'active',
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update an existing team member
  static async updateTeamMember(id: string, memberData: UpdateTeamMemberData): Promise<{ data: TeamMember | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data, error } = await supabase
        .from('team_members')
        .update({
          ...memberData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete a team member
  static async deleteTeamMember(id: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { error: { message: 'User not authenticated' } }
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Get team statistics
  static async getTeamStats(): Promise<{ 
    data: {
      totalMembers: number
      activeMembers: number
      onLeaveMembers: number
      inactiveMembers: number
      departments: { name: string; count: number }[]
      roles: { name: string; count: number }[]
    } | null; 
    error: any 
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data: members, error } = await supabase
        .from('team_members')
        .select('status, role, specialization')
        .eq('user_id', user.id)

      if (error) {
        return { data: null, error }
      }

      const totalMembers = members.length
      const activeMembers = members.filter(m => m.status === 'active').length
      const onLeaveMembers = members.filter(m => m.status === 'on-leave').length
      const inactiveMembers = members.filter(m => m.status === 'inactive').length

      // Group by specialization as departments
      const departmentCounts = members.reduce((acc, member) => {
        const dept = member.specialization || 'General'
        acc[dept] = (acc[dept] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const departments = Object.entries(departmentCounts).map(([name, count]) => ({
        name,
        count
      }))

      // Group by roles
      const roleCounts = members.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const roles = Object.entries(roleCounts).map(([name, count]) => ({
        name,
        count
      }))

      return {
        data: {
          totalMembers,
          activeMembers,
          onLeaveMembers,
          inactiveMembers,
          departments,
          roles
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Search team members
  static async searchTeamMembers(query: string): Promise<{ data: TeamMember[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%,specialization.ilike.%${query}%`)
        .order('name', { ascending: true })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Filter team members by status
  static async filterTeamMembersByStatus(status: string): Promise<{ data: TeamMember[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      let query = supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('name', { ascending: true })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}