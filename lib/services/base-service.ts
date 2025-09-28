import { supabase } from '@/lib/supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type ServiceResponse<T> = {
  data: T | null
  error: ServiceError | null
}

export type ServiceError = {
  message: string
  details?: string
  code?: string
  status?: number
}

export type Tables = Database['public']['Tables']
export type TableName = keyof Tables

export class BaseService<T extends TableName> {
  protected tableName: T

  constructor(tableName: T) {
    this.tableName = tableName
  }

  protected formatError(error: PostgrestError | Error | unknown): ServiceError {
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error.stack,
      }
    }
    
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return {
        message: String(error.message),
        details: 'code' in error ? String(error.code) : undefined,
        code: 'code' in error ? String(error.code) : undefined,
      }
    }

    return {
      message: 'An unexpected error occurred',
      details: String(error),
    }
  }

  protected async getList(
    options: {
      page?: number
      limit?: number
      orderBy?: { column: string; ascending?: boolean }
      filters?: Partial<Tables[T]['Row']>
    } = {}
  ): Promise<ServiceResponse<Tables[T]['Row'][]>> {
    try {
      const {
        page = 1,
        limit = 10,
        orderBy = { column: 'created_at' as keyof Tables[T]['Row'], ascending: false },
        filters = {},
      } = options

      let query = supabase
        .from(this.tableName)
        .select('*')
        .range((page - 1) * limit, page * limit - 1)
        .order(orderBy.column as string, { ascending: orderBy.ascending })

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'object') {
            const filter = value as Record<string, unknown>
            if ('gt' in filter) query = query.gt(key, filter.gt)
            if ('gte' in filter) query = query.gte(key, filter.gte)
            if ('lt' in filter) query = query.lt(key, filter.lt)
            if ('lte' in filter) query = query.lte(key, filter.lte)
            if ('not' in filter) query = query.not(key, 'eq', filter.not)
          } else {
            query = query.eq(key, value)
          }
        }
      })

      const { data, error } = await query

      if (error) throw error

      return {
        data: data as Tables[T]['Row'][],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  protected async getById(id: string): Promise<ServiceResponse<Tables[T]['Row']>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id' as keyof Tables[T]['Row'], id)
        .single()

      if (error) throw error

      return {
        data: data as Tables[T]['Row'],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  protected async create(data: Tables[T]['Insert']): Promise<ServiceResponse<Tables[T]['Row']>> {
    try {
      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) throw error

      return {
        data: created as Tables[T]['Row'],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  protected async update(
    id: string,
    data: Tables[T]['Update']
  ): Promise<ServiceResponse<Tables[T]['Row']>> {
    try {
      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id' as keyof Tables[T]['Row'], id)
        .select()
        .single()

      if (error) throw error

      return {
        data: updated as Tables[T]['Row'],
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }

  protected async delete(id: string): Promise<ServiceResponse<null>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id' as keyof Tables[T]['Row'], id)

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

  protected async count(
    filters: Partial<Record<keyof Tables[T]['Row'], unknown>> = {}
  ): Promise<ServiceResponse<number>> {
    try {
      let query = supabase.from(this.tableName).select('*', { count: 'exact', head: true })

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'object') {
            const filter = value as Record<string, unknown>
            if ('gt' in filter) query = query.gt(key, filter.gt)
            if ('gte' in filter) query = query.gte(key, filter.gte)
            if ('lt' in filter) query = query.lt(key, filter.lt)
            if ('lte' in filter) query = query.lte(key, filter.lte)
            if ('not' in filter) query = query.not(key, 'eq', filter.not)
          } else {
            query = query.eq(key, value)
          }
        }
      })

      const { count, error } = await query

      if (error) throw error

      return {
        data: count,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error),
      }
    }
  }
}