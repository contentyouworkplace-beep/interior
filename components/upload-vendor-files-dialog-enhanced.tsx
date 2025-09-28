"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, File, Check, AlertCircle, FileType } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UploadVendorFilesDialogEnhancedProps {
  vendorId: string
  vendorName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UploadVendorFilesDialogEnhanced({ 
  vendorId, 
  vendorName,
  open, 
  onOpenChange, 
  onSuccess 
}: UploadVendorFilesDialogEnhancedProps) {
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  const fileCategories1 = [
    "Contract",
    "Invoice",
    "Quote",
    "Catalog",
    "Specification",
    "Drawing",
    "Photo",
    "Other"
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      
      // Check file size (limit to 10MB per file)
      const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024)
      
      if (validFiles.length < selectedFiles.length) {
        toast({
          title: "File size exceeded",
          description: "Some files were not added because they exceed the 10MB limit.",
          variant: "destructive",
        })
      }
      
      setFiles(prev => [...prev, ...validFiles])
      e.target.value = '' // Reset the input
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload")
      return
    }
    
    // Check network connectivity
    if (!navigator.onLine) {
      setError("No internet connection detected. Please check your network connection and try again.")
      toast({
        title: "No Internet Connection",
        description: "Please check your network connection and try again.",
        variant: "destructive",
      })
      return
    }
    
    setIsUploading(true)
    setError(null)
    setUploadStatus('uploading')
    
    try {
      // Create progress trackers for each file
      const newProgress: {[key: string]: number} = {}
      files.forEach(file => {
        newProgress[file.name] = 0
      })
      setUploadProgress(newProgress)
      
      // Upload each file to Supabase Storage
      const uploadResults = await Promise.allSettled(files.map(async (file) => {
        try {
          // Upload file using API endpoint
          console.log('🔄 Starting upload for file:', file.name)
          
          const formData = new FormData()
          formData.append('file', file)
          formData.append('vendorId', vendorId)
          
          const uploadResponse = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          })
          
          const responseText = await uploadResponse.text()
          console.log('📡 Upload response:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            headers: Object.fromEntries(uploadResponse.headers.entries()),
            body: responseText
          })
          
          if (!uploadResponse.ok) {
            let errorData
            try {
              errorData = JSON.parse(responseText)
            } catch {
              errorData = { error: responseText || 'Upload failed' }
            }
            console.error('❌ Upload API error:', errorData)
            throw new Error(errorData.error || `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}`)
          }
          
          const result = JSON.parse(responseText)
          console.log('✅ File uploaded successfully:', result)
          
          return { success: true, file: file.name }
        } catch (fileError: any) {
          console.error(`Error uploading file ${file.name}:`, fileError)
          let errorMessage = `Failed to upload ${file.name}`
          
          if (fileError.message.includes('fetch')) {
            errorMessage = `Network error uploading ${file.name}. Please check your internet connection.`
          } else if (fileError.message.includes('413')) {
            errorMessage = `${file.name} is too large. Please choose a smaller file.`
          } else if (fileError.message.includes('400')) {
            errorMessage = `Invalid file format for ${file.name}. Please check the file and try again.`
          } else if (fileError.message.includes('500')) {
            errorMessage = `Server error uploading ${file.name}. Please try again later.`
          } else if (fileError.message) {
            errorMessage = fileError.message
          }
          
          return { 
            success: false, 
            file: file.name, 
            error: errorMessage
          }
        }
      }))
      
      // Count successful and failed uploads
      const successful = uploadResults.filter(result => 
        result.status === 'fulfilled' && (result.value as any).success
      ).length
      
      const failed = uploadResults.filter(result => 
        result.status === 'rejected' || !(result.value as any).success
      ).length
      
      // Show appropriate toast based on results
      if (successful === files.length) {
        toast({
          title: "Files Uploaded",
          description: `Successfully uploaded ${files.length} files for ${vendorName}.`,
        })
        setUploadStatus('success')
        setFiles([])
        onSuccess?.()
        
        // Delay closing the dialog to show success state
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      } else if (successful > 0) {
        setUploadStatus('error')
        setError(`${successful} files uploaded successfully, but ${failed} files failed. Please try again for the failed files.`)
        toast({
          title: "Partial Upload",
          description: `${successful} files uploaded, but ${failed} files failed.`,
          variant: "destructive",
        })
      } else {
        setUploadStatus('error')
        setError("All uploads failed. Please check your connection and try again.")
        toast({
          title: "Upload Failed",
          description: "All files failed to upload. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error uploading files:", error)
      setUploadStatus('error')
      setError(error.message || "An unexpected error occurred during upload")
      toast({
        title: "Error",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.add('border-primary')
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-primary')
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-primary')
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      const validFiles = droppedFiles.filter(file => file.size <= 10 * 1024 * 1024)
      
      if (validFiles.length < droppedFiles.length) {
        toast({
          title: "File size exceeded",
          description: "Some files were not added because they exceed the 10MB limit.",
          variant: "destructive",
        })
      }
      
      setFiles(prev => [...prev, ...validFiles])
    }
  }
  
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    switch (extension) {
      case 'pdf':
        return <FileType className="h-4 w-4 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileType className="h-4 w-4 text-blue-500" />
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileType className="h-4 w-4 text-green-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileType className="h-4 w-4 text-purple-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(newState) => {
      // Only allow closing if not uploading
      if (!isUploading) {
        onOpenChange(newState)
        if (!newState) {
          // Reset state when dialog closes
          setFiles([])
          setError(null)
          setUploadStatus('idle')
        }
      }
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Files
          </DialogTitle>
          <DialogDescription>
            Upload files related to vendor "{vendorName}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploadStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Files uploaded successfully!</AlertDescription>
            </Alert>
          )}
          
          <div 
            className="border-2 border-dashed border-gray-300 hover:border-primary/50 rounded-lg p-8 text-center transition-all duration-200 hover:bg-gray-50/50"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            
            <div className="space-y-3">
              <Label 
                htmlFor="file-upload" 
                className="inline-flex items-center gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-primary/20 shadow-sm"
              >
                <Upload className="h-4 w-4" />
                Choose Files
              </Label>
              
              <p className="text-sm text-gray-600">
                or drag and drop files here
              </p>
              
              <p className="text-xs text-gray-500">
                Supported formats: All file types (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT, ZIP, etc.)
                <br />
                Max file size: 10MB per file
              </p>
            </div>
            
            <Input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          
          {files.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <File className="h-4 w-4" />
                Selected Files ({files.length})
              </Label>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {files.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`} 
                    className="text-sm border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between p-3 border-b bg-gray-50/50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {getFileIcon(file.name)}
                        <div className="overflow-hidden">
                          <p className="truncate font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(file.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="p-3">
                      {isUploading && uploadProgress[file.name] !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Uploading</span>
                            <span className="text-xs font-medium">{uploadProgress[file.name]}%</span>
                          </div>
                          <Progress value={uploadProgress[file.name]} className="h-1" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isUploading}
            className="border-gray-300 hover:border-gray-400"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={uploadFiles} 
            disabled={isUploading || files.length === 0}
            className="min-w-[120px] bg-primary hover:bg-primary/90 border border-primary/20 shadow-sm"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Uploading...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload {files.length > 0 ? `(${files.length})` : 'Files'}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}