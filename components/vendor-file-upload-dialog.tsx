"use client"

import React, { useState, useRef } from "react"
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
import { Progress } from "@/components/ui/progress"
import { Upload, X, File, FileText, Image, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VendorFileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  vendorName: string
  onFilesUploaded?: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  id: string
}

export function VendorFileUploadDialog({
  open,
  onOpenChange,
  vendorId,
  vendorName,
  onFilesUploaded
}: VendorFileUploadDialogProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const acceptedTypes = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip']
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    if (file.size > maxSize) {
      return `File ${file.name} is too large. Maximum size is 50MB.`
    }

    if (!Object.keys(acceptedTypes).includes(file.type)) {
      return `File type ${file.type} is not supported.`
    }

    return null
  }

  const addFiles = (files: FileList) => {
    const newFiles: UploadFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const error = validateFile(file)
      
      if (error) {
        toast({
          title: "File Error",
          description: error,
          variant: "destructive",
        })
        continue
      }

      newFiles.push({
        file,
        progress: 0,
        status: 'pending',
        id: `${file.name}-${Date.now()}-${i}`
      })
    }

    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ))

      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('vendorId', vendorId)
      formData.append('category', 'general')

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id && f.progress < 90 
            ? { ...f, progress: f.progress + 10 } 
            : f
        ))
      }, 100)

      const response = await fetch('/api/upload/vendor-files', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100 } 
          : f
      ))

      return true
    } catch (error) {
      console.error('Upload error:', error)
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', progress: 0 } 
          : f
      ))
      return false
    }
  }

  const handleUploadAll = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) {
      toast({
        title: "No Files",
        description: "No files to upload.",
        variant: "destructive",
      })
      return
    }

    let successCount = 0
    
    for (const file of pendingFiles) {
      const success = await uploadFile(file)
      if (success) successCount++
    }

    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successCount} file(s).`,
      })
      
      if (onFilesUploaded) {
        onFilesUploaded()
      }
    }

    // Auto-close after successful upload
    if (successCount === pendingFiles.length) {
      setTimeout(() => {
        onOpenChange(false)
        setUploadFiles([])
      }, 1500)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files)
    }
  }

  const resetDialog = () => {
    setUploadFiles([])
    setIsDragging(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Files for {vendorName}</DialogTitle>
          <DialogDescription>
            Upload documents, images, and other files for this vendor. Maximum file size: 50MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop files here, or click to browse
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={Object.values(acceptedTypes).flat().join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <Label>Files to Upload ({uploadFiles.length})</Label>
              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  {getFileIcon(uploadFile.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'completed' && (
                      <div className="text-green-600 text-xs">✓</div>
                    )}
                    {uploadFile.status === 'error' && (
                      <div className="text-red-600 text-xs">✗</div>
                    )}
                    {uploadFile.status === 'pending' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadAll}
            disabled={uploadFiles.filter(f => f.status === 'pending').length === 0}
          >
            Upload Files
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}