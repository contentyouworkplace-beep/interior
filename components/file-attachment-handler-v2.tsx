/**
 * File Attachment Handler Component - Compact Version
 * Universal file viewer, downloader, and sharing component
 * Supports all file types with appropriate handlers
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import PDFViewer from './pdf-viewer'
import UniversalFileService from '@/lib/services/universal-file-service'
import { 
  Download, 
  Share2, 
  Printer, 
  Eye, 
  FileText, 
  Image as ImageIcon,
  File,
  MoreVertical,
  ExternalLink,
  FileSpreadsheet,
  Loader2
} from 'lucide-react'

interface FileAttachment {
  id: string
  name: string
  storage_path?: string
  path?: string
  url?: string
  type?: string
  size?: number
  bucket?: string
}

interface FileAttachmentHandlerProps {
  files: FileAttachment[]
  bucketName?: string
  title?: string
  className?: string
  compact?: boolean
  showBatchActions?: boolean
}

export function FileAttachmentHandler({
  files,
  bucketName = 'expense-documents-new',
  title = 'Attachments',
  className = '',
  compact = false,
  showBatchActions = false
}: FileAttachmentHandlerProps) {
  const [selectedPDF, setSelectedPDF] = useState<FileAttachment | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)
  const { toast } = useToast()

  // Helper to detect file type and get config
  const getFileConfig = (file: FileAttachment) => {
    const config = UniversalFileService.detectFileType(file.name, file.type)
    return {
      ...config,
      icon: getFileIcon(config.category),
      color: getFileColor(config.category)
    }
  }

  // Get file icon based on category
  const getFileIcon = (category: string) => {
    const iconProps = compact ? "h-3 w-3" : "h-4 w-4"
    
    switch (category) {
      case 'pdf':
        return <FileText className={`${iconProps} text-red-600`} />
      case 'image':
        return <ImageIcon className={`${iconProps} text-green-600`} />
      case 'excel':
        return <FileSpreadsheet className={`${iconProps} text-emerald-600`} />
      case 'word':
        return <FileText className={`${iconProps} text-blue-600`} />
      case 'text':
        return <FileText className={`${iconProps} text-purple-600`} />
      default:
        return <File className={`${iconProps} text-gray-600`} />
    }
  }

  // Get file color for badge
  const getFileColor = (category: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (category) {
      case 'pdf': return 'destructive'
      case 'image': return 'default'
      case 'excel': return 'secondary'
      default: return 'outline'
    }
  }

  // Set loading state for specific file
  const setFileLoading = (fileId: string, loading: boolean) => {
    setLoadingFiles(prev => {
      const newSet = new Set(prev)
      if (loading) {
        newSet.add(fileId)
      } else {
        newSet.delete(fileId)
      }
      return newSet
    })
  }

  // Build file config for service
  const buildFileConfig = (file: FileAttachment) => ({
    bucketName: file.bucket || bucketName,
    filePath: file.storage_path || file.path || file.id,
    fileName: file.name,
    mimeType: file.type
  })

  // Handle file viewing
  const handleView = async (file: FileAttachment) => {
    const fileConfig = getFileConfig(file)
    
    if (fileConfig.category === 'pdf') {
      setSelectedPDF(file)
      setIsViewerOpen(true)
      return
    }

    // For other viewable files, try to view in browser
    if (fileConfig.viewable) {
      setFileLoading(file.id, true)
      
      try {
        const result = await UniversalFileService.openInNewTab(buildFileConfig(file))
        
        if (!result.success) {
          // Fallback to download
          await handleDownload(file)
          toast({
            title: "File opened",
            description: "File downloaded as it cannot be viewed directly in browser",
            variant: "default",
          })
        }
      } catch (error) {
        console.error('View error:', error)
        toast({
          title: "Error",
          description: "Failed to view file",
          variant: "destructive",
        })
      } finally {
        setFileLoading(file.id, false)
      }
    } else {
      // Non-viewable files are downloaded
      await handleDownload(file)
    }
  }

  // Handle file download
  const handleDownload = async (file: FileAttachment) => {
    setFileLoading(file.id, true)
    
    try {
      const result = await UniversalFileService.downloadFile(buildFileConfig(file))
      
      if (result.success) {
        toast({
          title: "Download started",
          description: `Downloading ${file.name}`,
          variant: "default",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      })
    } finally {
      setFileLoading(file.id, false)
    }
  }

  // Handle file sharing
  const handleShare = async (file: FileAttachment) => {
    setFileLoading(file.id, true)
    
    try {
      const result = await UniversalFileService.shareFile(buildFileConfig(file))
      
      if (result.success) {
        toast({
          title: "File shared",
          description: `Shared ${file.name}`,
          variant: "default",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Share error:', error)
      toast({
        title: "Share failed",
        description: "Failed to share file",
        variant: "destructive",
      })
    } finally {
      setFileLoading(file.id, false)
    }
  }

  // Handle file printing
  const handlePrint = async (file: FileAttachment) => {
    const fileConfig = getFileConfig(file)
    
    if (!fileConfig.printable) {
      toast({
        title: "Cannot print",
        description: "This file type cannot be printed directly",
        variant: "destructive",
      })
      return
    }

    setFileLoading(file.id, true)
    
    try {
      const result = await UniversalFileService.printFile(buildFileConfig(file))
      
      if (result.success) {
        toast({
          title: "Print dialog opened",
          description: `Printing ${file.name}`,
          variant: "default",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Print error:', error)
      toast({
        title: "Print failed",
        description: "Failed to print file",
        variant: "destructive",
      })
    } finally {
      setFileLoading(file.id, false)
    }
  }

  // Handle open in new tab
  const handleOpenInNewTab = async (file: FileAttachment) => {
    setFileLoading(file.id, true)
    
    try {
      const result = await UniversalFileService.openInNewTab(buildFileConfig(file))
      
      if (!result.success) {
        // Fallback to download
        await handleDownload(file)
        toast({
          title: "File opened",
          description: "File downloaded as it cannot be opened in browser",
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Open in new tab error:', error)
      toast({
        title: "Error",
        description: "Failed to open file in new tab",
        variant: "destructive",
      })
    } finally {
      setFileLoading(file.id, false)
    }
  }

  // Handle batch operations
  const handleBatchOperation = async (operation: 'download' | 'share' | 'print') => {
    setBatchLoading(true)
    
    try {
      const fileConfigs = files.map(buildFileConfig)
      const result = await UniversalFileService.batchOperation(operation, fileConfigs)
      
      if (result.success && result.data) {
        const batchResult = result.data as { successful: number; failed: number; total: number; errors: string[] }
        toast({
          title: `Batch ${operation} completed`,
          description: `${batchResult.successful}/${batchResult.total} files processed successfully`,
          variant: batchResult.successful === batchResult.total ? "default" : "destructive",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error(`Batch ${operation} error:`, error)
      toast({
        title: `Batch ${operation} failed`,
        description: "Failed to process files",
        variant: "destructive",
      })
    } finally {
      setBatchLoading(false)
    }
  }

  if (!files || files.length === 0) {
    return (
      <div className={`${compact ? 'p-2' : 'p-4'} text-center text-gray-500 ${className}`}>
        <File className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} mx-auto mb-2 opacity-50`} />
        <p className={`${compact ? 'text-xs' : 'text-sm'}`}>No attachments</p>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!compact && <h3 className="text-lg font-semibold">{title}</h3>}
          <Badge variant="outline" className={compact ? "text-xs px-1.5 py-0.5" : ""}>
            {files.length} file{files.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {/* Batch Operations */}
        {showBatchActions && files.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size={compact ? "sm" : "sm"} 
                disabled={batchLoading}
                className={compact ? "h-7 px-2 text-xs" : ""}
              >
                {batchLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MoreVertical className="h-3 w-3" />
                )}
                {!compact && <span className="ml-1">Batch</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBatchOperation('download')}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchOperation('share')}>
                <Share2 className="h-4 w-4 mr-2" />
                Share All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchOperation('print')}>
                <Printer className="h-4 w-4 mr-2" />
                Print All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* File List */}
      <div className={`grid ${compact ? 'gap-1' : 'gap-3'}`}>
        {files.map((file, index) => {
          const fileConfig = getFileConfig(file)
          const isLoading = loadingFiles.has(file.id)
          
          return (
            <div
              key={file.id || index}
              className={`flex items-center justify-between ${
                compact 
                  ? 'p-2 border rounded hover:bg-gray-50' 
                  : 'p-3 border rounded-lg hover:shadow-sm transition-shadow'
              } bg-white`}
            >
              {/* File Info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {fileConfig.icon}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge 
                      variant={fileConfig.color} 
                      className={compact ? "text-xs px-1 py-0" : "text-xs"}
                    >
                      {fileConfig.category.toUpperCase()}
                    </Badge>
                    {file.size && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className={`text-gray-600 ${compact ? 'text-xs' : 'text-xs'}`}>
                          {UniversalFileService.formatFileSize(file.size)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-2">
                {/* View Button */}
                <Button
                  variant="outline"
                  size={compact ? "sm" : "sm"}
                  onClick={() => handleView(file)}
                  disabled={isLoading}
                  className={compact ? "h-7 px-2" : ""}
                >
                  {isLoading ? (
                    <Loader2 className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} animate-spin`} />
                  ) : (
                    <Eye className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                  )}
                  {!compact && <span className="hidden sm:inline ml-1">View</span>}
                </Button>

                {/* More Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size={compact ? "sm" : "sm"} 
                      disabled={isLoading}
                      className={compact ? "h-7 px-2" : ""}
                    >
                      <MoreVertical className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenInNewTab(file)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(file)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    {fileConfig.printable && (
                      <DropdownMenuItem onClick={() => handlePrint(file)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>

      {/* PDF Viewer Dialog */}
      {selectedPDF && (
        <PDFViewer
          filePath={selectedPDF.storage_path || selectedPDF.path}
          fileUrl={selectedPDF.url}
          bucketName={bucketName}
          fileName={selectedPDF.name}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false)
            setSelectedPDF(null)
          }}
          onDownload={(blob, fileName) => {
            toast({
              title: "PDF Downloaded",
              description: `Downloaded ${fileName}`,
              variant: "default",
            })
          }}
          onShare={(blob, fileName) => {
            toast({
              title: "PDF Shared",
              description: `Shared ${fileName}`,
              variant: "default",
            })
          }}
        />
      )}
    </div>
  )
}

export default FileAttachmentHandler