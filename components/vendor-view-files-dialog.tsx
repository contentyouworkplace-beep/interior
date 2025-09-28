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
  Share2,
  FileText, 
  Image, 
  FileSpreadsheet,
  File,
  Calendar,
  Filter,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VendorFile {
  id: string
  vendor_id: string
  user_id: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  category: string | null
  description: string | null
  created_at: string
  updated_at: string
}

interface VendorViewFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  vendorName: string
}

export function VendorViewFilesDialog({
  open,
  onOpenChange,
  vendorId,
  vendorName
}: VendorViewFilesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [files, setFiles] = useState<VendorFile[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const fetchFiles = async () => {
    if (!vendorId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/files`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }
      
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && vendorId) {
      fetchFiles()
    }
  }, [open, vendorId])

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchQuery || 
      file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !categoryFilter || file.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const uniqueCategories = [...new Set(files.map(f => f.category).filter(Boolean))]

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = async (file: VendorFile) => {
    try {
      // This would need to be implemented based on your file storage solution
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(file.file_path)}`)
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/vendors/${vendorId}/files?fileId=${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Refresh files list
      await fetchFiles()
      
      toast({
        title: "Success",
        description: "File deleted successfully.",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Files for {vendorName}</DialogTitle>
          <DialogDescription>
            View and manage all files associated with this vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {uniqueCategories.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant={categoryFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(null)}
                >
                  All
                </Button>
                {uniqueCategories.map(category => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Files List */}
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading files...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {files.length === 0 ? 'No files uploaded yet.' : 'No files match your search.'}
              </div>
            ) : (
              <div className="divide-y">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50"
                  >
                    {getFileIcon(file.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={file.original_filename}>
                        {file.original_filename}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(file.file_size)}</span>
                        {file.category && (
                          <Badge variant="secondary" className="text-xs">
                            {file.category}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {file.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate" title={file.description}>
                          {file.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(file)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {files.length > 0 && (
            <div className="text-sm text-muted-foreground text-center pt-2 border-t">
              Showing {filteredFiles.length} of {files.length} files
              {files.length > 0 && (
                <span className="ml-4">
                  Total size: {formatFileSize(files.reduce((acc, file) => acc + file.file_size, 0))}
                </span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}