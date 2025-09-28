"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AlertCircle, Download, Files, Eye, Trash2, Search, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow, format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface VendorFile {
  id: string
  vendor_id: string
  filename: string
  file_name: string
  original_filename: string
  file_path: string
  file_type?: string
  mime_type: string
  file_size: number
  uploaded_at: string
  created_at: string
  description?: string | null
  download_url?: string
  url_error?: string
}

interface ViewVendorFilesDialogProps {
  vendorId: string
  vendorName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewVendorFilesDialog({
  vendorId,
  vendorName,
  open,
  onOpenChange,
}: ViewVendorFilesDialogProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const [files, setFiles] = useState<VendorFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<VendorFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (open) {
      fetchVendorFiles()
    }
  }, [open, vendorId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFiles(files)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredFiles(
        files.filter(
          file =>
            (file.original_filename || '').toLowerCase().includes(query) ||
            (file.mime_type || '').toLowerCase().includes(query) ||
            (file.description && file.description.toLowerCase().includes(query))
        )
      )
    }
  }, [searchQuery, files])

  const fetchVendorFiles = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use the new API endpoint that includes signed URLs
      const response = await fetch(`/api/vendor-files?vendorId=${vendorId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch files')
      }
      
      setFiles(result.data || [])
      setFilteredFiles(result.data || [])
    } catch (error: any) {
      console.error("Error fetching vendor files:", error)
      setError(error.message || "Failed to load vendor files")
      toast({
        title: "Error",
        description: "Could not load vendor files. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (file: VendorFile) => {
    try {
      if (!file.download_url) {
        throw new Error('Download URL not available')
      }
      
      // Create a link and click it programmatically
      const link = document.createElement('a')
      link.href = file.download_url
      link.download = file.original_filename || file.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error: any) {
      console.error("Error downloading file:", error)
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the file",
        variant: "destructive",
      })
    }
  }

  const viewFile = async (file: VendorFile) => {
    try {
      if (!file.download_url) {
        throw new Error('File URL not available')
      }
      
      // Open in a new tab
      window.open(file.download_url, '_blank')
    } catch (error: any) {
      console.error("Error viewing file:", error)
      toast({
        title: "Error",
        description: error.message || "Could not open the file for viewing",
        variant: "destructive",
      })
    }
  }

  const shareFile = async (file: VendorFile) => {
    try {
      if (!file.download_url) {
        throw new Error('File URL not available')
      }
      
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: `File: ${file.original_filename}`,
          text: `Sharing file from ${vendorName}`,
          url: file.download_url,
        })
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(file.download_url)
        toast({
          title: "Link Copied",
          description: "File link has been copied to clipboard",
        })
      }
    } catch (error: any) {
      console.error("Error sharing file:", error)
      toast({
        title: "Share Failed",
        description: error.message || "Could not share the file",
        variant: "destructive",
      })
    }
  }

  const deleteFile = async (file: VendorFile) => {
    if (!confirm(`Are you sure you want to delete ${file.original_filename}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/vendor-files?fileId=${file.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete file')
      }
      
      // Update the UI
      setFiles(prev => prev.filter(f => f.id !== file.id))
      setFilteredFiles(prev => prev.filter(f => f.id !== file.id))
      
      toast({
        title: "File Deleted",
        description: `${file.original_filename} has been deleted successfully`,
      })
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete the file",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  const getFileTypeIcon = (fileType: string | undefined | null) => {
    if (!fileType) return '📁'
    const type = fileType.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return '🖼️'
    if (['pdf'].includes(type)) return '📄'
    if (['doc', 'docx'].includes(type)) return '📝'
    if (['xls', 'xlsx', 'csv'].includes(type)) return '📊'
    if (['ppt', 'pptx'].includes(type)) return '📊'
    if (['zip', 'rar', '7z'].includes(type)) return '🗃️'
    return '📁'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" /> Files for {vendorName}
          </DialogTitle>
          <DialogDescription>
            View and manage files for this vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 my-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center">Loading files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-8 text-center">
              {files.length === 0
                ? "No files found for this vendor."
                : "No files match your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{getFileTypeIcon(file.mime_type)}</span>
                        <span className="truncate max-w-[200px]" title={file.original_filename}>
                          {file.original_filename}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{(file.mime_type || 'unknown').toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell title={format(new Date(file.created_at), 'PPpp')}>
                      {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => viewFile(file)}
                          title="View file"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => downloadFile(file)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => shareFile(file)}
                          title="Share file"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => deleteFile(file)}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}