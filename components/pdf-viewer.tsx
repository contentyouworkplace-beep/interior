/**
 * Advanced PDF Viewer Component
 * Features: Inline viewing, direct download, sharing, print
 * Works with Supabase storage without exposing URLs
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Share2, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  Eye,
  FileText,
  X,
  RefreshCw
} from 'lucide-react'

const supabase = createClient()

interface PDFViewerProps {
  fileUrl?: string
  filePath?: string
  bucketName: string
  fileName: string
  isOpen: boolean
  onClose: () => void
  onDownload?: (blob: Blob, fileName: string) => void
  onShare?: (blob: Blob, fileName: string) => void
}

interface PDFViewerState {
  loading: boolean
  error: string | null
  pdfBlob: Blob | null
  pdfUrl: string | null
  currentPage: number
  totalPages: number
  zoom: number
  rotation: number
  isFullscreen: boolean
}

export function PDFViewer({
  fileUrl,
  filePath,
  bucketName,
  fileName,
  isOpen,
  onClose,
  onDownload,
  onShare
}: PDFViewerProps) {
  const [state, setState] = useState<PDFViewerState>({
    loading: false,
    error: null,
    pdfBlob: null,
    pdfUrl: null,
    currentPage: 1,
    totalPages: 0,
    zoom: 1,
    rotation: 0,
    isFullscreen: false
  })

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load PDF from Supabase storage
  const loadPDFFromStorage = async () => {
    if (!filePath && !fileUrl) return

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      console.log('🔍 Loading PDF from storage...', { filePath, bucketName, fileName })

      let blob: Blob

      if (filePath) {
        // Download directly from storage using file path
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filePath)

        if (error) {
          console.error('❌ Storage download error:', error)
          throw new Error(`Failed to download PDF: ${error.message}`)
        }

        blob = data
      } else if (fileUrl) {
        // Fetch from public URL if provided
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`)
        }
        blob = await response.blob()
      } else {
        throw new Error('No file path or URL provided')
      }

      // Verify it's a PDF
      if (blob.type !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
        throw new Error('File is not a PDF document')
      }

      // Create object URL for viewing
      const pdfUrl = URL.createObjectURL(blob)

      setState(prev => ({
        ...prev,
        loading: false,
        pdfBlob: blob,
        pdfUrl: pdfUrl,
        error: null
      }))

      console.log('✅ PDF loaded successfully:', {
        size: blob.size,
        type: blob.type,
        fileName
      })

    } catch (error: any) {
      console.error('❌ PDF loading failed:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load PDF'
      }))
    }
  }

  // Handle PDF download
  const handleDownload = async () => {
    if (!state.pdfBlob) return

    try {
      console.log('📥 Downloading PDF:', fileName)

      // Create download link
      const url = URL.createObjectURL(state.pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)

      // Call custom download handler if provided
      if (onDownload) {
        onDownload(state.pdfBlob, fileName)
      }

      console.log('✅ PDF download initiated')

    } catch (error) {
      console.error('❌ PDF download failed:', error)
    }
  }

  // Handle PDF sharing
  const handleShare = async () => {
    if (!state.pdfBlob) return

    try {
      console.log('🔗 Sharing PDF:', fileName)

      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare) {
        const file = new File([state.pdfBlob], fileName, { type: 'application/pdf' })
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `PDF Document: ${fileName}`,
            text: `Sharing PDF document: ${fileName}`,
            files: [file]
          })
          console.log('✅ PDF shared via Web Share API')
          return
        }
      }

      // Fallback: Copy PDF data URL to clipboard
      const url = URL.createObjectURL(state.pdfBlob)
      await navigator.clipboard.writeText(url)
      
      // Show notification (you can customize this)
      console.log('✅ PDF URL copied to clipboard')
      
      // Clean up after some time
      setTimeout(() => URL.revokeObjectURL(url), 30000)

      // Call custom share handler if provided
      if (onShare) {
        onShare(state.pdfBlob, fileName)
      }

    } catch (error) {
      console.error('❌ PDF sharing failed:', error)
    }
  }

  // Handle PDF printing
  const handlePrint = () => {
    if (!state.pdfUrl) return

    try {
      console.log('🖨️ Printing PDF:', fileName)

      // Create hidden iframe for printing
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      printFrame.src = state.pdfUrl
      
      document.body.appendChild(printFrame)
      
      printFrame.onload = () => {
        printFrame.contentWindow?.print()
        
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }

      console.log('✅ PDF print dialog opened')

    } catch (error) {
      console.error('❌ PDF printing failed:', error)
    }
  }

  // Handle zoom
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    setState(prev => {
      let newZoom = prev.zoom
      
      switch (direction) {
        case 'in':
          newZoom = Math.min(prev.zoom + 0.25, 3)
          break
        case 'out':
          newZoom = Math.max(prev.zoom - 0.25, 0.25)
          break
        case 'reset':
          newZoom = 1
          break
      }
      
      return { ...prev, zoom: newZoom }
    })
  }

  // Handle rotation
  const handleRotate = () => {
    setState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }))
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setState(prev => ({
      ...prev,
      isFullscreen: !prev.isFullscreen
    }))
  }

  // Load PDF when dialog opens
  useEffect(() => {
    if (isOpen && (filePath || fileUrl)) {
      loadPDFFromStorage()
    }
  }, [isOpen, filePath, fileUrl, bucketName])

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && state.pdfUrl) {
      URL.revokeObjectURL(state.pdfUrl)
      setState(prev => ({
        ...prev,
        pdfBlob: null,
        pdfUrl: null,
        error: null
      }))
    }
  }, [isOpen])

  // File size formatter
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          state.isFullscreen 
            ? 'max-w-screen max-h-screen w-screen h-screen' 
            : 'max-w-5xl max-h-[90vh] w-[90vw] h-[80vh]'
        } p-0 overflow-hidden`}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-red-600" />
              <div>
                <DialogTitle className="text-lg font-semibold">{fileName}</DialogTitle>
                {state.pdfBlob && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      PDF Document
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(state.pdfBlob.size)}
                    </Badge>
                    {state.totalPages > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {state.totalPages} pages
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="hidden sm:flex"
            >
              {state.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex-shrink-0 px-6 py-3 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('out')}
                disabled={state.zoom <= 0.25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-mono min-w-[60px] text-center">
                {Math.round(state.zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom('in')}
                disabled={state.zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              {/* Rotation */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Reload */}
              <Button
                variant="outline"
                size="sm"
                onClick={loadPDFFromStorage}
                disabled={state.loading}
              >
                <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
              </Button>
              
              {/* Print */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!state.pdfUrl}
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Print</span>
              </Button>
              
              {/* Share */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={!state.pdfBlob}
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Share</span>
              </Button>
              
              {/* Download */}
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={!state.pdfBlob}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Download</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {state.loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-semibold mb-2">Loading PDF...</p>
              <p className="text-sm text-gray-600">Please wait while we load your document</p>
              <Progress className="w-64 mt-4" />
            </div>
          )}

          {state.error && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <X className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-lg font-semibold mb-2 text-red-600">Failed to Load PDF</p>
              <p className="text-sm text-gray-600 mb-4">{state.error}</p>
              <Button onClick={loadPDFFromStorage} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {state.pdfUrl && !state.loading && !state.error && (
            <div className="flex-1 overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`${state.pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-0"
                style={{
                  transform: `scale(${state.zoom}) rotate(${state.rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                title={`PDF Viewer - ${fileName}`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {state.pdfBlob && (
                <>
                  <span>PDF Document</span>
                  <span>•</span>
                  <span>{formatFileSize(state.pdfBlob.size)}</span>
                </>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PDFViewer