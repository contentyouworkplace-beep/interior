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
import { Upload, X, File, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface UploadVendorFilesDialogProps {
  vendorId: string
  vendorName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UploadVendorFilesDialog({ 
  vendorId, 
  vendorName,
  open, 
  onOpenChange, 
  onSuccess 
}: UploadVendorFilesDialogProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
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
    
    setIsUploading(true)
    setError(null)
    
    try {
      // Create progress trackers for each file
      const newProgress: {[key: string]: number} = {}
      files.forEach(file => {
        newProgress[file.name] = 0
      })
      setUploadProgress(newProgress)
      
      // Upload each file to Supabase Storage
      const uploadPromises = files.map(async (file) => {
        try {
          // Generate a unique filename using timestamp and original name
          const timestamp = new Date().getTime()
          const fileExt = file.name.split('.').pop()
          const fileName = `${timestamp}-${file.name}`
          
          // Use the vendor ID as part of the file path
          const filePath = `vendors/${vendorId}/${fileName}`
          
          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from('client-files')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
              onUploadProgress: (progress) => {
                if (progress.totalBytes) {
                  const percent = Math.round((progress.bytesUploaded / progress.totalBytes) * 100)
                  setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: percent
                  }))
                }
              }
            })
          
          if (error) throw error
          
          // Update the vendor_files table to link the file with the vendor
          const { error: linkError } = await supabase
            .from('vendor_files')
            .insert({
              vendor_id: vendorId,
              file_path: filePath,
              file_name: file.name,
              file_type: fileExt || 'unknown',
              file_size: file.size,
              uploaded_at: new Date().toISOString()
            })
          
          if (linkError) throw linkError
          
          return data
        } catch (fileError: any) {
          console.error(`Error uploading file ${file.name}:`, fileError)
          throw new Error(`Failed to upload ${file.name}: ${fileError.message}`)
        }
      })
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises)
      
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${files.length} files for ${vendorName}.`,
      })
      
      setFiles([])
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Error uploading files:", error)
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Files
          </DialogTitle>
          <DialogDescription>
            Upload files related to vendor "{vendorName}".
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <div className="text-sm text-gray-600 mb-4">
              <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:text-primary/80">
                Click to browse
              </Label> or drag and drop
              <p className="mt-1 text-xs text-gray-500">
                PDF, Word, Excel, Images, etc.
              </p>
            </div>
            <Input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          
          {files.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Selected Files</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`} 
                    className="flex items-center justify-between text-sm p-2 border rounded-md"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isUploading && uploadProgress[file.name] !== undefined && (
                        <div className="flex items-center">
                          <span className="text-xs mr-1">
                            {uploadProgress[file.name]}%
                          </span>
                          {uploadProgress[file.name] === 100 && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={uploadFiles} 
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}