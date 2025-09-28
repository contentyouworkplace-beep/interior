/**
 * Portfolio Dashboard Component
 * Main interface for managing portfolio projects
 * Lightweight design with minimal CRM load
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import PortfolioService from '@/lib/services/portfolio-service'
import type { 
  PortfolioProject, 
  PortfolioFilters, 
  PortfolioStats,
  CreatePortfolioProjectRequest 
} from '@/types/portfolio'
import { 
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Share2,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Video,
  Calendar,
  MapPin,
  User,
  TrendingUp,
  Folder,
  Star,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'

interface PortfolioDashboardProps {
  className?: string
}

export function PortfolioDashboard({ className = '' }: PortfolioDashboardProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<PortfolioFilters>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [filters, searchTerm])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [projectsData, statsData] = await Promise.all([
        PortfolioService.getProjects({ ...filters, search: searchTerm }),
        PortfolioService.getStats()
      ])
      
      setProjects(projectsData.data)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (data: CreatePortfolioProjectRequest) => {
    try {
      const newProject = await PortfolioService.createProject(data)
      setProjects(prev => [newProject, ...prev])
      setShowCreateDialog(false)
      toast({
        title: "Project Created",
        description: `"${newProject.title}" has been created`,
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to create project:', error)
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async (project: PortfolioProject) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"? This will also delete all associated media.`)) {
      return
    }

    try {
      await PortfolioService.deleteProject(project.id)
      setProjects(prev => prev.filter(p => p.id !== project.id))
      toast({
        title: "Project Deleted",
        description: `"${project.title}" has been deleted`,
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  const handleShareProject = async (project: PortfolioProject) => {
    try {
      const shareResult = await PortfolioService.createShare({
        project_id: project.id,
        share_type: 'public',
        allow_download: false,
        allow_comments: false,
        watermark_enabled: false
      })

      if (shareResult.success && shareResult.share_url) {
        // Copy to clipboard
        await navigator.clipboard.writeText(shareResult.share_url)
        toast({
          title: "Share Link Created",
          description: "Public share link copied to clipboard",
          variant: "default",
        })
      } else {
        throw new Error(shareResult.error)
      }
    } catch (error) {
      console.error('Failed to create share:', error)
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Manage your design projects and showcase your work</p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{stats.total_projects}</p>
                </div>
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{stats.published_projects}</p>
                </div>
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Media</p>
                  <p className="text-2xl font-bold">{stats.total_media}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.total_images} images, {stats.total_videos} videos
                  </p>
                </div>
                <div className="flex space-x-1">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Video className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{stats.total_views}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.public_shares} public shares
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilters({})}>
                All Projects
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ status: 'published' })}>
                Published Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ status: 'draft' })}>
                Drafts Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ featured: true })}>
                Featured Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">Create your first portfolio project to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(project) => setSelectedProject(project)}
              onDelete={handleDeleteProject}
              onShare={handleShareProject}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              onEdit={(project) => setSelectedProject(project)}
              onDelete={handleDeleteProject}
              onShare={handleShareProject}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}

// Project Card Component
function ProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onShare 
}: {
  project: PortfolioProject
  onEdit: (project: PortfolioProject) => void
  onDelete: (project: PortfolioProject) => void
  onShare: (project: PortfolioProject) => void
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    // Load thumbnail from first media item
    if (project.media && project.media.length > 0) {
      const firstMedia = project.media[0]
      PortfolioService.getSignedUrl(
        firstMedia.storage_bucket, 
        firstMedia.thumbnail_path || firstMedia.storage_path
      ).then(setThumbnailUrl)
    }
  }, [project.media])

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {project.featured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(project)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(project)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{project.title}</h3>
          <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
            {project.status}
          </Badge>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {project.description || 'No description'}
        </p>
        
        <div className="space-y-1">
          {project.client_name && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-3 w-3 mr-2" />
              {project.client_name}
            </div>
          )}
          
          {project.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-2" />
              {project.location}
            </div>
          )}
          
          {project.project_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 mr-2" />
              {format(new Date(project.project_date), 'MMM yyyy')}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <ImageIcon className="h-3 w-3 mr-1" />
            {project.media?.filter(m => m.file_type === 'image').length || 0}
            <Video className="h-3 w-3 mr-1 ml-3" />
            {project.media?.filter(m => m.file_type === 'video').length || 0}
          </div>
          
          <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Project List Item Component
function ProjectListItem({ 
  project, 
  onEdit, 
  onDelete, 
  onShare 
}: {
  project: PortfolioProject
  onEdit: (project: PortfolioProject) => void
  onDelete: (project: PortfolioProject) => void
  onShare: (project: PortfolioProject) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-16 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold truncate">{project.title}</h3>
              {project.featured && (
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
              <Badge className={`${getStatusColor(project.status)} flex-shrink-0`}>
                {project.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {project.category && (
                <span>{project.category}</span>
              )}
              {project.client_name && (
                <span className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {project.client_name}
                </span>
              )}
              {project.project_date && (
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(project.project_date), 'MMM yyyy')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <ImageIcon className="h-3 w-3 mr-1" />
              {project.media?.filter(m => m.file_type === 'image').length || 0}
            </span>
            <span className="flex items-center">
              <Video className="h-3 w-3 mr-1" />
              {project.media?.filter(m => m.file_type === 'video').length || 0}
            </span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(project)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(project)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}

// Create Project Dialog Component
function CreateProjectDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreatePortfolioProjectRequest) => void
}) {
  const [formData, setFormData] = useState<CreatePortfolioProjectRequest>({
    title: '',
    category: 'Residential',
    description: '',
    client_name: '',
    project_date: '',
    location: '',
    status: 'draft',
    featured: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({
      title: '',
      category: 'Residential',
      description: '',
      client_name: '',
      project_date: '',
      location: '',
      status: 'draft',
      featured: false
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Modern Living Room Design"
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Office">Office</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Client Name</label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
              placeholder="Client Name"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Project Date</label>
            <Input
              type="date"
              value={formData.project_date}
              onChange={(e) => setFormData(prev => ({ ...prev, project_date: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the project..."
              className="w-full px-3 py-2 border rounded-md resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PortfolioDashboard