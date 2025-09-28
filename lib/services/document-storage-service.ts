import { createClient } from '@/lib/supabase/client'

export interface DocumentMetadata {
  documentType: 'quotation' | 'invoice'
  documentId: string
  documentNumber: string
  clientId?: string
  projectId?: string
  fileName: string
  fileSize: number
  mimeType: string
  generateCount: number
  lastGenerated: string
}

export interface DocumentActivity {
  documentType: 'quotation' | 'invoice'
  documentId: string
  action: 'generated' | 'downloaded' | 'shared_email' | 'shared_whatsapp' | 'viewed'
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, any>
}

export class DocumentStorageService {
  private supabase = createClient()
  private bucketName = 'document-pdfs'

  /**
   * Store PDF file in Supabase storage
   */
  async storePDF(
    pdfBlob: Blob,
    metadata: Omit<DocumentMetadata, 'fileSize' | 'lastGenerated' | 'generateCount'>
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const fileName = `${metadata.documentType}s/${metadata.documentId}/${metadata.fileName}`
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, pdfBlob, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Store metadata in database
      const { error: metadataError } = await this.supabase
        .from('document_files')
        .upsert({
          document_type: metadata.documentType,
          document_id: metadata.documentId,
          document_number: metadata.documentNumber,
          client_id: metadata.clientId,
          project_id: metadata.projectId,
          file_name: metadata.fileName,
          file_path: uploadData.path,
          file_size: pdfBlob.size,
          mime_type: metadata.mimeType,
          generate_count: 1,
          last_generated: new Date().toISOString()
        }, {
          onConflict: 'document_id,document_type'
        })

      if (metadataError) {
        console.warn('Failed to store metadata:', metadataError)
      }

      return {
        success: true,
        filePath: uploadData.path
      }

    } catch (error) {
      console.error('Storage error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store PDF'
      }
    }
  }

  /**
   * Retrieve PDF from storage
   */
  async retrievePDF(
    documentType: 'quotation' | 'invoice',
    documentId: string
  ): Promise<{ success: boolean; blob?: Blob; url?: string; error?: string }> {
    try {
      // Get file metadata
      const { data: fileData, error: fileError } = await this.supabase
        .from('document_files')
        .select('file_path')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .single()

      if (fileError || !fileData) {
        throw new Error('PDF not found in storage')
      }

      // Get signed URL
      const { data: urlData, error: urlError } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(fileData.file_path, 3600) // 1 hour expiry

      if (urlError) {
        throw urlError
      }

      // Fetch the blob
      const response = await fetch(urlData.signedUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch PDF')
      }

      const blob = await response.blob()

      return {
        success: true,
        blob,
        url: urlData.signedUrl
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve PDF'
      }
    }
  }

  /**
   * Log document activity
   */
  async logActivity(activity: DocumentActivity): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('document_activities')
        .insert({
          document_type: activity.documentType,
          document_id: activity.documentId,
          action: activity.action,
          user_agent: activity.userAgent || navigator?.userAgent,
          ip_address: activity.ipAddress, // Would need to be passed from server
          metadata: activity.metadata,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.warn('Failed to log activity:', error)
      }
    } catch (error) {
      console.warn('Activity logging failed:', error)
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(
    documentType: 'quotation' | 'invoice',
    documentId: string
  ): Promise<{
    generateCount: number
    downloadCount: number
    shareCount: number
    viewCount: number
    lastActivity?: string
  }> {
    try {
      // Get file metadata
      const { data: fileData } = await this.supabase
        .from('document_files')
        .select('generate_count, last_generated')
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .single()

      // Get activity counts
      const { data: activityData } = await this.supabase
        .from('document_activities')
        .select('action, created_at')
        .eq('document_type', documentType)
        .eq('document_id', documentId)

      const stats = {
        generateCount: fileData?.generate_count || 0,
        downloadCount: 0,
        shareCount: 0,
        viewCount: 0,
        lastActivity: fileData?.last_generated
      }

      if (activityData) {
        stats.downloadCount = activityData.filter(a => a.action === 'downloaded').length
        stats.shareCount = activityData.filter(a => a.action.includes('shared')).length
        stats.viewCount = activityData.filter(a => a.action === 'viewed').length
        
        const lastActivity = activityData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
        if (lastActivity) {
          stats.lastActivity = lastActivity.created_at
        }
      }

      return stats
    } catch (error) {
      console.error('Failed to get document stats:', error)
      return {
        generateCount: 0,
        downloadCount: 0,
        shareCount: 0,
        viewCount: 0
      }
    }
  }

  /**
   * Clean up old files (for maintenance)
   */
  async cleanupOldFiles(daysOld: number = 90): Promise<{ deletedCount: number; error?: string }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      // Get old files
      const { data: oldFiles, error: queryError } = await this.supabase
        .from('document_files')
        .select('file_path, document_id, document_type')
        .lt('last_generated', cutoffDate.toISOString())

      if (queryError) {
        throw queryError
      }

      let deletedCount = 0

      if (oldFiles && oldFiles.length > 0) {
        // Delete from storage
        const filePaths = oldFiles.map(f => f.file_path)
        const { error: storageError } = await this.supabase.storage
          .from(this.bucketName)
          .remove(filePaths)

        if (storageError) {
          console.warn('Some files could not be deleted from storage:', storageError)
        }

        // Delete metadata
        const { error: dbError } = await this.supabase
          .from('document_files')
          .delete()
          .lt('last_generated', cutoffDate.toISOString())

        if (dbError) {
          throw dbError
        }

        deletedCount = oldFiles.length
      }

      return { deletedCount }

    } catch (error) {
      return {
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Cleanup failed'
      }
    }
  }

  /**
   * Initialize storage bucket if it doesn't exist
   */
  async initializeStorage(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if bucket exists
      const { data: buckets } = await this.supabase.storage.listBuckets()
      
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName)
      
      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['application/pdf'],
          fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
        })

        if (createError) {
          throw createError
        }
      }

      return { success: true }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage initialization failed'
      }
    }
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorageService()