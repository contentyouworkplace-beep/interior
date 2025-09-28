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

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  onFilesUploaded?: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  id: string
}

export function FileUploadDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onFilesUploaded
}: FileUploadDialogProps) {
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
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/dwg': ['.dwg'],
    'application/dxf': ['.dxf']
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-purple-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles: UploadFile[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'pending',
      id: Math.random().toString(36).substr(2, 9)
    }))

    setUploadFiles(prev => [...prev, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }

  const simulateUpload = async (file: UploadFile) => {
    // Upload using the client file service
    setUploadFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'uploading' } : f
    ))

    try {
      // Simulate progress
      for (let progress = 0; progress <= 90; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ))
      }

      // Actual upload
      const { ClientFileService } = await import('@/lib/services/client-files')
      const clientFileService = new ClientFileService()
      const result = await clientFileService.uploadFile(
        clientId,
        file.file,
        "Current User", // In real app, get from auth
        "Uploaded via file dialog"
      )

      if (result.success) {
        setUploadFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
        ))
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setUploadFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'error', progress: 0 } : f
      ))
    }
  }

  const handleUpload = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    
    if (pendingFiles.length === 0) {
      toast({
        title: "No files to upload",
        description: "Please select files to upload.",
        variant: "destructive"
      })
      return
    }

    // Simulate uploading all files
    await Promise.all(pendingFiles.map(simulateUpload))

    toast({
      title: "Files uploaded successfully!",
      description: `${pendingFiles.length} file(s) uploaded for ${clientName}.`
    })

    if (onFilesUploaded) {
      onFilesUploaded()
    }

    // Close dialog after successful upload
    setTimeout(() => {
      onOpenChange(false)
      setUploadFiles([])
    }, 1000)
  }

  const handleClose = () => {
    onOpenChange(false)
    setUploadFiles([])
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Files for {clientName}</DialogTitle>
          <DialogDescription>
            Upload documents, images, and other files for this client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={Object.keys(acceptedTypes).join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <Label>Selected Files ({uploadFiles.length})</Label>
              {uploadFiles.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  {getFileIcon(uploadFile.file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-1 h-1" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'completed' && (
                      <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
                    )}
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Accepted file types */}
          <div className="text-xs text-muted-foreground">
            <p>Accepted file types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, DWG, DXF</p>
            <p>Maximum file size: 10MB per file</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={uploadFiles.filter(f => f.status === 'pending').length === 0}
          >
            Upload Files ({uploadFiles.filter(f => f.status === 'pending').length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}