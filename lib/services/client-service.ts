import { BaseService, type ServiceResponse, type Tables } from './base-service'
import { supabase } from '@/lib/supabase'

export class ClientService extends BaseService<'clients'> {
  constructor() {
    super('clients')
  }

  async getClients(
    options: {
      page?: number
      limit?: number
      orderBy?: { column: string; ascending?: boolean }
      filters?: Partial<Tables['clients']['Row']>
    } = {}
  ): Promise<ServiceResponse<Tables['clients']['Row'][]>> {
    return this.getList(options)
  }

  async getClient(id: string): Promise<ServiceResponse<Tables['clients']['Row']>> {
    return this.getById(id)
  }

  async createClient(
    data: Tables['clients']['Insert']
  ): Promise<ServiceResponse<Tables['clients']['Row']>> {
    return this.create(data)
  }

  async updateClient(
    id: string,
    data: Tables['clients']['Update']
  ): Promise<ServiceResponse<Tables['clients']['Row']>> {
    return this.update(id, data)
  }

  async deleteClient(id: string): Promise<ServiceResponse<null>> {
    return this.delete(id)
  }

  async getClientCount(filters: Partial<Tables['clients']['Row']> = {}): Promise<ServiceResponse<number>> {
    return this.count(filters)
  }

  async searchClients(
    query: string,
    options: {
      limit?: number
      filters?: Partial<Tables['clients']['Row']>
    } = {}
  ): Promise<ServiceResponse<Tables['clients']['Row'][]>> {
    const searchFields = ['first_name', 'last_name', 'email', 'company']
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
        data: data as Tables['clients']['Row'][],
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
  async getActiveClients(): Promise<ServiceResponse<Tables['clients']['Row'][]>> {
    return this.getList({
      filters: { status: 'active' },
      orderBy: { column: 'created_at', ascending: false },
    })
  }

  async getPotentialClients(): Promise<ServiceResponse<Tables['clients']['Row'][]>> {
    return this.getList({
      filters: { status: 'potential' },
      orderBy: { column: 'created_at', ascending: false },
    })
  }

  async getClientsByType(type: 'individual' | 'business'): Promise<ServiceResponse<Tables['clients']['Row'][]>> {
    return this.getList({
      filters: { client_type: type },
      orderBy: { column: 'created_at', ascending: false },
    })
  }

  async getClientsByCity(city: string): Promise<ServiceResponse<Tables['clients']['Row'][]>> {
    return this.getList({
      filters: { city },
      orderBy: { column: 'created_at', ascending: false },
    })
  }
}