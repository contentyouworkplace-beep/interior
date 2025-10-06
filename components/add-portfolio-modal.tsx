"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Upload, X, FileImage, FileVideo, FileText, Camera, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const PORTFOLIO_CATEGORIES = [
  { value: "residential", label: "🏠 Residential" },
  { value: "commercial", label: "🏢 Commercial" },
  { value: "individual", label: "👤 Individual" },
  { value: "corporate", label: "🏛️ Corporate" },
  { value: "hospitality", label: "🏨 Hospitality" },
  { value: "other", label: "📋 Other" }
]

interface PortfolioFile {
  id: string
  file: File
  preview: string
  type: 'image' | 'video' | 'pdf'
}

interface AddPortfolioModalProps {
  onSave: (
    data: { name: string; category: string; files: File[] },
    onProgress?: (uploaded: number, total: number, currentFile: string) => void
  ) => void
}

export function AddPortfolioModal({ onSave }: AddPortfolioModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [files, setFiles] = useState<PortfolioFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFileName, setUploadingFileName] = useState("")
  const [uploadedCount, setUploadedCount] = useState(0)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
  const maxFileSize = 100 * 1024 * 1024 // 100MB
    
    const validFiles = newFiles.filter(file => {
      if (file.size > maxFileSize) {
        toast.error(`File "${file.name}" is too large`, {
          description: "Maximum file size is 100MB"
        })
        return false
      }
      // Allow common types broadly
      const isOk = file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf'
      if (!isOk) {
        toast.error(`File "${file.name}" is not supported`, {
          description: "Only images, videos, and PDFs are allowed"
        })
        return false
      }
      
      return true
    })

    const processedFiles: PortfolioFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: getFileType(file)
    }))

    setFiles(prev => [...prev, ...processedFiles])
    
    if (validFiles.length !== newFiles.length) {
      toast.warning("Some files were skipped", {
        description: "Only valid files were added to your portfolio"
      })
    }
  }

  const getFileType = (file: File): 'image' | 'video' | 'pdf' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type === 'application/pdf') return 'pdf'
    return 'image' // default
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const getFileIcon = (type: 'image' | 'video' | 'pdf') => {
    switch (type) {
      case 'image': return <FileImage className="h-4 w-4" />
      case 'video': return <FileVideo className="h-4 w-4" />
      case 'pdf': return <FileText className="h-4 w-4" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form fields
    if (!name.trim()) {
      toast.error("Portfolio name is required")
      return
    }
    
    if (!category) {
      toast.error("Please select a category")
      return
    }
    
    if (files.length === 0) {
      toast.error("Please upload at least one file")
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)
    setUploadedCount(0)
    setUploadingFileName("")
    
    try {
      await onSave(
        {
          name: name.trim(),
          category,
          files: files.map(f => f.file)
        },
        (uploaded, total, currentFile) => {
          // Update progress state
          setUploadedCount(uploaded)
          setUploadingFileName(currentFile)
          setUploadProgress((uploaded / total) * 100)
        }
      )
      
      // Reset form
      setName("")
      setCategory("")
      setFiles([])
      setUploadProgress(0)
      setUploadingFileName("")
      setUploadedCount(0)
      setOpen(false)
    } catch (error) {
      console.error('Error saving portfolio:', error)
      toast.error("Failed to save portfolio", {
        description: "Please try again or contact support."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName("")
    setCategory("")
    setFiles([])
    setUploadProgress(0)
    setUploadingFileName("")
    setUploadedCount(0)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Portfolio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Add New Portfolio Project
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="portfolio-name">Portfolio Name</Label>
            <Input
              id="portfolio-name"
              name="portfolio-name"
              type="text"
              placeholder="e.g., Modern Living Room Design"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              className="w-full"
            />
          </div>

          {/* Category Select */}
          <div className="space-y-2">
            <Label htmlFor="portfolio-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger 
                id="portfolio-category"
                className="w-full"
                aria-label="Select portfolio category"
              >
                <SelectValue placeholder="Choose a portfolio category" />
              </SelectTrigger>
              <SelectContent 
                className="z-[9999] bg-white" 
                position="popper"
                sideOffset={4}
              >
                {PORTFOLIO_CATEGORIES.map(cat => (
                  <SelectItem 
                    key={cat.value} 
                    value={cat.value} 
                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category && (
              <p className="text-sm text-muted-foreground">
                Selected: {PORTFOLIO_CATEGORIES.find(cat => cat.value === category)?.label}
              </p>
            )}
          </div>

          {/* File Upload Area */}
          <div className="space-y-3">
            <Label>Files</Label>
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                dragActive 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.getElementById('portfolio-file-input') as HTMLInputElement
                if (input) input.click()
              }}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports images (JPG, PNG, WEBP), videos (MP4, MOV), and PDFs
                </p>
              </div>
            </div>
            <input
              id="portfolio-file-input"
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              onChange={handleFileSelect}
              className="sr-only"
            />
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="space-y-3">
              <Label>Selected Files ({files.length})</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {files.map(file => (
                  <Card key={file.id} className="relative group">
                    <CardContent className="p-2">
                      <div className="aspect-square relative overflow-hidden rounded">
                        {file.type === 'image' ? (
                          <img
                            src={file.preview}
                            alt={file.file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : file.type === 'video' ? (
                          <video
                            src={file.preview}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <div className="w-full h-full bg-red-50 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-red-500" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {getFileIcon(file.type)}
                          <span className="ml-1">{file.type.toUpperCase()}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {file.file.name}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isSubmitting && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    Uploading files...
                  </span>
                </div>
                <span className="text-blue-700 dark:text-blue-300 font-semibold">
                  {uploadedCount}/{files.length}
                </span>
              </div>
              
              <Progress value={uploadProgress} className="h-2" />
              
              <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                <span className="truncate max-w-[60%]">
                  {uploadingFileName ? `Uploading: ${uploadingFileName}` : 'Preparing...'}
                </span>
                <span className="font-medium">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !category || files.length === 0 || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? "Saving..." : "Save Portfolio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}