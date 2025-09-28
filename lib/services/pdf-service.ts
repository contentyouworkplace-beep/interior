/**
 * Comprehensive PDF Service
 * Handles PDF operations: viewing, downloading, sharing, conversion
 * Works directly with Supabase storage without exposing URLs
 */

import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface PDFFile {
  id: string
  name: string
  path: string
  bucket: string
  size?: number
  type?: string
  createdAt?: Date
  metadata?: Record<string, any>
}

export interface PDFOperationResult {
  success: boolean
  data?: any
  error?: string
  blob?: Blob
}

export class PDFService {
  
  /**
   * Download PDF directly from Supabase storage
   */
  static async downloadPDF(
    bucketName: string, 
    filePath: string, 
    fileName?: string
  ): Promise<PDFOperationResult> {
    try {
      console.log('📥 Downloading PDF:', { bucketName, filePath, fileName })

      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath)

      if (error) {
        console.error('❌ PDF download error:', error)
        return {
          success: false,
          error: `Download failed: ${error.message}`
        }
      }

      // Verify it's a PDF
      if (data.type !== 'application/pdf') {
        return {
          success: false,
          error: 'File is not a PDF document'
        }
      }

      console.log('✅ PDF downloaded successfully:', {
        size: data.size,
        type: data.type
      })

      return {
        success: true,
        data: data,
        blob: data
      }

    } catch (error: any) {
      console.error('❌ PDF download failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to download PDF'
      }
    }
  }

  /**
   * Download PDF and trigger browser download
   */
  static async downloadPDFToBrowser(
    bucketName: string,
    filePath: string,
    fileName: string
  ): Promise<PDFOperationResult> {
    try {
      const result = await this.downloadPDF(bucketName, filePath, fileName)
      
      if (!result.success || !result.blob) {
        return result
      }

      // Create download link and trigger download
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)

      console.log('✅ PDF browser download initiated:', fileName)

      return {
        success: true,
        data: 'Download initiated',
        blob: result.blob
      }

    } catch (error: any) {
      console.error('❌ PDF browser download failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to download PDF to browser'
      }
    }
  }

  /**
   * Share PDF using Web Share API or fallback methods
   */
  static async sharePDF(
    bucketName: string,
    filePath: string,
    fileName: string,
    shareTitle?: string,
    shareText?: string
  ): Promise<PDFOperationResult> {
    try {
      console.log('🔗 Sharing PDF:', { bucketName, filePath, fileName })

      const result = await this.downloadPDF(bucketName, filePath, fileName)
      
      if (!result.success || !result.blob) {
        return result
      }

      // Method 1: Web Share API (if supported)
      if (navigator.share && navigator.canShare) {
        const file = new File([result.blob], fileName, { type: 'application/pdf' })
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: shareTitle || `PDF Document: ${fileName}`,
            text: shareText || `Sharing PDF document: ${fileName}`,
            files: [file]
          })

          console.log('✅ PDF shared via Web Share API')
          return {
            success: true,
            data: 'Shared via Web Share API',
            blob: result.blob
          }
        }
      }

      // Method 2: Create shareable URL and copy to clipboard
      const url = URL.createObjectURL(result.blob)
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        console.log('✅ PDF URL copied to clipboard')
        
        // Clean up after 30 seconds
        setTimeout(() => URL.revokeObjectURL(url), 30000)

        return {
          success: true,
          data: 'URL copied to clipboard',
          blob: result.blob
        }
      }

      // Method 3: Fallback - return blob for custom handling
      console.log('ℹ️ Web Share and Clipboard not supported, returning blob for custom handling')
      return {
        success: true,
        data: 'Blob ready for custom sharing',
        blob: result.blob
      }

    } catch (error: any) {
      console.error('❌ PDF sharing failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to share PDF'
      }
    }
  }

  /**
   * Create printable version of PDF
   */
  static async printPDF(
    bucketName: string,
    filePath: string,
    fileName: string
  ): Promise<PDFOperationResult> {
    try {
      console.log('🖨️ Preparing PDF for printing:', fileName)

      const result = await this.downloadPDF(bucketName, filePath, fileName)
      
      if (!result.success || !result.blob) {
        return result
      }

      // Create object URL for printing
      const url = URL.createObjectURL(result.blob)

      // Create hidden iframe for printing
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      printFrame.src = url
      
      document.body.appendChild(printFrame)
      
      return new Promise((resolve) => {
        printFrame.onload = () => {
          try {
            printFrame.contentWindow?.print()
            console.log('✅ PDF print dialog opened')
            
            // Clean up after printing
            setTimeout(() => {
              document.body.removeChild(printFrame)
              URL.revokeObjectURL(url)
            }, 1000)

            resolve({
              success: true,
              data: 'Print dialog opened',
              blob: result.blob
            })

          } catch (error: any) {
            resolve({
              success: false,
              error: `Print failed: ${error.message}`
            })
          }
        }

        printFrame.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load PDF for printing'
          })
        }
      })

    } catch (error: any) {
      console.error('❌ PDF printing failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to print PDF'
      }
    }
  }

  /**
   * Get PDF metadata and information
   */
  static async getPDFInfo(
    bucketName: string,
    filePath: string
  ): Promise<PDFOperationResult> {
    try {
      console.log('ℹ️ Getting PDF info:', { bucketName, filePath })

      // Get file info from storage
      const { data: listData, error: listError } = await supabase.storage
        .from(bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        })

      if (listError) {
        return {
          success: false,
          error: `Failed to get file info: ${listError.message}`
        }
      }

      const fileInfo = listData?.[0]
      if (!fileInfo) {
        return {
          success: false,
          error: 'File not found'
        }
      }

      console.log('✅ PDF info retrieved:', fileInfo)

      return {
        success: true,
        data: {
          name: fileInfo.name,
          size: fileInfo.metadata?.size || 0,
          lastModified: fileInfo.updated_at || fileInfo.created_at,
          contentType: fileInfo.metadata?.mimetype || 'application/pdf',
          path: filePath,
          bucket: bucketName
        }
      }

    } catch (error: any) {
      console.error('❌ Failed to get PDF info:', error)
      return {
        success: false,
        error: error.message || 'Failed to get PDF info'
      }
    }
  }

  /**
   * Create preview thumbnail of PDF (first page)
   */
  static async createPDFThumbnail(
    bucketName: string,
    filePath: string,
    maxWidth: number = 200,
    maxHeight: number = 300
  ): Promise<PDFOperationResult> {
    try {
      console.log('🖼️ Creating PDF thumbnail:', { bucketName, filePath })

      const result = await this.downloadPDF(bucketName, filePath)
      
      if (!result.success || !result.blob) {
        return result
      }

      // This would require pdf.js for thumbnail generation
      // For now, return a placeholder or the PDF blob itself
      console.log('ℹ️ PDF thumbnail generation requires pdf.js implementation')

      return {
        success: true,
        data: {
          message: 'Thumbnail generation not implemented yet',
          originalBlob: result.blob
        },
        blob: result.blob
      }

    } catch (error: any) {
      console.error('❌ PDF thumbnail creation failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to create PDF thumbnail'
      }
    }
  }

  /**
   * List all PDFs in a storage path
   */
  static async listPDFs(
    bucketName: string,
    folderPath: string = ''
  ): Promise<PDFOperationResult> {
    try {
      console.log('📂 Listing PDFs:', { bucketName, folderPath })

      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folderPath, {
          limit: 100,
          sortBy: { column: 'updated_at', order: 'desc' }
        })

      if (error) {
        return {
          success: false,
          error: `Failed to list files: ${error.message}`
        }
      }

      // Filter for PDF files only
      const pdfFiles = data
        .filter(file => 
          file.name.toLowerCase().endsWith('.pdf') || 
          file.metadata?.mimetype === 'application/pdf'
        )
        .map(file => ({
          id: file.id || file.name,
          name: file.name,
          path: folderPath ? `${folderPath}/${file.name}` : file.name,
          bucket: bucketName,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'application/pdf',
          createdAt: new Date(file.created_at || ''),
          updatedAt: new Date(file.updated_at || ''),
          metadata: file.metadata
        }))

      console.log('✅ PDFs listed:', pdfFiles.length, 'files found')

      return {
        success: true,
        data: pdfFiles
      }

    } catch (error: any) {
      console.error('❌ Failed to list PDFs:', error)
      return {
        success: false,
        error: error.message || 'Failed to list PDFs'
      }
    }
  }

  /**
   * Batch operations on multiple PDFs
   */
  static async batchOperation(
    operation: 'download' | 'share' | 'print',
    files: Array<{ bucketName: string; filePath: string; fileName: string }>
  ): Promise<PDFOperationResult> {
    try {
      console.log('🔄 Performing batch PDF operation:', operation, files.length, 'files')

      const results = []

      for (const file of files) {
        let result: PDFOperationResult

        switch (operation) {
          case 'download':
            result = await this.downloadPDFToBrowser(file.bucketName, file.filePath, file.fileName)
            break
          case 'share':
            result = await this.sharePDF(file.bucketName, file.filePath, file.fileName)
            break
          case 'print':
            result = await this.printPDF(file.bucketName, file.filePath, file.fileName)
            break
          default:
            result = { success: false, error: 'Unknown operation' }
        }

        results.push({
          file: file.fileName,
          success: result.success,
          error: result.error
        })

        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const successCount = results.filter(r => r.success).length
      console.log(`✅ Batch operation completed: ${successCount}/${files.length} successful`)

      return {
        success: successCount > 0,
        data: {
          results,
          successCount,
          totalCount: files.length
        }
      }

    } catch (error: any) {
      console.error('❌ Batch PDF operation failed:', error)
      return {
        success: false,
        error: error.message || 'Batch operation failed'
      }
    }
  }

  /**
   * Utility: Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Utility: Check if browser supports PDF viewing
   */
  static checkPDFSupport(): boolean {
    try {
      const mimeTypes = navigator.mimeTypes as any
      const hasPDFSupport = 
        mimeTypes && 
        mimeTypes['application/pdf'] && 
        mimeTypes['application/pdf'].enabledPlugin

      console.log('🔍 PDF support check:', hasPDFSupport ? 'Supported' : 'Not supported')
      return !!hasPDFSupport
    } catch (error) {
      console.log('🔍 PDF support check failed:', error)
      return false
    }
  }
}

export default PDFService