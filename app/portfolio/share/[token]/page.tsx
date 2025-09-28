"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Download, 
  ExternalLink, 
  Calendar, 
  FolderOpen, 
  Images, 
  FileText, 
  Eye,
  Share2,
  AlertCircle,
  Loader2
} from "lucide-react"
import type { PortfolioProject, PortfolioMedia } from "@/types/portfolio"
import { PortfolioService } from "@/lib/services/portfolio-service"
import { toast } from "sonner"

export default function SharePortfolioPage() {
  const params = useParams()
  const token = params?.token as string
  
  const [portfolio, setPortfolio] = useState<PortfolioProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadSharedPortfolio()
    }
  }, [token])

  const loadSharedPortfolio = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get shared portfolio by token
      const sharedProject = await PortfolioService.getSharedProject(token)
      
      if (!sharedProject) {
        setError('Portfolio not found or link has expired')
        return
      }
      
      setPortfolio(sharedProject)
    } catch (err) {
      console.error('Failed to load shared portfolio:', err)
      setError('Failed to load portfolio. The link may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

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
      openMedia(url)
      toast.success('File downloaded')
    } catch (e) {
      console.error('Download error', e)
      toast.error('Failed to download file')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Portfolio Not Available</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'This portfolio could not be found.'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{portfolio.title}</h1>
              <div className="flex items-center gap-2 mt-2">
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
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                Shared by GoPLNR
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          
          {/* Description */}
          {portfolio.description && (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-700">{portfolio.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5" />
                Project Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolio.media && portfolio.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolio.media.map((media, index) => (
                    <div 
                      key={media.id || index} 
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group relative"
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
                      ) : (
                        <img 
                          src={media.thumbnail_url || media.storage_path} 
                          alt={media.alt_text || `File ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      )}
                      
                      {/* Watermark */}
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
                        <p className="text-xs text-white bg-black bg-opacity-60 rounded px-2 py-1 truncate">
                          {media.title || media.original_filename || 'Untitled'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Images className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No media files available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Files ({portfolio.media?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {portfolio.media?.map((media, index) => (
                  <div 
                    key={media.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">{getFileTypeIcon(media.mime_type)}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{media.title || media.original_filename || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground">
                          {media.mime_type} • {formatFileSize(media.file_size || 0)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => downloadFile(media)}
                      className="shrink-0"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )) || []}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}