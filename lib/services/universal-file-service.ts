/**
 * Universal File Service
 * Handles all file types - PDFs, images, Excel, Word, etc.
 * Provides secure blob-based operations without URL exposure
 */

import { createClient } from '@/lib/supabase/client'

export interface UniversalFileConfig {
  bucketName: string
  filePath: string
  fileName: string
  mimeType?: string
}

export interface FileTypeConfig {
  extensions: string[]
  mimeTypes: string[]
  category: 'pdf' | 'image' | 'excel' | 'word' | 'text' | 'other'
  viewable: boolean
  printable: boolean
}

export class UniversalFileService {
  private static supabase = createClient()

  // File type configurations
  private static fileTypes: Record<string, FileTypeConfig> = {
    pdf: {
      extensions: ['pdf'],
      mimeTypes: ['application/pdf'],
      category: 'pdf',
      viewable: true,
      printable: true
    },
    image: {
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'],
      category: 'image',
      viewable: true,
      printable: true
    },
    excel: {
      extensions: ['xls', 'xlsx', 'csv'],
      mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
      category: 'excel',
      viewable: false,
      printable: false
    },
    word: {
      extensions: ['doc', 'docx'],
      mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      category: 'word',
      viewable: false,
      printable: false
    },
    text: {
      extensions: ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'],
      mimeTypes: ['text/plain', 'text/markdown', 'application/json', 'text/xml', 'text/html', 'text/css'],
      category: 'text',
      viewable: true,
      printable: true
    }
  }

  /**
   * Detect file type from filename or MIME type
   */
  static detectFileType(fileName: string, mimeType?: string): FileTypeConfig {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mime = mimeType?.toLowerCase()

    for (const [key, config] of Object.entries(this.fileTypes)) {
      if (extension && config.extensions.includes(extension)) {
        return config
      }
      if (mime && config.mimeTypes.some(type => mime.includes(type.toLowerCase()))) {
        return config
      }
    }

    return {
      extensions: [],
      mimeTypes: [],
      category: 'other',
      viewable: false,
      printable: false
    }
  }

  /**
   * Download file as blob from Supabase storage
   */
  static async downloadFileBlob(config: UniversalFileConfig): Promise<{
    success: boolean
    data?: Blob
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(config.bucketName)
        .download(config.filePath)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Open file in new tab - works for all viewable file types
   */
  static async openInNewTab(config: UniversalFileConfig): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const fileType = this.detectFileType(config.fileName, config.mimeType)
      
      if (!fileType.viewable) {
        return { success: false, error: 'File type not viewable in browser' }
      }

      const blobResult = await this.downloadFileBlob(config)
      
      if (!blobResult.success || !blobResult.data) {
        return { success: false, error: blobResult.error || 'Failed to download file' }
      }

      // Create blob URL with correct MIME type
      const blob = new Blob([blobResult.data], { 
        type: config.mimeType || this.getMimeTypeFromExtension(config.fileName)
      })
      const blobUrl = URL.createObjectURL(blob)

      // Open in new tab
      const newWindow = window.open('', '_blank')
      if (!newWindow) {
        return { success: false, error: 'Popup blocked by browser' }
      }

      if (fileType.category === 'image') {
        // For images, create a proper viewer
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${config.fileName}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #000;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  font-family: Arial, sans-serif;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                  box-shadow: 0 4px 20px rgba(255,255,255,0.1);
                }
                .header {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  background: rgba(0,0,0,0.8);
                  color: white;
                  padding: 10px 20px;
                  font-size: 14px;
                  z-index: 1000;
                }
              </style>
            </head>
            <body>
              <div class="header">${config.fileName}</div>
              <img src="${blobUrl}" alt="${config.fileName}" onload="URL.revokeObjectURL('${blobUrl}')">
            </body>
          </html>
        `)
      } else if (fileType.category === 'text') {
        // For text files, create a code viewer
        const text = await blobResult.data.text()
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${config.fileName}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  margin: 0;
                  padding: 20px;
                  background: #f5f5f5;
                  line-height: 1.6;
                }
                .header {
                  background: white;
                  padding: 15px;
                  margin-bottom: 20px;
                  border-radius: 5px;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                  font-weight: bold;
                }
                pre {
                  background: white;
                  padding: 20px;
                  border-radius: 5px;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                  overflow: auto;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                }
              </style>
            </head>
            <body>
              <div class="header">${config.fileName}</div>
              <pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </body>
          </html>
        `)
      } else {
        // For PDFs and other files, redirect to the blob URL
        newWindow.location.href = blobUrl
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Download file to user's device
   */
  static async downloadFile(config: UniversalFileConfig): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const blobResult = await this.downloadFileBlob(config)
      
      if (!blobResult.success || !blobResult.data) {
        return { success: false, error: blobResult.error || 'Failed to download file' }
      }

      // Create download link
      const blob = new Blob([blobResult.data], { 
        type: config.mimeType || this.getMimeTypeFromExtension(config.fileName)
      })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = config.fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Share file using Web Share API or fallback to clipboard
   */
  static async shareFile(config: UniversalFileConfig): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const blobResult = await this.downloadFileBlob(config)
      
      if (!blobResult.success || !blobResult.data) {
        return { success: false, error: blobResult.error || 'Failed to download file' }
      }

      // Try Web Share API first
      if (navigator.share && navigator.canShare) {
        const file = new File([blobResult.data], config.fileName, {
          type: config.mimeType || this.getMimeTypeFromExtension(config.fileName)
        })

        const shareData = {
          title: config.fileName,
          text: `Sharing document: ${config.fileName}`,
          files: [file]
        }

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return { success: true }
        }
      }

      // Fallback: Create temporary blob URL and copy to clipboard
      const blob = new Blob([blobResult.data], { 
        type: config.mimeType || this.getMimeTypeFromExtension(config.fileName)
      })
      const url = URL.createObjectURL(blob)
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`Document: ${config.fileName}\nTemporary URL: ${url}`)
        setTimeout(() => URL.revokeObjectURL(url), 5000) // Clean up after 5 seconds
        return { success: true }
      }

      return { success: false, error: 'Sharing not supported in this browser' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Print file (for supported file types)
   */
  static async printFile(config: UniversalFileConfig): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const fileType = this.detectFileType(config.fileName, config.mimeType)
      
      if (!fileType.printable) {
        return { success: false, error: 'File type not printable' }
      }

      const blobResult = await this.downloadFileBlob(config)
      
      if (!blobResult.success || !blobResult.data) {
        return { success: false, error: blobResult.error || 'Failed to download file' }
      }

      const blob = new Blob([blobResult.data], { 
        type: config.mimeType || this.getMimeTypeFromExtension(config.fileName)
      })
      const url = URL.createObjectURL(blob)

      // Open in new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        return { success: false, error: 'Popup blocked by browser' }
      }

      if (fileType.category === 'image') {
        printWindow.document.write(`
          <html>
            <head><title>Print ${config.fileName}</title></head>
            <body onload="window.print(); window.close();">
              <img src="${url}" style="max-width:100%;" />
            </body>
          </html>
        `)
      } else {
        printWindow.location.href = url
        printWindow.onload = () => {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
            URL.revokeObjectURL(url)
          }, 1000)
        }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeTypeFromExtension(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const mimeMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      xml: 'text/xml',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      ts: 'application/typescript',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    return mimeMap[extension || ''] || 'application/octet-stream'
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Batch operations for multiple files
   */
  static async batchOperation(
    operation: 'download' | 'share' | 'print',
    files: UniversalFileConfig[]
  ): Promise<{
    success: boolean
    data?: any[]
    error?: string
  }> {
    try {
      const results = await Promise.all(
        files.map(async (file) => {
          switch (operation) {
            case 'download':
              return await this.downloadFile(file)
            case 'share':
              return await this.shareFile(file)
            case 'print':
              return await this.printFile(file)
            default:
              return { success: false, error: 'Invalid operation' }
          }
        })
      )

      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)

      return {
        success: successful.length > 0,
        data: {
          successful: successful.length,
          failed: failed.length,
          total: files.length,
          errors: failed.map(f => f.error)
        } as any
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch operation failed'
      }
    }
  }
}

export default UniversalFileService