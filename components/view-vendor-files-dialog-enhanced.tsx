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
import { AlertCircle, Download, Files, Eye, Trash2, Search, RefreshCcw, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow, format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  uploaded_at?: string
  created_at: string
  description?: string | null
  category?: string | null
  download_url?: string
  url_error?: string
}

interface ViewVendorFilesDialogEnhancedProps {
  vendorId: string
  vendorName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewVendorFilesDialogEnhanced({
  vendorId,
  vendorName,
  open,
  onOpenChange,
}: ViewVendorFilesDialogEnhancedProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const [files, setFiles] = useState<VendorFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<VendorFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [selectedFile, setSelectedFile] = useState<VendorFile | null>(null)
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchVendorFiles()
    } else {
      // Reset state when dialog closes
      setSearchQuery("")
      setError(null)
      setIsUsingFallback(false)
    }
  }, [open, vendorId])
  
  // Handle potential column name mismatches by ensuring we have the needed data
  useEffect(() => {
    // Normalize file objects to ensure they have either uploaded_at or created_at
    if (files.length > 0) {
      const normalizedFiles = files.map(file => {
        // Make sure we have at least one date field
        if (!file.uploaded_at && !file.created_at) {
          return {
            ...file,
            uploaded_at: new Date().toISOString()
          }
        }
        return file
      })
      setFiles(normalizedFiles)
      setFilteredFiles(normalizedFiles.filter(file => 
        !searchQuery || 
        file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (file.mime_type && file.mime_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (file.category && file.category.toLowerCase().includes(searchQuery.toLowerCase()))
      ))
    }
  }, [files.length])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFiles(files)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredFiles(
        files.filter(
          file =>
            file.original_filename.toLowerCase().includes(query) ||
            (file.mime_type && file.mime_type.toLowerCase().includes(query)) ||
            (file.description && file.description.toLowerCase().includes(query)) ||
            (file.category && file.category.toLowerCase().includes(query))
        )
      )
    }
  }, [searchQuery, files])

  const fetchVendorFiles = async () => {
    setLoading(true)
    setError(null)
    setIsUsingFallback(false)

    try {
      // Try the primary API endpoint first
      const response = await fetch(`/api/vendor-files?vendorId=${vendorId}`)
      
      if (!response.ok) {
        // If primary fails, use fallback endpoint
        console.log("Primary vendor-files API failed, using fallback...")
        const fallbackResponse = await fetch(`/api/vendor-files-fallback?vendorId=${vendorId}`)
        
        if (!fallbackResponse.ok) {
          console.log("Fallback API also failed, using emergency fallback...")
          const emergencyResponse = await fetch(`/api/vendor-files-emergency-fallback?vendorId=${vendorId}`)
          
          if (!emergencyResponse.ok) {
            throw new Error(`Emergency fallback also failed! Status: ${emergencyResponse.status}`)
          }
          
          const emergencyResult = await emergencyResponse.json()
          setFiles(emergencyResult.data || [])
          setFilteredFiles(emergencyResult.data || [])
          setIsUsingFallback(true)
          toast({
            title: "Using Emergency Demo Mode",
            description: "Database connection issue - showing emergency demo data",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        
        const fallbackResult = await fallbackResponse.json()
        if (fallbackResult.data) {
          setFiles(fallbackResult.data)
          setFilteredFiles(fallbackResult.data)
          setIsUsingFallback(true)
          toast({
            title: "Using Demo Mode",
            description: "Database connection issue - showing demo data",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        throw new Error(fallbackResult.error || 'All fallback mechanisms failed')
      }
      
      const result = await response.json()
      if (result.data) {
        setFiles(result.data)
        setFilteredFiles(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch vendor files')
      }
    } catch (error: any) {
      console.error("Error fetching vendor files:", error)
      setError(error.message || "Failed to load vendor files")
      toast({
        title: "Error",
        description: "Could not load vendor files. Please try again later.",
        variant: "destructive",
      })
      
      // Set empty arrays if everything fails
      setFiles([])
      setFilteredFiles([])
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (file: VendorFile) => {
    if (isUsingFallback) {
      toast({
        title: "Demo Mode",
        description: "File download is not available in demo mode",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Get the signed URL for the file
      const { data, error } = await supabase.storage
        .from('client-files')
        .createSignedUrl(file.file_path, 60)
      
      if (error) throw error
      
      if (data?.signedUrl) {
        // Create a link and click it programmatically
        const link = document.createElement('a')
        link.href = data.signedUrl
        link.download = file.file_name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "Download Started",
          description: `Downloading ${file.file_name}`,
        })
      }
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
    if (isUsingFallback) {
      toast({
        title: "Demo Mode",
        description: "File viewing is not available in demo mode",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Get the signed URL for the file
      const { data, error } = await supabase.storage
        .from('client-files')
        .createSignedUrl(file.file_path, 60)
      
      if (error) throw error
      
      if (data?.signedUrl) {
        // Open in a new tab
        window.open(data.signedUrl, '_blank')
      }
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

  const confirmDeleteFile = (file: VendorFile) => {
    setSelectedFile(file)
  }

  const deleteFile = async () => {
    if (!selectedFile) return
    
    if (isUsingFallback) {
      toast({
        title: "Demo Mode",
        description: "File deletion is not available in demo mode",
        variant: "destructive",
      })
      setSelectedFile(null)
      return
    }

    setDeleteInProgress(selectedFile.id)
    
    try {
      // Delete using API
      const response = await fetch(`/api/vendor-files?id=${selectedFile.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete file')
      }
      
      // Update the UI
      setFiles(prev => prev.filter(f => f.id !== selectedFile.id))
      toast({
        title: "File Deleted",
        description: `${selectedFile.file_name} has been deleted successfully`,
      })
    } catch (error: any) {
      console.error("Error deleting file:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete the file",
        variant: "destructive",
      })
    } finally {
      setDeleteInProgress(null)
      setSelectedFile(null)
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
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(type)) return '🖼️'
    // Document files
    if (['pdf'].includes(type)) return '�'
    if (['doc', 'docx', 'txt', 'rtf', 'md', 'odt'].includes(type)) return '📝'
    // Spreadsheet files
    if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(type)) return '📊'
    // Presentation files
    if (['ppt', 'pptx', 'key', 'odp'].includes(type)) return '📊'
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(type)) return '🗃️'
    // CAD files
    if (['dwg', 'dxf', 'skp', 'stl', '3ds'].includes(type)) return '📐'
    // Design files
    if (['ai', 'psd', 'xd', 'fig', 'sketch'].includes(type)) return '🎨'
    // Code files
    if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'py', 'java'].includes(type)) return '💻'
    // Font files
    if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(type)) return '�'
    // Video files
    if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'].includes(type)) return '🎬'
    // Audio files
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(type)) return '🎵'
    // Default for unknown types
    return '📄'
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newState) => {
        if (!deleteInProgress) {
          onOpenChange(newState)
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Files className="h-5 w-5 text-primary" /> Files for {vendorName}
          </DialogTitle>
          <DialogDescription>
            View and manage files for this vendor.
            {isUsingFallback && (
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                Demo Mode
              </Badge>
            )}
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
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchVendorFiles} 
            disabled={loading}
            title="Refresh"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 h-7" 
                onClick={fetchVendorFiles}
              >
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isUsingFallback && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Demo Mode Active</AlertTitle>
            <AlertDescription>
              Showing demo data. Some actions like downloading or deleting files won't work.
              Run the vendor_files SQL script in Supabase to enable full functionality.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin mx-auto mb-2 h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              <p>Loading files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Files className="mx-auto mb-2 h-12 w-12 opacity-20" />
              {files.length === 0
                ? "No files found for this vendor."
                : "No files match your search criteria."}
              {files.length === 0 && (
                <p className="mt-2 text-sm">
                  Upload files using the "Upload" button on the vendor card.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table className="bg-white">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-xs uppercase text-slate-600">Name</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-600">Type</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-600">Size</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-600">Uploaded</TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file, index) => (
                    <TableRow 
                      key={file.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                    >
                      <TableCell className="font-medium py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-100 text-lg shrink-0">
                            {getFileTypeIcon(file.mime_type)}
                          </div>
                          <div className="truncate max-w-[220px]">
                            <span className="block truncate font-medium text-sm" title={file.file_name}>
                              {file.file_name}
                            </span>
                            {file.description && (
                              <span 
                                className="text-xs text-muted-foreground truncate block mt-0.5" 
                                title={file.description}
                              >
                                {file.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge 
                          variant="outline" 
                          className={`${
                            (file.mime_type && file.mime_type.match(/pdf|doc|docx|txt/)) ? "border-blue-200 bg-blue-50 text-blue-700" :
                            (file.mime_type && file.mime_type.match(/jpg|jpeg|png|gif|webp/)) ? "border-purple-200 bg-purple-50 text-purple-700" :
                            (file.mime_type && file.mime_type.match(/xls|xlsx|csv/)) ? "border-green-200 bg-green-50 text-green-700" :
                            (file.mime_type && file.mime_type.match(/zip|rar|7z/)) ? "border-amber-200 bg-amber-50 text-amber-700" :
                            "border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {(file.mime_type || 'unknown').toUpperCase()}
                        </Badge>
                        {file.category && (
                          <span className="block text-xs text-muted-foreground mt-1.5">
                            {file.category}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm py-3">{formatFileSize(file.file_size)}</TableCell>
                      <TableCell 
                        className="text-sm py-3"
                        title={format(new Date(file.uploaded_at || file.created_at || new Date()), 'PPpp')}
                      >
                        {formatDistanceToNow(new Date(file.uploaded_at || file.created_at || new Date()), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="bg-slate-50 rounded-md p-0.5 flex items-center gap-0.5 shadow-sm inline-flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-blue-600 rounded-md transition-colors"
                            onClick={() => viewFile(file)}
                            title="View file"
                            disabled={isUsingFallback}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-green-600 rounded-md transition-colors"
                            onClick={() => downloadFile(file)}
                            title="Download file"
                            disabled={isUsingFallback}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-blue-500 rounded-md transition-colors"
                            onClick={() => shareFile(file)}
                            title="Share file"
                            disabled={isUsingFallback}
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </Button>
                          <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                            onClick={() => confirmDeleteFile(file)}
                            title="Delete file"
                            disabled={deleteInProgress === file.id || isUsingFallback}
                          >
                            {deleteInProgress === file.id ? (
                              <div className="h-3.5 w-3.5 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleteInProgress !== null}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Delete confirmation dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the file "{selectedFile.file_name}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedFile(null)} 
                disabled={deleteInProgress !== null}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={deleteFile}
                disabled={deleteInProgress !== null}
              >
                {deleteInProgress ? (
                  <>
                    <div className="h-4 w-4 border-2 border-background/50 border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete File"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}