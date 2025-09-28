/**
 * Public Portfolio Share Page
 * Displays shared portfolio projects without authentication
 * Optimized for public viewing with download capabilities
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import VideoPlayer from '../portfolio/video-player'
import PortfolioService from '@/lib/services/portfolio-service'
import type { PortfolioProject, PortfolioMedia, PortfolioShare } from '@/types/portfolio'
import { 
  Download,
  Calendar,
  MapPin,
  Tag,
  Play,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Share2,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react'

interface PublicPortfolioProps {
  shareToken: string
  className?: string
}

interface SharedPortfolioData {
  share: PortfolioShare
  project: PortfolioProject
  media: PortfolioMedia[]
}

export function PublicPortfolio({ shareToken, className = '' }: PublicPortfolioProps) {
  const [data, setData] = useState<SharedPortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<PortfolioMedia | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')
  const { toast } = useToast()

  useEffect(() => {
    loadSharedPortfolio()
  }, [shareToken])

  const loadSharedPortfolio = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await PortfolioService.getSharedPortfolio(shareToken)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load portfolio')
      }

      if (!result.share || !result.project || !result.media) {
        throw new Error('Invalid portfolio data')
      }

      // Check if share is expired
      if (result.share.expires_at && new Date(result.share.expires_at) < new Date()) {
        throw new Error('This portfolio share has expired')
      }

      setData({
        share: result.share,
        project: result.project,
        media: result.media
      })

    } catch (error) {
      console.error('Failed to load shared portfolio:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load portfolio'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const downloadMedia = async (mediaItem: PortfolioMedia) => {
    if (!data?.share.allow_downloads) {
      toast({
        title: "Downloads Disabled",
        description: "Downloads are not allowed for this portfolio",
        variant: "destructive",
      })
      return
    }

    try {
      const url = await PortfolioService.getMediaUrl(mediaItem.storage_path)
      const a = document.createElement('a')
      a.href = url
      a.download = mediaItem.title
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: `Downloading ${mediaItem.title}`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download media file",
        variant: "destructive",
      })
    }
  }

  const sharePortfolio = async () => {
    try {
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      
      toast({
        title: "Link Copied",
        description: "Portfolio link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const generatePDF = async () => {
    if (!data) return

    try {
      // This would integrate with a PDF generation service
      toast({
        title: "PDF Generation",
        description: "PDF generation feature coming soon",
      })
    } catch (error) {
      toast({
        title: "PDF Failed",
        description: "Could not generate PDF",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Loading Portfolio</h2>
          <p className="text-muted-foreground">Please wait while we load the project details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/50">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-medium mb-2">Portfolio Unavailable</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { share, project, media } = data

  // Filter media based on visibility settings
  const visibleMedia = media.filter(m => {
    // Add logic here for any visibility filters
    return true
  })

  const mediaStats = {
    total: visibleMedia.length,
    images: visibleMedia.filter(m => m.file_type === 'image').length,
    videos: visibleMedia.filter(m => m.file_type === 'video').length,
    featured: visibleMedia.filter(m => m.is_featured).length
  }

  const featuredMedia = visibleMedia.filter(m => m.is_featured)

  return (
    <div className={`min-h-screen bg-gradient-to-b from-background to-muted/50 ${className}`}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Portfolio</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={sharePortfolio}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={generatePDF}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              {share.allow_downloads && (
                <Badge variant="secondary">Downloads Enabled</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Project Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center justify-center space-x-6 text-muted-foreground">
            {project.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            {project.category && (
              <div className="flex items-center space-x-1">
                <Tag className="h-4 w-4" />
                <span>{project.category}</span>
              </div>
            )}
          </div>

          {project.client_name && (
            <div className="pt-2">
              <span className="text-lg">Project for <strong>{project.client_name}</strong></span>
            </div>
          )}
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{mediaStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Media</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{mediaStats.images}</div>
              <div className="text-sm text-muted-foreground">Images</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{mediaStats.videos}</div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{mediaStats.featured}</div>
              <div className="text-sm text-muted-foreground">Featured</div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Media */}
        {featuredMedia.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Featured Work</h2>
              <p className="text-muted-foreground">Highlights from this project</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMedia.slice(0, 6).map((mediaItem) => (
                <Card 
                  key={mediaItem.id} 
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedMedia(mediaItem)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {mediaItem.file_type === 'video' ? (
                          <>
                            <Play className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                            <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                              Video
                            </Badge>
                          </>
                        ) : (
                          <ImageIcon className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      {share.allow_downloads && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadMedia(mediaItem)
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {mediaItem.title}
                      </h3>
                      {mediaItem.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {mediaItem.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Media Gallery */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gallery</h2>
              <p className="text-muted-foreground">All media from this project</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'masonry' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('masonry')}
              >
                Masonry
              </Button>
            </div>
          </div>

          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
          }>
            {visibleMedia.map((mediaItem) => (
              <Card 
                key={mediaItem.id} 
                className={`group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow ${
                  viewMode === 'masonry' ? 'break-inside-avoid' : ''
                }`}
                onClick={() => setSelectedMedia(mediaItem)}
              >
                <CardContent className="p-0">
                  <div className={`bg-muted relative ${
                    viewMode === 'grid' ? 'aspect-square' : 'aspect-video'
                  }`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {mediaItem.file_type === 'video' ? (
                        <>
                          <Play className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                          <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                            {Math.floor(mediaItem.file_size / 1024 / 1024)}MB
                          </Badge>
                        </>
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    {mediaItem.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        Featured
                      </Badge>
                    )}
                    {share.allow_downloads && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadMedia(mediaItem)
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium group-hover:text-primary transition-colors text-sm">
                      {mediaItem.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-muted-foreground">
            Created with Portfolio CRM • {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div 
            className="w-full max-w-4xl max-h-[90vh] bg-background rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-medium">{selectedMedia.title}</h3>
                {selectedMedia.description && (
                  <p className="text-sm text-muted-foreground">{selectedMedia.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {share.allow_downloads && (
                  <Button size="sm" onClick={() => downloadMedia(selectedMedia)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedMedia(null)}>
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-4">
              {selectedMedia.file_type === 'video' ? (
                <VideoPlayer
                  media={selectedMedia}
                  controls={true}
                  className="w-full"
                />
              ) : (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicPortfolio