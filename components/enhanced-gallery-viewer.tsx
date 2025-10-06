/**
 * Enhanced Portfolio Gallery Viewer
 * Unified gallery with compressed thumbnails and inbuilt media players
 * Features: Image zoom, PDF viewer, Video player, Download, Delete
 */

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  X,
  Star,
  FileText,
  Image as ImageIcon,
  Film
} from 'lucide-react'
import type { PortfolioMedia } from '@/types/portfolio'
import { PortfolioService } from '@/lib/services/portfolio-service'
import { toast } from 'sonner'

interface EnhancedGalleryViewerProps {
  media: PortfolioMedia[]
  projectTitle: string
  onMediaDelete?: (mediaId: string) => void
  onSetFeatured?: (mediaId: string) => void
  allowDelete?: boolean
  allowSetFeatured?: boolean
  className?: string
}

export function EnhancedGalleryViewer({
  media,
  projectTitle,
  onMediaDelete,
  onSetFeatured,
  allowDelete = true,
  allowSetFeatured = true,
  className = ''
}: EnhancedGalleryViewerProps) {
  const [selectedMedia, setSelectedMedia] = useState<PortfolioMedia | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<PortfolioMedia | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  // Image viewer states
  const [imageZoom, setImageZoom] = useState(100)
  const [imageRotation, setImageRotation] = useState(0)

  // Video player states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  const handleMediaClick = (mediaItem: PortfolioMedia) => {
    setSelectedMedia(mediaItem)
    setViewerOpen(true)
    setImageZoom(100)
    setImageRotation(0)
    setIsPlaying(false)
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
    setSelectedMedia(null)
    if (videoElement) {
      videoElement.pause()
      setIsPlaying(false)
    }
  }

  const handleDownload = async (mediaItem: PortfolioMedia) => {
    try {
      setDownloading(mediaItem.id)
      
      const url = await PortfolioService.getSignedUrl(
        mediaItem.storage_bucket,
        mediaItem.storage_path
      )

      if (!url) {
        throw new Error('Failed to get download URL')
      }

      // Download file
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = mediaItem.original_filename || `file-${mediaItem.id}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('File downloaded', {
        description: mediaItem.original_filename
      })
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed', {
        description: 'Could not download the file'
      })
    } finally {
      setDownloading(null)
    }
  }

  const handleDeleteClick = (mediaItem: PortfolioMedia) => {
    setMediaToDelete(mediaItem)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return

    try {
      await PortfolioService.deleteMedia(mediaToDelete.id)
      
      toast.success('File deleted', {
        description: mediaToDelete.original_filename
      })

      onMediaDelete?.(mediaToDelete.id)
      setDeleteDialogOpen(false)
      setMediaToDelete(null)

      // Close viewer if deleted media was being viewed
      if (selectedMedia?.id === mediaToDelete.id) {
        handleCloseViewer()
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed', {
        description: 'Could not delete the file'
      })
    }
  }

  const handleSetFeatured = async (mediaItem: PortfolioMedia) => {
    try {
      await PortfolioService.updateMedia(mediaItem.id, {
        is_featured: true
      })

      toast.success('Thumbnail updated', {
        description: 'Set as project thumbnail'
      })

      onSetFeatured?.(mediaItem.id)
    } catch (error) {
      console.error('Set featured error:', error)
      toast.error('Update failed', {
        description: 'Could not set as thumbnail'
      })
    }
  }

  // Image viewer controls
  const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 25, 25))
  const handleRotate = () => setImageRotation(prev => (prev + 90) % 360)

  // Video player controls
  const togglePlay = () => {
    if (!videoElement) return
    
    if (isPlaying) {
      videoElement.pause()
    } else {
      videoElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoElement) return
    videoElement.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!videoElement) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoElement.requestFullscreen()
    }
  }

  const getMediaTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <Film className="h-4 w-4" />
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownloadAll = async () => {
    if (media.length === 0) {
      toast.info('No files to download')
      return
    }

    toast.info('Downloading files...', {
      description: `Downloading ${media.length} file(s)`
    })

    // Download each file sequentially with a small delay
    for (const mediaItem of media) {
      try {
        await handleDownload(mediaItem)
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Failed to download:', mediaItem.original_filename, error)
      }
    }

    toast.success('All files downloaded!', {
      description: `${media.length} file(s) downloaded successfully`
    })
  }

  return (
    <div className={className}>
      {/* Gallery Grid */}
      <div className="space-y-4">
        {/* Removed header and instructions per user request */}

        {media.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No files uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Increased thumbnail size by enlarging aspect box and reducing columns */}
            {media.map((mediaItem, index) => (
              <div
                key={mediaItem.id}
                className="group relative aspect-square bg-muted rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all [&>img]:object-cover"
                onClick={() => handleMediaClick(mediaItem)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleDownload(mediaItem)
                }}
              >
                {/* Thumbnail */}
                {mediaItem.mime_type.startsWith('video/') ? (
                  <div className="relative w-full h-full">
                    {mediaItem.thumbnail_url ? (
                      <img
                        src={mediaItem.thumbnail_url}
                        alt={mediaItem.title || 'Video'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <Film className="h-6 w-6 text-purple-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ) : mediaItem.mime_type === 'application/pdf' ? (
                  <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                ) : (
                  <img
                    src={mediaItem.thumbnail_url || mediaItem.media_url || '/placeholder.png'}
                    alt={mediaItem.title || `Image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                )}

                {/* Featured badge */}
                {mediaItem.is_featured && (
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="bg-yellow-500 text-white text-[10px] h-5 px-1.5">
                      <Star className="h-2.5 w-2.5 mr-0.5" />
                      Featured
                    </Badge>
                  </div>
                )}

                {/* File type badge */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="backdrop-blur-sm text-[10px] h-5 px-1.5">
                    {getMediaTypeIcon(mediaItem.mime_type)}
                  </Badge>
                </div>

                {/* Action buttons */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(mediaItem)
                      }}
                      disabled={downloading === mediaItem.id}
                    >
                      <Download className="h-3 w-3" />
                    </Button>

                    {allowSetFeatured && !mediaItem.is_featured && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSetFeatured(mediaItem)
                        }}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}

                    {allowDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-white hover:bg-red-500/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(mediaItem)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* File info */}
                <div className="absolute bottom-10 left-0 right-0 p-2 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="truncate font-medium">{mediaItem.title || mediaItem.original_filename}</p>
                  <p className="text-white/70">{getFileSize(mediaItem.file_size || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Media Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={handleCloseViewer}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 flex flex-col">
          {selectedMedia && (
            <>
              <DialogHeader className="p-4 border-b shrink-0">
                <div className="flex items-start justify-between pr-8">
                  <div className="space-y-1">
                    <DialogTitle>{selectedMedia.title || selectedMedia.original_filename}</DialogTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {getMediaTypeIcon(selectedMedia.mime_type)}
                        <span className="ml-1">{selectedMedia.mime_type.split('/')[1].toUpperCase()}</span>
                      </Badge>
                      <Badge variant="outline">{getFileSize(selectedMedia.file_size || 0)}</Badge>
                      {selectedMedia.is_featured && (
                        <Badge variant="secondary" className="bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 overflow-auto">
                <div className="p-4">
                  {/* Image Viewer */}
                  {selectedMedia.mime_type.startsWith('image/') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 py-2 bg-muted rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomOut}
                          disabled={imageZoom <= 25}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[60px] text-center">
                          {imageZoom}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomIn}
                          disabled={imageZoom >= 200}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-px bg-border mx-2" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRotate}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-center bg-muted/30 rounded-lg min-h-[400px] overflow-auto">
                        <img
                          src={selectedMedia.media_url || selectedMedia.thumbnail_url || ''}
                          alt={selectedMedia.title || 'Image'}
                          style={{
                            transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                            transition: 'transform 0.2s ease'
                          }}
                          className="max-w-full max-h-[600px] object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Player */}
                  {selectedMedia.mime_type.startsWith('video/') && (
                    <div className="space-y-4">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={setVideoElement}
                          src={selectedMedia.media_url || ''}
                          className="w-full max-h-[600px]"
                          controls
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      </div>

                      {selectedMedia.video_duration && (
                        <p className="text-sm text-muted-foreground text-center">
                          Duration: {Math.floor(selectedMedia.video_duration / 60)}:
                          {String(Math.floor(selectedMedia.video_duration % 60)).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* PDF Viewer */}
                  {selectedMedia.mime_type === 'application/pdf' && (
                    <div className="space-y-4">
                      <div className="bg-muted rounded-lg min-h-[600px]">
                        <iframe
                          src={selectedMedia.media_url || ''}
                          className="w-full h-[600px] rounded-lg"
                          title={selectedMedia.title || 'PDF Document'}
                        />
                      </div>
                    </div>
                  )}

                  {/* File Info */}
                  {selectedMedia.description && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm">{selectedMedia.description}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="p-4 border-t shrink-0 flex items-center justify-end gap-2 bg-background">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedMedia)}
                  disabled={downloading === selectedMedia.id}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                {allowSetFeatured && !selectedMedia.is_featured && (
                  <Button
                    variant="outline"
                    onClick={() => handleSetFeatured(selectedMedia)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Set as Thumbnail
                  </Button>
                )}

                {allowDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(selectedMedia)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mediaToDelete?.original_filename}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
