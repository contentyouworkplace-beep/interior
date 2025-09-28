/**
 * Media Upload Component
 * Handles image and video uploads to Supabase Storage
 * Lightweight design with minimal CRM load
 */

'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import PortfolioService from '@/lib/services/portfolio-service'
import type { PortfolioMedia, UploadMediaRequest } from '@/types/portfolio'
import { 
  Upload,
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Play
} from 'lucide-react'

interface MediaUploadProps {
  projectId: string
  onUploadComplete?: (media: PortfolioMedia[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  className?: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  media?: PortfolioMedia
  preview?: string
}

export function MediaUpload({ 
  projectId, 
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  className = '' 
}: MediaUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  // Handle file selection
  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter(file => {
      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/')
        if (type === 'video/*') return file.type.startsWith('video/')
        return file.type === type
      })

      if (!isValidType) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        })
        return false
      }

      // Check file size (50MB limit for videos, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Max size: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`,
          variant: "destructive",
        })
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    // Check total file limit
    const totalFiles = uploadingFiles.length + validFiles.length
    if (totalFiles > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `You can only upload up to ${maxFiles} files at once`,
        variant: "destructive",
      })
      return
    }

    // Create upload entries
    const newUploads: UploadingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    setUploadingFiles(prev => [...prev, ...newUploads])

    // Start uploads
    newUploads.forEach(upload => startUpload(upload))
  }, [uploadingFiles.length, maxFiles, acceptedTypes, toast])

  // Start individual file upload
  const startUpload = async (upload: UploadingFile) => {
    try {
      // Update status to uploading
      setUploadingFiles(prev => 
        prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', progress: 10 } : u)
      )

      const uploadRequest: UploadMediaRequest = {
        project_id: projectId,
        file: upload.file,
        title: upload.file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        is_featured: false
      }

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(u => {
            if (u.id === upload.id && u.progress < 80) {
              return { ...u, progress: Math.min(u.progress + 10, 80) }
            }
            return u
          })
        )
      }, 200)

      // Upload to service
      const result = await PortfolioService.uploadMedia(uploadRequest)

      clearInterval(progressInterval)

      if (result.success && result.media) {
        const finalStatus = result.media.file_type === 'video' ? 'processing' : 'completed'
        
        setUploadingFiles(prev => 
          prev.map(u => u.id === upload.id ? { 
            ...u, 
            status: finalStatus,
            progress: 100,
            media: result.media
          } : u)
        )

        // If it's a video, monitor processing status
        if (result.media.file_type === 'video' && result.processing_job_id) {
          monitorVideoProcessing(upload.id, result.processing_job_id)
        }

        toast({
          title: "Upload Complete",
          description: `${upload.file.name} uploaded successfully`,
          variant: "default",
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      setUploadingFiles(prev => 
        prev.map(u => u.id === upload.id ? { 
          ...u, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        } : u)
      )

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${upload.file.name}`,
        variant: "destructive",
      })
    }
  }

  // Monitor video processing status
  const monitorVideoProcessing = async (uploadId: string, jobId: string) => {
    const checkStatus = async () => {
      try {
        const job = await PortfolioService.getProcessingJob(jobId)
        
        if (job) {
          if (job.status === 'completed') {
            setUploadingFiles(prev => 
              prev.map(u => u.id === uploadId ? { 
                ...u, 
                status: 'completed'
              } : u)
            )
            
            toast({
              title: "Video Processing Complete",
              description: "Your video is ready for streaming",
              variant: "default",
            })
          } else if (job.status === 'failed') {
            setUploadingFiles(prev => 
              prev.map(u => u.id === uploadId ? { 
                ...u, 
                status: 'error',
                error: job.error_message || 'Processing failed'
              } : u)
            )
          } else {
            // Still processing, check again in 5 seconds
            setTimeout(checkStatus, 5000)
          }
        }
      } catch (error) {
        console.error('Failed to check processing status:', error)
      }
    }

    // Start checking after 2 seconds
    setTimeout(checkStatus, 2000)
  }

  // Remove file from upload queue
  const removeFile = (id: string) => {
    setUploadingFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  // Retry failed upload
  const retryUpload = (id: string) => {
    const upload = uploadingFiles.find(u => u.id === id)
    if (upload && upload.status === 'error') {
      setUploadingFiles(prev => 
        prev.map(u => u.id === id ? { ...u, status: 'pending', progress: 0, error: undefined } : u)
      )
      startUpload(upload)
    }
  }

  // Complete upload process
  const handleComplete = () => {
    const completedMedia = uploadingFiles
      .filter(u => u.status === 'completed' && u.media)
      .map(u => u.media!)
    
    if (onUploadComplete && completedMedia.length > 0) {
      onUploadComplete(completedMedia)
    }
    
    // Clear completed files
    setUploadingFiles(prev => {
      const remaining = prev.filter(u => u.status !== 'completed')
      // Cleanup preview URLs
      prev.forEach(u => {
        if (u.preview && u.status === 'completed') {
          URL.revokeObjectURL(u.preview)
        }
      })
      return remaining
    })
  }

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6" />
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-6 w-6" />
    }
    return <FileText className="h-6 w-6" />
  }

  // Get status icon
  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <Check className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Upload className="h-4 w-4" />
    }
  }

  // Get status color
  const getStatusColor = (status: UploadingFile['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card>
        <CardContent 
          className={`p-8 border-2 border-dashed transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="mb-4">
              <p className="text-lg font-medium">Drop files here to upload</p>
              <p className="text-muted-foreground">
                or{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse files
                </button>
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Supports: Images (PNG, JPG) and Videos (MP4, MOV, AVI)</p>
              <p>Max size: 10MB for images, 50MB for videos</p>
              <p>Max files: {maxFiles} at once</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Upload Progress</h3>
                {uploadingFiles.some(u => u.status === 'completed') && (
                  <Button size="sm" onClick={handleComplete}>
                    Complete ({uploadingFiles.filter(u => u.status === 'completed').length})
                  </Button>
                )}
              </div>

              {uploadingFiles.map((upload) => (
                <div key={upload.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {upload.preview ? (
                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={upload.preview} 
                            alt={upload.file.name}
                            className="w-full h-full object-cover"
                          />
                          {upload.file.type.startsWith('video/') && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          {getFileIcon(upload.file)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{upload.file.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(upload.status)}>
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(upload.status)}
                              <span className="capitalize">
                                {upload.status === 'processing' ? 'Converting video...' : upload.status}
                              </span>
                            </span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {upload.status === 'error' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => retryUpload(upload.id)}
                        >
                          Retry
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => removeFile(upload.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {(upload.status === 'uploading' || upload.status === 'processing') && (
                    <Progress value={upload.progress} className="w-full" />
                  )}

                  {upload.error && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {upload.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MediaUpload