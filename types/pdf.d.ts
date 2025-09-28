/**
 * PDF Handling Type Declarations
 */

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

export interface FileAttachment {
  id?: string
  name: string
  path?: string
  url?: string
  type?: string
  size?: number
  bucket: string
}

export type PDFOperation = 'download' | 'share' | 'print'
export type FileType = 'pdf' | 'image' | 'other'
