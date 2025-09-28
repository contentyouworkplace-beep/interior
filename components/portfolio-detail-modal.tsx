"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Download, Share2, ExternalLink, Calendar, FolderOpen, Images, Upload, QrCode, Link, Eye, FileText } from "lucide-react"
import type { PortfolioProject, PortfolioMedia } from "@/types/portfolio"
import { PortfolioService } from "@/lib/services/portfolio-service"
import { toast } from "sonner"

interface PortfolioDetailModalProps {
  portfolio: PortfolioProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdate?: (project: PortfolioProject) => void;
}

export function PortfolioDetailModal({ portfolio, open, onOpenChange, onProjectUpdate }: PortfolioDetailModalProps) {
  const [showUploadMore, setShowUploadMore] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)
  
  if (!portfolio) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('audio/')) return '🎵';
    return '📎';
  };

  const openMedia = (url?: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const downloadFile = async (media: PortfolioMedia) => {
    try {
      const url = await PortfolioService.getDownloadUrlForMedia(media)
      if (!url) return
      // Open in new tab; browsers will handle download for most types, preserving filename when possible
      openMedia(url)
    } catch (e) {
      console.error('Download error', e)
    }
  }

  const handleShare = async () => {
    setIsGeneratingShare(true)
    try {
      // Create a shareable link for the portfolio
      const shareData = await PortfolioService.createShare({
        project_id: portfolio.id,
        share_type: 'expires',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        allow_download: true,
        watermark_enabled: true
      })
      if (shareData?.share_url) {
        setShareUrl(shareData.share_url)
        setShowShareDialog(true)
      } else {
        toast.error('Failed to create shareable link')
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error('Failed to create shareable link')
    } finally {
      setIsGeneratingShare(false)
    }
  }

  const handleDownloadAll = async () => {
    if (!portfolio.media?.length) {
      toast.info('No files to download')
      return
    }

    toast.info('Downloading files...', {
      description: 'Files will open in new tabs for download'
    })

    // Download each file sequentially to avoid overwhelming the browser
    for (const media of portfolio.media) {
      try {
        await downloadFile(media)
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Failed to download:', media.original_filename, error)
      }
    }
  }

  const handleUploadMoreFiles = async (files: File[]) => {
    try {
      toast.loading('Uploading files...', { duration: Infinity })
      
      await PortfolioService.uploadMultipleMedia(
        portfolio.id,
        files,
        (uploaded, total) => {
          toast.loading(`Uploading... ${uploaded}/${total} files`, { 
            duration: Infinity 
          })
        }
      )

      // Refresh the portfolio data
      const updatedProject = await PortfolioService.getProject(portfolio.id)
      if (updatedProject && onProjectUpdate) {
        onProjectUpdate(updatedProject)
      }

      toast.dismiss()
      toast.success(`Successfully uploaded ${files.length} files`)
      setShowUploadMore(false)
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to upload files')
      console.error('Upload error:', error)
    }
  }

  const handleSetAsProjectThumbnail = async (media: PortfolioMedia) => {
    try {
      // Set this media as featured and unset others
      const allMedia = portfolio.media || []
      
      // Update all media in the project
      for (const m of allMedia) {
        await PortfolioService.updateMedia(m.id, {
          is_featured: m.id === media.id
        })
      }
      
      toast.success(`"${media.title || media.original_filename}" set as project thumbnail`)
      
      // Refresh the project data
      const updatedProject = await PortfolioService.getProject(portfolio.id)
      if (updatedProject && onProjectUpdate) {
        onProjectUpdate(updatedProject)
      }
    } catch (error) {
      toast.error('Failed to update project thumbnail')
      console.error('Thumbnail update error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <div className="pr-8">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <DialogTitle className="text-2xl font-bold pr-4">{portfolio.title}</DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">
                    {portfolio.category}
                  </Badge>
                  <Badge variant="outline">
                    {portfolio.media?.length || 0} file{(portfolio.media?.length || 0) !== 1 ? 's' : ''}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground ml-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(portfolio.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleShare()}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownloadAll()}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowUploadMore(true)}>
                <Images className="h-4 w-4 mr-2" />
                Upload More
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Thumbnail Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Project Gallery
              </h3>
              {portfolio.media && portfolio.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolio.media.map((media, index) => (
                    <div 
                      key={media.id || index} 
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
                      onClick={() => openMedia(media.media_url || media.thumbnail_url)}
                    >
                      {/* Media display based on type */}
                      {media.mime_type.startsWith('video/') ? (
                        <video 
                          src={media.media_url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          muted
                          preload="metadata"
                        />
                      ) : media.mime_type === 'application/pdf' ? (
                        <div className="w-full h-full bg-red-50 flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="h-12 w-12 text-red-500 mx-auto mb-2" />
                            <p className="text-xs text-red-600 font-medium">PDF</p>
                          </div>
                        </div>
                      ) : media.thumbnail_url || media.media_url ? (
                        <img 
                          src={media.thumbnail_url || media.media_url} 
                          alt={media.alt_text || `File ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <div class="text-center text-gray-500">
                                    <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                    </svg>
                                    <p class="text-xs">Image</p>
                                  </div>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                          <div className="text-center text-blue-500">
                            <Images className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-xs font-medium">Image</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Logo Watermark */}
                      <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs font-bold text-gray-700 shadow-sm">
                        GoPLNR
                      </div>
                      
                      {/* Media Type Badge */}
                      <div className="absolute top-2 right-2">
                        {media.mime_type.startsWith('video/') && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            <Eye className="h-3 w-3 mr-1" />
                            Video
                          </Badge>
                        )}
                        {media.mime_type === 'application/pdf' && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                          </Badge>
                        )}
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white bg-black bg-opacity-60 rounded px-2 py-1 truncate flex-1 mr-1">
                            {media.title || media.original_filename || 'Untitled'}
                          </p>
                          {media.mime_type.startsWith('image/') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 bg-white bg-opacity-80 hover:bg-white text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSetAsProjectThumbnail(media)
                              }}
                              title="Use as project thumbnail"
                            >
                              <Images className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Images className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No thumbnails available</p>
                </div>
              )}
            </div>

            {/* File List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Files ({portfolio.media?.length || 0})
              </h3>
              <div className="space-y-2">
                {portfolio.media?.map((media, index) => (
                  <div 
                    key={media.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getFileTypeIcon(media.mime_type)}</span>
                      <div>
                        <p className="font-medium text-sm">{media.title || media.original_filename || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">
                          {media.mime_type} • {formatFileSize(media.file_size || 0)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => downloadFile(media)}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )) || []}
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{portfolio.media?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {portfolio.media?.filter(m => m.mime_type.startsWith('image/')).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Images</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {portfolio.media?.filter(m => m.mime_type.startsWith('video/')).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {portfolio.media?.filter(m => m.mime_type === 'application/pdf').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
      
      {/* Upload More Dialog */}
      <Dialog open={showUploadMore} onOpenChange={setShowUploadMore}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload More Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add more files to <strong>{portfolio.title}</strong>
            </p>
            
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <Input
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                className="hidden"
                id="upload-more-files"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length > 0) {
                    handleUploadMoreFiles(files)
                  }
                }}
              />
              <Label htmlFor="upload-more-files" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Click to upload files</p>
                    <p className="text-xs text-muted-foreground">
                      Images, videos, and PDFs up to 10MB each
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share <strong>{portfolio.title}</strong> with others using the link below:
            </p>
            
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl)
                    toast.success('Link copied to clipboard!')
                  }}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
            </div>
            

          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}