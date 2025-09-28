import { createClient } from '@/lib/supabase/client'

export interface ActivityLog {
  id?: string
  documentType: 'quotation' | 'invoice'
  documentId: string
  documentNumber: string
  action: 'created' | 'viewed' | 'edited' | 'shared_email' | 'shared_whatsapp' | 'downloaded' | 'converted' | 'deleted' | 'status_changed'
  details?: Record<string, any>
  userAgent?: string
  ipAddress?: string
  sessionId?: string
  timestamp: string
}

export interface ActivitySummary {
  totalActions: number
  actionBreakdown: Record<string, number>
  recentActivity: ActivityLog[]
  mostActiveDocuments: Array<{
    documentId: string
    documentNumber: string
    documentType: string
    actionCount: number
  }>
}

export class ActivityLoggingService {
  private supabase = createClient()

  /**
   * Log a document activity
   */
  async logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('document_activities')
        .insert({
          document_type: activity.documentType,
          document_id: activity.documentId,
          document_number: activity.documentNumber,
          action: activity.action,
          details: activity.details || {},
          user_agent: activity.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
          ip_address: activity.ipAddress, // Will be set by server-side middleware
          session_id: activity.sessionId || this.getSessionId(),
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Activity logging failed:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Activity logging error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to log activity' 
      }
    }
  }

  /**
   * Log document creation
   */
  async logDocumentCreated(
    documentType: 'quotation' | 'invoice',
    documentId: string,
    documentNumber: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      documentType,
      documentId,
      documentNumber,
      action: 'created',
      details: {
        ...details,
        createdAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log document view
   */
  async logDocumentViewed(
    documentType: 'quotation' | 'invoice',
    documentId: string,
    documentNumber: string,
    viewMode?: 'list' | 'detail' | 'preview' | 'pdf'
  ): Promise<void> {
    await this.logActivity({
      documentType,
      documentId,
      documentNumber,
      action: 'viewed',
      details: {
        viewMode: viewMode || 'detail',
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log document edit
   */
  async logDocumentEdited(
    documentType: 'quotation' | 'invoice',
    documentId: string,
    documentNumber: string,
    changes?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      documentType,
      documentId,
      documentNumber,
      action: 'edited',
      details: {
        changes: changes || {},
        editedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log document sharing
   */
  async logDocumentShared(
    documentType: 'quotation' | 'invoice',
    documentId: string,
    documentNumber: string,
    shareMethod: 'email' | 'whatsapp',
    recipient?: string,
    additionalDetails?: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      documentType,
      documentId,
      documentNumber,
      action: shareMethod === 'email' ? 'shared_email' : 'shared_whatsapp',
      details: {
        shareMethod,
        recipient: recipient ? this.maskEmail(recipient) : undefined, // Mask for privacy
        sharedAt: new Date().toISOString(),
        ...additionalDetails
      }
    })
  }

  /**
   * Log document download
   */
  async logDocumentDownloaded(
    documentType: 'quotation' | 'invoice',
    documentId: string,
    documentNumber: string,
    format: 'pdf' | 'html' = 'pdf'
  ): Promise<void> {
    await this.logActivity({
      documentType,
      documentId,
      documentNumber,
      action: 'downloaded',
      details: {
        format,
        downloadedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log document conversion (quotation to invoice)
   */
  async logDocumentConverted(
    fromType: 'quotation',
    fromId: string,
    fromNumber: string,
    toType: 'invoice',
    toId: string,
    toNumber: string
  ): Promise<void> {
    await this.logActivity({
      documentType: fromType,
      documentId: fromId,
      documentNumber: fromNumber,
      action: 'converted',
      details: {
        convertedTo: {
          type: toType,
          id: toId,
          number: toNumber
        },
        convertedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Log status change
   */
  async logStatusChanged(
    documentType: 'quotation' | 'invoice',
    documentId: string,
    documentNumber: string,
    fromStatus: string,
    toStatus: string,
    reason?: string
  ): Promise<void> {
    await this.logActivity({
      documentType,
      documentId,
      documentNumber,
      action: 'status_changed',
      details: {
        fromStatus,
        toStatus,
        reason,
        changedAt: new Date().toISOString()
      }
    })
  }

  /**
   * Get activity summary for a specific document
   */
  async getDocumentActivity(
    documentType: 'quotation' | 'invoice',
    documentId: string,
    limit: number = 50
  ): Promise<ActivityLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('document_activities')
        .select('*')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch document activity:', error)
        return []
      }

      return data.map(row => ({
        id: row.id,
        documentType: row.document_type,
        documentId: row.document_id,
        documentNumber: row.document_number,
        action: row.action,
        details: row.details,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        sessionId: row.session_id,
        timestamp: row.timestamp
      }))
    } catch (error) {
      console.error('Error fetching document activity:', error)
      return []
    }
  }

  /**
   * Get overall activity summary
   */
  async getActivitySummary(
    days: number = 30,
    documentType?: 'quotation' | 'invoice'
  ): Promise<ActivitySummary> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = this.supabase
        .from('document_activities')
        .select('*')
        .gte('timestamp', startDate.toISOString())

      if (documentType) {
        query = query.eq('document_type', documentType)
      }

      const { data, error } = await query.order('timestamp', { ascending: false })

      if (error) {
        throw error
      }

      const activities = data || []

      // Calculate breakdown
      const actionBreakdown: Record<string, number> = {}
      activities.forEach(activity => {
        actionBreakdown[activity.action] = (actionBreakdown[activity.action] || 0) + 1
      })

      // Get most active documents
      const documentActivity: Record<string, { count: number; number: string; type: string }> = {}
      activities.forEach(activity => {
        const key = `${activity.document_type}:${activity.document_id}`
        if (!documentActivity[key]) {
          documentActivity[key] = {
            count: 0,
            number: activity.document_number,
            type: activity.document_type
          }
        }
        documentActivity[key].count++
      })

      const mostActiveDocuments = Object.entries(documentActivity)
        .map(([key, data]) => ({
          documentId: key.split(':')[1],
          documentNumber: data.number,
          documentType: data.type,
          actionCount: data.count
        }))
        .sort((a, b) => b.actionCount - a.actionCount)
        .slice(0, 10)

      return {
        totalActions: activities.length,
        actionBreakdown,
        recentActivity: activities.slice(0, 20).map(row => ({
          id: row.id,
          documentType: row.document_type,
          documentId: row.document_id,
          documentNumber: row.document_number,
          action: row.action,
          details: row.details,
          userAgent: row.user_agent,
          ipAddress: row.ip_address,
          sessionId: row.session_id,
          timestamp: row.timestamp
        })),
        mostActiveDocuments
      }
    } catch (error) {
      console.error('Error fetching activity summary:', error)
      return {
        totalActions: 0,
        actionBreakdown: {},
        recentActivity: [],
        mostActiveDocuments: []
      }
    }
  }

  /**
   * Get session ID for tracking
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('crm-session-id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('crm-session-id', sessionId)
    }
    return sessionId
  }

  /**
   * Mask email for privacy
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (local.length <= 2) return email
    
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1)
    return `${maskedLocal}@${domain}`
  }

  /**
   * Clean up old activity logs
   */
  async cleanupOldLogs(daysOld: number = 365): Promise<{ deletedCount: number; error?: string }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data, error } = await this.supabase
        .from('document_activities')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())

      if (error) {
        throw error
      }

      return { deletedCount: data?.length || 0 }
    } catch (error) {
      return {
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Cleanup failed'
      }
    }
  }
}

// Export singleton instance
export const activityLogger = new ActivityLoggingService()