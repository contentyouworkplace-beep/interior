/**
 * Media Gallery Component
 * Displays and manages portfolio media with lazy loading
 * Lightweight design focused on metadata with Supabase CDN for media delivery
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import PortfolioService from '@/lib/services/portfolio-service'
import type { PortfolioMedia, UploadMediaRequest } from '@/types/portfolio'
import { 
  MoreVertical,
  Edit3,
  Trash2,
  Star,
  StarOff,
  Download,
  ExternalLink,
  Play,
  Image as ImageIcon,
  Grid3X3,
  List,
  Search,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface MediaGalleryProps {
  projectId: string
  media?: PortfolioMedia[]
  onMediaUpdate?: (media: PortfolioMedia[]) => void
  viewMode?: 'grid' | 'list'
  showUploadButton?: boolean
  watermarkEnabled?: boolean
  className?: string
}

interface MediaFilters {
  search: string
  type: 'all' | 'image' | 'video'
  featured: 'all' | 'featured' | 'not-featured'
}

export function MediaGallery({ 
  projectId, 
  media: initialMedia = [],
  onMediaUpdate,
  viewMode: initialViewMode = 'grid',
  showUploadButton = false,
  watermarkEnabled = false,
  className = '' 
}: MediaGalleryProps) {
  const [media, setMedia] = useState<PortfolioMedia[]>(initialMedia)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<MediaFilters>({
    search: '',
    type: 'all',
    featured: 'all'
  })
  const [editingMedia, setEditingMedia] = useState<PortfolioMedia | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })
  const { toast } = useToast()

  // Load media if not provided
  useEffect(() => {
    if (initialMedia.length === 0) {
      loadMedia()
    }
  }, [projectId, initialMedia.length])

  const loadMedia = async () => {
    try {
      setLoading(true)
      const result = await PortfolioService.getProjectMedia(projectId)
      setMedia(result)
      onMediaUpdate?.(result)
    } catch (error) {
      console.error('Failed to load media:', error)
      toast({
        title: "Failed to Load Media",
        description: "Could not load project media",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter media based on current filters
  const filteredMedia = media.filter(item => {
    // Search filter
    if (filters.search && !item.title?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    // Type filter
    if (filters.type !== 'all' && item.file_type !== filters.type) {
      return false
    }

    // Featured filter
    if (filters.featured === 'featured' && !item.is_featured) {
      return false
    }
    if (filters.featured === 'not-featured' && item.is_featured) {
      return false
    }

    return true
  })

  // Toggle media selection
  const toggleSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMedia)
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId)
    } else {
      newSelection.add(mediaId)
    }
    setSelectedMedia(newSelection)
  }

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedMedia.size === filteredMedia.length) {
      setSelectedMedia(new Set())
    } else {
      setSelectedMedia(new Set(filteredMedia.map(m => m.id)))
    }
  }

  // Toggle featured status
  const toggleFeatured = async (mediaItem: PortfolioMedia) => {
    try {
      const updateRequest: Partial<PortfolioMedia> = {
        title: mediaItem.title,
        description: mediaItem.description,
        is_featured: !mediaItem.is_featured
      }

      const result = await PortfolioService.updateMedia(mediaItem.id, updateRequest)
      setMedia(prev => prev.map(m => 
        m.id === mediaItem.id ? result : m
      ))
      onMediaUpdate?.(media.map(m => 
        m.id === mediaItem.id ? result : m
      ))

      toast({
        title: result.is_featured ? "Featured" : "Unfeatured",
        description: `${mediaItem.title || 'Media'} ${result.is_featured ? 'marked as featured' : 'removed from featured'}`,
      })
    } catch (error) {
      console.error('Failed to toggle featured:', error)
      toast({
        title: "Update Failed",
        description: "Could not update media status",
        variant: "destructive",
      })
    }
  }

  // Delete media
  const deleteMedia = async (mediaIds: string[]) => {
    try {
      for (const mediaId of mediaIds) {
        await PortfolioService.deleteMedia(mediaId)
      }

      setMedia(prev => prev.filter(m => !mediaIds.includes(m.id)))
      setSelectedMedia(new Set())
      onMediaUpdate?.(media.filter(m => !mediaIds.includes(m.id)))

      toast({
        title: "Media Deleted",
        description: `${mediaIds.length} item(s) deleted successfully`,
      })
    } catch (error) {
      console.error('Failed to delete media:', error)
      toast({
        title: "Delete Failed",
        description: "Could not delete selected media",
        variant: "destructive",
      })
    }
  }

  // Edit media
  const startEdit = (mediaItem: PortfolioMedia) => {
    setEditingMedia(mediaItem)
    setEditForm({
      title: mediaItem.title || '',
      description: mediaItem.description || ''
    })
  }

  const saveEdit = async () => {
    if (!editingMedia) return

    try {
      const updateRequest: Partial<PortfolioMedia> = {
        title: editForm.title,
        description: editForm.description,
        is_featured: editingMedia.is_featured
      }

      const result = await PortfolioService.updateMedia(editingMedia.id, updateRequest)
      setMedia(prev => prev.map(m => 
        m.id === editingMedia.id ? result : m
      ))
      onMediaUpdate?.(media.map(m => 
        m.id === editingMedia.id ? result : m
      ))
      setEditingMedia(null)

      toast({
        title: "Media Updated",
        description: "Media information saved successfully",
      })
    } catch (error) {
      console.error('Failed to update media:', error)
      toast({
        title: "Update Failed",
        description: "Could not save media changes",
        variant: "destructive",
      })
    }
  }

  // Download media
  const downloadMedia = async (mediaItem: PortfolioMedia) => {
    try {
      const url = await PortfolioService.getDownloadUrlForMedia(mediaItem)
      if (!url) {
        throw new Error('Could not generate download URL')
      }
      const a = document.createElement('a')
      a.href = url
      a.download = mediaItem.title || mediaItem.filename || 'download'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download media:', error)
      toast({
        title: "Download Failed",
        description: "Could not download media file",
        variant: "destructive",
      })
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Get media thumbnail URL
  const getMediaUrl = useCallback(async (bucket: string, storagePath: string) => {
    return PortfolioService.getSignedUrl(bucket, storagePath)
  }, [])

  // Media Item Component
  const MediaItem = ({ mediaItem }: { mediaItem: PortfolioMedia }) => {
    const [imageUrl, setImageUrl] = useState<string>('')
    const [imageLoading, setImageLoading] = useState(true)

    useEffect(() => {
      const loadImage = async () => {
        try {
          const url = await getMediaUrl(mediaItem.storage_path)
          setImageUrl(url)
        } catch (error) {
          console.error('Failed to load image URL:', error)
        } finally {
          setImageLoading(false)
        }
      }
      loadImage()
    }, [mediaItem.storage_path])

    if (viewMode === 'list') {
      return (
        <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50">
          <Checkbox
            checked={selectedMedia.has(mediaItem.id)}
            onCheckedChange={() => toggleSelection(mediaItem.id)}
          />
          
          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-muted">
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full">
                {mediaItem.file_type === 'image' ? (
                  <img 
                    src={imageUrl} 
                    alt={mediaItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <video 
                      src={imageUrl} 
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium truncate">{mediaItem.title}</h3>
              {mediaItem.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            </div>
            <p className="text-sm text-muted-foreground">
              {mediaItem.file_type === 'video' ? 'Video' : 'Image'} • {formatFileSize(mediaItem.file_size || 0)}
            </p>
            {mediaItem.description && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {mediaItem.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => startEdit(mediaItem)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleFeatured(mediaItem)}>
                {mediaItem.is_featured ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    Remove Featured
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Mark Featured
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadMedia(mediaItem)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => deleteMedia([mediaItem.id])}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }

    // Grid view
    return (
      <Card className="group relative overflow-hidden">
        <CardContent className="p-0">
          <div className="absolute top-2 left-2 z-10">
            <Checkbox
              checked={selectedMedia.has(mediaItem.id)}
              onCheckedChange={() => toggleSelection(mediaItem.id)}
              className="bg-white/80 backdrop-blur-sm"
            />
          </div>

          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white/80 backdrop-blur-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEdit(mediaItem)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleFeatured(mediaItem)}>
                  {mediaItem.is_featured ? (
                    <>
                      <StarOff className="mr-2 h-4 w-4" />
                      Remove Featured
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Mark Featured
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadMedia(mediaItem)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => deleteMedia([mediaItem.id])}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="aspect-square bg-muted">
            {imageLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : imageUrl ? (
              <div className="relative w-full h-full">
                {mediaItem.file_type === 'image' ? (
                  <img 
                    src={imageUrl} 
                    alt={mediaItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <video 
                      src={imageUrl} 
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </>
                )}
                {mediaItem.is_featured && (
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-yellow-500">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-medium truncate">{mediaItem.title}</h3>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(mediaItem.file_size || 0)}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-9 w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="p-2">
                <Label className="text-xs font-medium">Type</Label>
                <div className="mt-1 space-y-1">
                  {['all', 'image', 'video'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.type === type}
                        onCheckedChange={() => setFilters(prev => ({ ...prev, type: type as any }))}
                      />
                      <Label className="text-sm capitalize">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Label className="text-xs font-medium">Featured</Label>
                <div className="mt-1 space-y-1">
                  {['all', 'featured', 'not-featured'].map((featured) => (
                    <div key={featured} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.featured === featured}
                        onCheckedChange={() => setFilters(prev => ({ ...prev, featured: featured as any }))}
                      />
                      <Label className="text-sm capitalize">{featured.replace('-', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center space-x-2">
          {selectedMedia.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedMedia.size} selected
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Media</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedMedia.size} selected media item(s)? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => deleteMedia(Array.from(selectedMedia))}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selection toolbar */}
      {filteredMedia.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedMedia.size === filteredMedia.length}
              onCheckedChange={toggleSelectAll}
            />
            <Label className="text-sm">
              Select All ({filteredMedia.length} items)
            </Label>
          </div>

          <div className="text-sm text-muted-foreground">
            {filteredMedia.length} of {media.length} items
          </div>
        </div>
      )}

      {/* Media Grid/List */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No media found</h3>
              <p className="text-muted-foreground mb-4">
                {media.length === 0 
                  ? "This project doesn't have any media yet."
                  : "No media matches your current filters."
                }
              </p>
              {media.length === 0 && showUploadButton && (
                <Button>
                  Upload Media
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "space-y-2"
        }>
          {filteredMedia.map((mediaItem) => (
            <MediaItem key={mediaItem.id} mediaItem={mediaItem} />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update the title and description for this media item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter media title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter media description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMedia(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MediaGallery