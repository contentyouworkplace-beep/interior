"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Image, 
  FileSpreadsheet,
  File,
  Calendar,
  Filter,
  Loader2,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ClientFileService, ClientFile } from "@/lib/services/client-files"
import { createClient } from '@/lib/supabase/client'
import { DeleteFileDialog } from "@/components/delete-file-dialog"
// Removed ShareFileDialog per requirement to remove share option

interface ViewFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

export function ViewFilesDialog({
  open,
  onOpenChange,
  clientId,
  clientName
}: ViewFilesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [files, setFiles] = useState<ClientFile[]>([])
  const [loading, setLoading] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<ClientFile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  // Inline viewer state
  const [preview, setPreview] = useState<{ file: ClientFile; url: string } | null>(null)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const { toast } = useToast()
  
  const clientFileService = new ClientFileService()
  const supabase = createClient()

  // Fetch files when dialog opens
  useEffect(() => {
    if (open && clientId) {
      fetchFiles()
      fetchClientInfo()
    }
  }, [open, clientId])

  const fetchClientInfo = async () => {
    try {
      const result = await clientFileService.getClientContactInfo(clientId)
      if (result.success && result.client) {
        setClientInfo(result.client)
      }
    } catch (error) {
      console.error('Error fetching client info:', error)
    }
  }

  const fetchFiles = async () => {
    setLoading(true)
    try {
      // First try to get files from database
      const result = await clientFileService.getClientFiles(clientId)
      if (result.success && result.files && result.files.length > 0) {
        setFiles(result.files)
      } else {
        // If no files in database, try to list files from storage directly
        console.log('No files in database, checking storage...')
        
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('client-files')
          .list(`${clientId}/`, { limit: 100 })
        
        if (storageError) {
          console.error('Storage list error:', storageError)
          throw new Error('Failed to list files from storage')
        }
        
        // Convert storage files to ClientFile format
        const convertedFiles: ClientFile[] = storageFiles
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => {
            const { data: urlData } = supabase.storage
              .from('client-files')
              .getPublicUrl(`${clientId}/${file.name}`)
            
            return {
              id: crypto.randomUUID(), // Generate proper UUID for storage files
              client_id: clientId,
              user_id: 'unknown',
              filename: file.name,
              file_url: urlData.publicUrl,
              file_type: file.metadata?.mimetype || 'application/octet-stream',
              file_size: file.metadata?.size || 0,
              category: 'other' as const,
              description: '',
              uploaded_by: 'unknown',
              created_at: file.created_at || new Date().toISOString(),
              storage_path: `${clientId}/${file.name}` // Add storage path for proper file operations
            }
          })
        
        setFiles(convertedFiles)
        console.log(`Found ${convertedFiles.length} files in storage`)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeDisplay = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('image')) return 'Image'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Excel'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Document'
    return 'File'
  }

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'document':
        return <FileText className="h-5 w-5 text-red-500" />
      case 'image':
        return <Image className="h-5 w-5 text-purple-500" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      document: 'bg-red-100 text-red-800',
      image: 'bg-purple-100 text-purple-800',
      spreadsheet: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !categoryFilter || file.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleDownload = async (file: ClientFile) => {
    try {
      console.log('Download clicked for file:', file)
      
      // Use storage-specific download for files loaded from storage
      const result = file.storage_path 
        ? await clientFileService.downloadFileFromStorage(file)
        : await clientFileService.downloadFile(file.id)
      
      if (result.success) {
        toast({
          title: "Download started",
          description: `Downloading ${file.filename}...`
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: "Unable to download file. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = (file: ClientFile) => {
    console.log('Delete clicked for file:', file)
    setFileToDelete(file)
  }

  const confirmDelete = async (fileId: string) => {
    setIsDeleting(true)
    try {
      const file = files.find(f => f.id === fileId)
      if (!file) {
        throw new Error('File not found')
      }

      if (file.storage_path) {
        // Delete storage-only file directly from storage
        const { error } = await supabase.storage
          .from('client-files')
          .remove([file.storage_path])
        
        if (error) {
          throw new Error(error.message)
        }
      } else {
        // Delete database file using service
        const result = await clientFileService.deleteFile(fileId)
        if (!result.success) {
          throw new Error(result.error)
        }
      }

      setFiles(prev => prev.filter(f => f.id !== fileId))
      toast({
        title: "File deleted",
        description: `File has been deleted successfully.`,
        variant: "destructive"
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete failed",
        description: "Unable to delete file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePreview = async (file: ClientFile) => {
    try {
      console.log('Preview clicked for file:', file)
      let url: string | null = null

      // Prefer a signed URL for storage objects
      if (file.storage_path) {
        const { data: signed, error } = await supabase.storage
          .from('client-files')
          .createSignedUrl(file.storage_path, 3600)
        if (error) throw new Error(error.message)
        url = signed.signedUrl
      } else {
        // For database files, use service method to resolve a view URL
        const result = await clientFileService.getViewUrl(file.id)
        if (!result.success || !result.url) throw new Error(result.error)
        url = result.url
      }

      if (!url) throw new Error('Unable to resolve preview URL')

      // Open inline viewer
      setPreview({ file, url })
    } catch (error) {
      console.error('Preview error:', error)
      toast({
        title: "Preview failed",
        description: "Unable to preview file. Please try again.",
        variant: "destructive"
      })
    }
  }

  const categories = [
    { value: 'document', label: 'Documents', count: files.filter(f => f.category === 'document').length },
    { value: 'image', label: 'Images', count: files.filter(f => f.category === 'image').length },
    { value: 'spreadsheet', label: 'Spreadsheets', count: files.filter(f => f.category === 'spreadsheet').length },
    { value: 'other', label: 'Other', count: files.filter(f => f.category === 'other').length }
  ]

  const totalSize = files.reduce((total, file) => total + file.file_size, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Files for {clientName}</DialogTitle>
          <DialogDescription>
            View, download, and manage all files for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={categoryFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(null)}
              >
                All ({files.length})
              </Button>
              {categories.map(category => (
                <Button
                  key={category.value}
                  variant={categoryFilter === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(category.value)}
                >
                  {category.label} ({category.count})
                </Button>
              ))}
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files found</p>
                {searchQuery && (
                  <p className="text-sm">Try adjusting your search or filters</p>
                )}
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  {getFileIcon(file.category)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium truncate">{file.filename}</p>
                      <Badge className={getCategoryBadge(file.category)}>
                        {getFileTypeDisplay(file.file_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                      <span>•</span>
                      <span>by {file.uploaded_by}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Preview clicked for file:', file)
                        handlePreview(file)
                      }}
                      title="Preview file"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Download clicked for file:', file)
                        handleDownload(file)
                      }}
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {/* Share action removed as requested */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Delete clicked for file:', file)
                        handleDelete(file)
                      }}
                      title="Delete file"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
            <span>
              {filteredFiles.length} of {files.length} files
            </span>
            <span>
              Total size: {formatFileSize(totalSize)}
            </span>
          </div>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <DeleteFileDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        file={fileToDelete}
        onConfirmDelete={confirmDelete}
        isDeleting={isDeleting}
      />

      {/* Inline Viewer Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="min-w-0 pr-2">
              <DialogTitle className="truncate">{preview?.file.filename}</DialogTitle>
              <DialogDescription className="truncate">
                {preview?.file.file_type}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {preview && (
                <Button size="sm" variant="outline" onClick={() => handleDownload(preview.file)}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => setPreview(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="bg-black/5 flex items-center justify-center" style={{ minHeight: 400 }}>
            {preview && (
              <div className="w-full h-[70vh] max-h-[70vh]">
                {preview.file.file_type.includes('image') ? (
                  // Image preview
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.url}
                    alt={preview.file.filename}
                    className="object-contain w-full h-full"
                  />
                ) : preview.file.file_type.includes('video') ? (
                  // Video preview
                  <video
                    src={preview.url}
                    className="object-contain w-full h-full bg-black"
                    controls
                  />
                ) : preview.file.file_type.includes('pdf') ? (
                  // PDF preview
                  <iframe
                    src={`${preview.url}#toolbar=1&navpanes=0`}
                    className="w-full h-full bg-white"
                    title={preview.file.filename}
                  />
                ) : (
                  // Unsupported type
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <File className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="mb-2">Preview not available for this file type.</p>
                    <Button onClick={() => handleDownload(preview.file)}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}