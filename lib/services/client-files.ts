import { createClient } from '@/lib/supabase/client'

export interface ClientFile {
  id: string
  client_id: string
  user_id: string
  filename: string
  file_url: string
  file_type: string
  file_size: number
  category: 'document' | 'image' | 'spreadsheet' | 'other'
  description?: string
  uploaded_by: string
  created_at: string
  storage_path?: string // For files loaded directly from storage
}

const STORAGE_BUCKET = 'client-files'

export class ClientFileService {
  private supabase = createClient()

  /**
   * Upload a file to Supabase Storage and save metadata
   */
  async uploadFile(
    clientId: string,
    file: File,
    uploadedBy: string,
    description?: string
  ): Promise<{ success: boolean; file?: ClientFile; error?: string }> {
    try {
            // Generate unique file ID but preserve original filename
      const fileId = crypto.randomUUID()
      // Use original filename with client folder structure
      const fileName = `${clientId}/${file.name}`

      console.log('Uploading file:', fileName)

      // Upload file to Supabase Storage with original filename
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting files with same name
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { success: false, error: `Upload failed: ${uploadError.message}` }
      }

      // Get public URL for the uploaded file
      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName)

      const newFile: ClientFile = {
        id: fileId,
        client_id: clientId,
        user_id: 'current-user-id', // TODO: Get from auth
        filename: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        category: this.categorizeFile(file.name, file.type),
        description,
        uploaded_by: uploadedBy,
        created_at: new Date().toISOString()
      }

      // Try to save file metadata to database
      try {
        // Using any type to bypass TypeScript database type issues
        const { error: dbError } = await (this.supabase as any)
          .from('client_files')
          .insert(newFile)

        if (dbError) {
          console.error('Database insert error:', dbError)
          // File was uploaded to storage but database save failed
          // Continue anyway since storage upload succeeded
        } else {
          console.log('File metadata saved to database successfully')
        }
      } catch (dbInsertError) {
        console.error('Database insert failed:', dbInsertError)
        // Continue without database save for now
      }

      return { success: true, file: newFile }
    } catch (error) {
      console.error('File upload error:', error)
      // Fallback to mock data
      return this.createMockFile(clientId, file, uploadedBy, description)
    }
  }

  /**
   * Get all files for a client
   */
  async getClientFiles(clientId: string): Promise<{ success: boolean; files?: ClientFile[]; error?: string }> {
    try {
      console.log('Fetching files for client:', clientId)
      
      // Try to query files from database using any type to bypass TypeScript issues
      const { data: files, error } = await (this.supabase as any)
        .from('client_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database query error:', error)
        return { success: false, error: error.message }
      }

      console.log(`Found ${files?.length || 0} files for client ${clientId}`)
      return { success: true, files: files || [] }
    } catch (error) {
      console.error('Get files error:', error)
      return { success: false, error: 'Failed to fetch files' }
    }
  }

  /**
   * Delete a file from storage and database
   */
  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Attempting to delete file:', fileId)
      
      // Try to get file info first using any type to bypass TypeScript issues
      const { data: file, error: selectError } = await (this.supabase as any)
        .from('client_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (selectError || !file) {
        console.error('File not found in database:', selectError)
        return { success: false, error: 'File not found' }
      }

      // Extract file path from URL for storage deletion
      const urlParts = file.file_url.split('/')
      const fileName = urlParts.slice(-2).join('/') // client_id/filename

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName])

      if (storageError) {
        console.error('Storage delete error:', storageError)
      }

      // Delete from database
      const { error: dbError } = await (this.supabase as any)
        .from('client_files')
        .delete()
        .eq('id', fileId)

      if (dbError) {
        console.error('Database delete error:', dbError)
        return { success: false, error: 'Failed to delete file record' }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete file error:', error)
      return { success: false, error: 'Delete failed. Please try again.' }
    }
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(fileId: string): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
    try {
      console.log('Getting download URL for file:', fileId)
      
      // Get file info from database using any type to bypass TypeScript issues
      const { data: file, error } = await (this.supabase as any)
        .from('client_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error || !file) {
        console.error('File not found in database:', error)
        // File might be a storage-only file, try to handle it differently
        return { success: false, error: 'File not found in database' }
      }

      // For files in storage, create a signed URL for download
      if (file.file_url.includes('supabase')) {
        const urlParts = file.file_url.split('/')
        const fileName = urlParts.slice(-2).join('/') // client_id/filename

        const { data: signedUrl, error: signError } = await this.supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(fileName, 3600) // 1 hour expiry

        if (signError) {
          console.error('Signed URL error:', signError)
          return { success: false, error: 'Failed to generate download link' }
        }

        return { 
          success: true, 
          url: signedUrl.signedUrl,
          filename: file.filename 
        }
      }

      // For other files, return the URL directly
      return { 
        success: true, 
        url: file.file_url,
        filename: file.filename 
      }
    } catch (error) {
      console.error('Get download URL error:', error)
      return { success: false, error: 'Failed to get download link' }
    }
  }

  /**
   * Get view/preview URL for a file (for inline viewing)
   */
  async getViewUrl(fileId: string): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
    try {
      console.log('Getting view URL for file:', fileId)
      
      // Get file info from database
      const { data: file, error } = await (this.supabase as any)
        .from('client_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error || !file) {
        console.error('File not found:', error)
        return { success: false, error: 'File not found' }
      }

      // For files in storage, create a signed URL for viewing
      if (file.file_url.includes('supabase')) {
        const urlParts = file.file_url.split('/')
        const fileName = urlParts.slice(-2).join('/') // client_id/filename

        const { data: signedUrl, error: signError } = await this.supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(fileName, 3600) // 1 hour expiry

        if (signError) {
          console.error('Signed URL error:', signError)
          return { success: false, error: 'Failed to generate view link' }
        }

        return { 
          success: true, 
          url: signedUrl.signedUrl,
          filename: file.filename 
        }
      }

      // For other files, return the URL directly
      return { 
        success: true, 
        url: file.file_url,
        filename: file.filename 
      }
    } catch (error) {
      console.error('Get view URL error:', error)
      return { success: false, error: 'Failed to get view link' }
    }
  }

  /**
   * Download a file with proper download behavior
   */
  async downloadFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.getDownloadUrl(fileId)
      
      if (!result.success || !result.url) {
        return { success: false, error: result.error }
      }

      // Create a temporary link element to force download
      const link = document.createElement('a')
      link.href = result.url
      link.download = result.filename || 'download'
      link.target = '_blank'
      
      // Add link to DOM temporarily and click it
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true }
    } catch (error) {
      console.error('Download file error:', error)
      return { success: false, error: 'Download failed' }
    }
  }

  /**
   * Download file directly from storage (for storage-only files)
   */
  async downloadFileFromStorage(file: ClientFile): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Downloading file from storage:', file.filename)
      
      if (!file.storage_path) {
        // Use the file URL directly
        const link = document.createElement('a')
        link.href = file.file_url
        link.download = file.filename
        link.target = '_blank'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        return { success: true }
      }

      // Create signed URL for download
      const { data: signedUrl, error: signError } = await this.supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 3600)

      if (signError) {
        console.error('Signed URL error:', signError)
        return { success: false, error: 'Failed to generate download link' }
      }

      // Create download link
      const link = document.createElement('a')
      link.href = signedUrl.signedUrl
      link.download = file.filename
      link.target = '_blank'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true }
    } catch (error) {
      console.error('Download from storage error:', error)
      return { success: false, error: 'Download failed' }
    }
  }

  /**
   * Get client contact information for sharing
   */
  async getClientContactInfo(clientId: string): Promise<{ success: boolean; client?: any; error?: string }> {
    try {
      const { data: client, error } = await (this.supabase as any)
        .from('clients')
        .select('first_name, last_name, email, phone, alt_phone')
        .eq('id', clientId)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
        return { success: false, error: 'Client not found' }
      }

      return { success: true, client }
    } catch (error) {
      console.error('Get client contact error:', error)
      return { success: false, error: 'Failed to get client info' }
    }
  }

  /**
   * Share file using Web Share API (document sharing only, no links)
   */
  async shareFile(fileId: string, clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get file and client info
      const [fileResult, clientResult] = await Promise.all([
        this.getDownloadUrl(fileId),
        this.getClientContactInfo(clientId)
      ])

      if (!fileResult.success || !fileResult.url) {
        return { success: false, error: fileResult.error }
      }

      if (!clientResult.success || !clientResult.client) {
        return { success: false, error: 'Client information not available' }
      }

      // Check if Web Share API is supported for file sharing
      if (navigator.share) {
        try {
          // Fetch the file as a blob for document sharing
          const response = await fetch(fileResult.url)
          const blob = await response.blob()
          
          // Create proper file with correct MIME type
          const mimeType = blob.type || 'application/octet-stream'
          const file = new File([blob], fileResult.filename || 'shared-document', { type: mimeType })

          await navigator.share({
            title: `📄 ${fileResult.filename}`,
            text: `Sharing document: ${fileResult.filename}`,
            files: [file]
          })

          return { success: true }
        } catch (shareError) {
          console.log('Web Share failed, will use manual sharing dialog:', shareError)
          // Return error to trigger manual sharing dialog
          return { 
            success: false, 
            error: JSON.stringify({
              type: 'showOptions',
              client: `${clientResult.client.first_name} ${clientResult.client.last_name}`
            })
          }
        }
      }

      // No Web Share API, use manual sharing dialog
      return { 
        success: false, 
        error: JSON.stringify({
          type: 'showOptions',
          client: `${clientResult.client.first_name} ${clientResult.client.last_name}`
        })
      }
    } catch (error) {
      console.error('Share file error:', error)
      return { success: false, error: 'Sharing failed' }
    }
  }

  /**
   * Create mock file for development/fallback - REMOVED
   */
  private createMockFile(
    clientId: string, 
    file: File, 
    uploadedBy: string, 
    description?: string
  ): { success: boolean; file?: ClientFile; error: string } {
    // No longer creating mock files
    return { 
      success: false, 
      error: 'File upload requires proper database setup. Please configure Supabase first.' 
    }
  }

  /**
   * Get mock files for development/fallback - REMOVED
   */
  private getMockFiles(clientId: string): ClientFile[] {
    // No longer returning mock files
    return []
  }

  /**
   * Categorize file based on type and extension
   */
  private categorizeFile(filename: string, mimeType: string): 'document' | 'image' | 'spreadsheet' | 'other' {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    // Image files
    if (mimeType.startsWith('image/')) {
      return 'image'
    }
    
    // Spreadsheet files
    if (
      mimeType.includes('spreadsheet') || 
      mimeType.includes('excel') ||
      ['xlsx', 'xls', 'csv'].includes(extension || '')
    ) {
      return 'spreadsheet'
    }
    
    // Document files
    if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('word') ||
      ['pdf', 'doc', 'docx', 'txt'].includes(extension || '')
    ) {
      return 'document'
    }
    
    return 'other'
  }

  /**
   * Get files by category
   */
  async getFilesByCategory(clientId: string, category: string): Promise<{ success: boolean; files?: ClientFile[]; error?: string }> {
    const result = await this.getClientFiles(clientId)
    
    if (!result.success || !result.files) {
      return result
    }
    
    const filteredFiles = result.files.filter(file => 
      category === 'all' || file.category === category
    )
    
    return { success: true, files: filteredFiles }
  }
}