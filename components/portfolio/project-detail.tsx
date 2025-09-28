/**
 * Portfolio Project Detail Page
 * Comprehensive project view with media gallery, upload, and video playback
 * Lightweight design with all heavy lifting handled by Supabase
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import MediaUpload from './media-upload'
import MediaGallery from './media-gallery'
import VideoPlayer from './video-player'
import PortfolioService from '@/lib/services/portfolio-service'
import type { PortfolioProject, PortfolioMedia } from '@/types/portfolio'
import { 
  Upload,
  Share2,
  Download,
  Edit,
  Calendar,
  MapPin,
  Tag,
  Play,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'

interface ProjectDetailProps {
  projectId: string
  onBack?: () => void
  className?: string
}

export function ProjectDetail({ projectId, onBack, className = '' }: ProjectDetailProps) {
  const [project, setProject] = useState<PortfolioProject | null>(null)
  const [media, setMedia] = useState<PortfolioMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<PortfolioMedia | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  // Load project and media
  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      setLoading(true)

      // Load project details
      const projectResult = await PortfolioService.getProject(projectId)
      if (!projectResult.success || !projectResult.project) {
        throw new Error(projectResult.error || 'Project not found')
      }

      setProject(projectResult.project)

      // Load project media
      const mediaResult = await PortfolioService.getProjectMedia(projectId)
      if (mediaResult.success && mediaResult.media) {
        setMedia(mediaResult.media)
      }

    } catch (error) {
      console.error('Failed to load project:', error)
      toast({
        title: "Failed to Load Project",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMediaUploadComplete = (newMedia: PortfolioMedia[]) => {
    setMedia(prev => [...prev, ...newMedia])
    setUploadDialogOpen(false)
    toast({
      title: "Upload Complete",
      description: `${newMedia.length} media item(s) uploaded successfully`,
    })
  }

  const handleMediaUpdate = (updatedMedia: PortfolioMedia[]) => {
    setMedia(updatedMedia)
  }

  const handleShareProject = async () => {
    if (!project) return

    try {
      const shareResult = await PortfolioService.createShare(project.id, {
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        password_protected: false,
        allow_downloads: true
      })

      if (shareResult.success && shareResult.share) {
        // Copy share URL to clipboard
        const shareUrl = `${window.location.origin}/portfolio/shared/${shareResult.share.share_token}`
        await navigator.clipboard.writeText(shareUrl)
        
        toast({
          title: "Share Link Created",
          description: "Share link copied to clipboard",
        })
      }
    } catch (error) {
      console.error('Failed to create share link:', error)
      toast({
        title: "Share Failed",
        description: "Could not create share link",
        variant: "destructive",
      })
    }
  }

  // Get media statistics
  const mediaStats = {
    total: media.length,
    images: media.filter(m => m.file_type === 'image').length,
    videos: media.filter(m => m.file_type === 'video').length,
    featured: media.filter(m => m.is_featured).length,
    processing: media.filter(m => m.processing_status === 'processing').length
  }

  // Group media by type for display
  const featuredMedia = media.filter(m => m.is_featured).slice(0, 6)
  const imageMedia = media.filter(m => m.file_type === 'image')
  const videoMedia = media.filter(m => m.file_type === 'video')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Project not found</p>
            {onBack && (
              <Button className="mt-4" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">{project.title}</h1>
            {project.description && (
              <p className="text-lg text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {project.location && (
              <div className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                {project.location}
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {new Date(project.created_at).toLocaleDateString()}
            </div>
            {project.category && (
              <div className="flex items-center">
                <Tag className="mr-1 h-4 w-4" />
                {project.category}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Media</DialogTitle>
                <DialogDescription>
                  Add images and videos to your portfolio project
                </DialogDescription>
              </DialogHeader>
              <MediaUpload
                projectId={project.id}
                onUploadComplete={handleMediaUploadComplete}
                maxFiles={10}
              />
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleShareProject}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{mediaStats.processing}</div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">All Media ({mediaStats.total})</TabsTrigger>
          <TabsTrigger value="videos">Videos ({mediaStats.videos})</TabsTrigger>
          <TabsTrigger value="featured">Featured ({mediaStats.featured})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Featured Media Preview */}
          {featuredMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Featured Media
                </CardTitle>
                <CardDescription>
                  Highlighted images and videos from this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {featuredMedia.map((mediaItem) => (
                    <div 
                      key={mediaItem.id} 
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedMedia(mediaItem)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        {mediaItem.file_type === 'video' ? (
                          <Play className="h-8 w-8 text-white" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-sm bg-black/50 backdrop-blur-sm rounded px-2 py-1 truncate">
                          {mediaItem.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge>{project.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Updated:</span>
                      <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>
                    {project.client_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Client:</span>
                        <span>{project.client_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Media Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Files:</span>
                      <span>{mediaStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Images:</span>
                      <span>{mediaStats.images}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Videos:</span>
                      <span>{mediaStats.videos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Featured:</span>
                      <span>{mediaStats.featured}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <MediaGallery
            projectId={project.id}
            media={media}
            onMediaUpdate={handleMediaUpdate}
            showUploadButton={true}
          />
        </TabsContent>

        <TabsContent value="videos">
          <MediaGallery
            projectId={project.id}
            media={videoMedia}
            onMediaUpdate={handleMediaUpdate}
            showUploadButton={true}
          />
        </TabsContent>

        <TabsContent value="featured">
          <MediaGallery
            projectId={project.id}
            media={featuredMedia}
            onMediaUpdate={handleMediaUpdate}
            showUploadButton={true}
          />
        </TabsContent>
      </Tabs>

      {/* Media Viewer Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedMedia && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedMedia.title}</DialogTitle>
                {selectedMedia.description && (
                  <DialogDescription>
                    {selectedMedia.description}
                  </DialogDescription>
                )}
              </DialogHeader>
              
              {selectedMedia.file_type === 'video' ? (
                <VideoPlayer
                  media={selectedMedia}
                  controls={true}
                  className="w-full"
                />
              ) : (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={`${selectedMedia.storage_path}`} // This would need proper URL resolution
                    alt={selectedMedia.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProjectDetail