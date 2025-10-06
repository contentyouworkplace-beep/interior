"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { AddPortfolioModal } from "@/components/add-portfolio-modal"

import { Images, Upload, Folder, Calendar, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { generateThumbnail, ThumbnailResult } from "@/lib/thumbnail-generator"
import { PortfolioDetailModal } from "@/components/portfolio-detail-modal"
import { PortfolioService } from "@/lib/services/portfolio-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import type { PortfolioProject, CreatePortfolioProjectRequest } from "@/types/portfolio"

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<PortfolioProject[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioProject | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [portfolioToDelete, setPortfolioToDelete] = useState<PortfolioProject | null>(null)


  const handlePortfolioClick = (portfolio: PortfolioProject) => {
    setSelectedPortfolio(portfolio)
    setDetailModalOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, portfolio: PortfolioProject) => {
    e.stopPropagation() // Prevent opening detail modal
    setPortfolioToDelete(portfolio)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!portfolioToDelete) return

    try {
      await PortfolioService.deleteProject(portfolioToDelete.id)
      
      toast.success("Portfolio deleted", {
        description: `${portfolioToDelete.title} has been removed`
      })
      
      // Close modal if deleted portfolio was open
      if (selectedPortfolio?.id === portfolioToDelete.id) {
        setDetailModalOpen(false)
        setSelectedPortfolio(null)
      }
      
      // Refresh the list
      await loadPortfolios()
    } catch (error) {
      console.error('Failed to delete portfolio:', error)
      toast.error("Failed to delete portfolio", {
        description: "Please try again or contact support"
      })
    } finally {
      setDeleteConfirmOpen(false)
      setPortfolioToDelete(null)
    }
  }

  // Load portfolios from Supabase
  const loadPortfolios = async () => {
    try {
      setLoading(true)
      const response = await PortfolioService.getProjects()
      setPortfolios(response.data)
    } catch (error) {
      console.error('Failed to load portfolios:', error)
      setPortfolios([])
    } finally {
      setLoading(false)
    }
  }
  
  // Load portfolios on component mount
  React.useEffect(() => {
    loadPortfolios()
  }, [])

    const handleSavePortfolio = async (
    data: { name: string; category: string; files: File[] },
    onProgress?: (uploaded: number, total: number, currentFile: string) => void
  ) => {
    try {
      setLoading(true)
      console.log('🎯 Creating portfolio:', data.name)
      
      const loadingToast = toast.loading("Creating portfolio...", {
        description: "Setting up your project"
      })

      // Convert the modal data to the correct interface
      const projectData: CreatePortfolioProjectRequest = {
        title: data.name,
        category: data.category,
        description: `A beautiful ${data.category.toLowerCase()} project`,
        status: 'published',
        featured: false
      }

      const result = await PortfolioService.createProject(projectData)
      console.log('✅ Portfolio created:', result.id)
      
      // Upload files if provided
      if (data.files && data.files.length > 0) {
        console.log(`📁 Uploading ${data.files.length} files...`)
        
        toast.loading(`Uploading files...`, {
          id: loadingToast,
          description: `0/${data.files.length} files uploaded`
        })
        
        let uploadedCount = 0
        const totalFiles = data.files.length
        
        // Upload files one by one with progress
        for (const file of data.files) {
          try {
            console.log(`⬆️ Uploading: ${file.name}`)
            
            // Call progress callback BEFORE uploading
            onProgress?.(uploadedCount, totalFiles, file.name)
            
            const uploadResponse = await PortfolioService.uploadMedia({
              project_id: result.id,
              file,
              title: file.name.split('.')[0],
              is_featured: uploadedCount === 0 // First file as featured
            })
            
            if (uploadResponse.success) {
              uploadedCount++
              console.log(`✅ Uploaded: ${file.name}`)
              
              // Call progress callback AFTER uploading
              onProgress?.(uploadedCount, totalFiles, file.name)
              
              toast.loading(`Uploading files...`, {
                id: loadingToast,
                description: `${uploadedCount}/${totalFiles} files uploaded`
              })
            } else {
              console.error(`❌ Failed to upload ${file.name}:`, uploadResponse.error)
            }
          } catch (uploadError) {
            console.error(`❌ Error uploading ${file.name}:`, uploadError)
          }
        }
        
        console.log(`🎉 Upload complete: ${uploadedCount}/${totalFiles} files`)
        
        if (uploadedCount === totalFiles) {
          toast.success("Portfolio created successfully!", {
            id: loadingToast,
            description: `${data.name} with ${uploadedCount} files`
          })
        } else if (uploadedCount > 0) {
          toast.warning("Portfolio created with some files", {
            id: loadingToast,
            description: `${uploadedCount}/${totalFiles} files uploaded successfully`
          })
        } else {
          toast.error("Portfolio created but files failed", {
            id: loadingToast,
            description: "Please try uploading files again"
          })
        }
      } else {
        toast.success("Portfolio created successfully!", {
          id: loadingToast,
          description: `${data.name} has been added`
        })
      }
      
      // Refresh the portfolios
      await loadPortfolios()

    } catch (error) {
      console.error('❌ Failed to create portfolio:', error)
      toast.error("Failed to create portfolio", {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Portfolio" currentPath="/portfolio">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">My Portfolio</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Showcasing beautiful interior design projects and transformations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4">
          <AddPortfolioModal onSave={handleSavePortfolio} />
        </div>



        {/* Portfolio Stats */}
        {portfolios.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{portfolios.length}</p>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Images className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {portfolios.reduce((acc, p) => acc + (p.media?.length || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(portfolios.map(p => p.category)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Removed duplicate early empty state to avoid showing two messages */}

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User's Portfolio Items */}
          {portfolios.length > 0 && portfolios.map((portfolio) => (
            <Card 
              key={portfolio.id} 
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => handlePortfolioClick(portfolio)}
            >
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative">
                {(() => {
                  // Function to get the best thumbnail image
                  const getBestThumbnail = () => {
                    if (!portfolio.media || portfolio.media.length === 0) return null;
                    
                    // First try to find a featured image
                    const featuredMedia = portfolio.media.find(m => m.is_featured && m.mime_type.startsWith('image/'));
                    if (featuredMedia && featuredMedia.thumbnail_url) {
                      return featuredMedia.thumbnail_url;
                    }
                    
                    // Then try to find any image with thumbnail
                    const imageWithThumbnail = portfolio.media.find(m => 
                      m.mime_type.startsWith('image/') && m.thumbnail_url
                    );
                    if (imageWithThumbnail && imageWithThumbnail.thumbnail_url) {
                      return imageWithThumbnail.thumbnail_url;
                    }
                    
                    // Fallback to first image's media_url
                    const firstImage = portfolio.media.find(m => m.mime_type.startsWith('image/'));
                    if (firstImage && firstImage.media_url) {
                      return firstImage.media_url;
                    }
                    
                    // Last fallback: any media with thumbnail
                    const anyWithThumbnail = portfolio.media.find(m => m.thumbnail_url);
                    return anyWithThumbnail?.thumbnail_url || null;
                  };
                  
                  const thumbnailUrl = getBestThumbnail();
                  
                  return thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt={portfolio.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Hide broken image and show placeholder
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null;
                })()}
                
                {/* Placeholder (shown by default if no image, or if image fails to load) */}
                <div 
                  className={`absolute inset-0 flex items-center justify-center ${
                    (() => {
                      const thumbnailUrl = (() => {
                        if (!portfolio.media || portfolio.media.length === 0) return null;
                        const featuredMedia = portfolio.media.find(m => m.is_featured && m.mime_type.startsWith('image/'));
                        if (featuredMedia && featuredMedia.thumbnail_url) return featuredMedia.thumbnail_url;
                        const imageWithThumbnail = portfolio.media.find(m => m.mime_type.startsWith('image/') && m.thumbnail_url);
                        if (imageWithThumbnail && imageWithThumbnail.thumbnail_url) return imageWithThumbnail.thumbnail_url;
                        const firstImage = portfolio.media.find(m => m.mime_type.startsWith('image/'));
                        if (firstImage && firstImage.media_url) return firstImage.media_url;
                        const anyWithThumbnail = portfolio.media.find(m => m.thumbnail_url);
                        return anyWithThumbnail?.thumbnail_url || null;
                      })();
                      return thumbnailUrl ? 'hidden' : 'flex';
                    })()
                  }`}
                >
                  <Images className="h-16 w-16 text-gray-400" />
                </div>
                
                {/* Media count overlay */}
                {portfolio.media && portfolio.media.length > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black bg-opacity-60 text-white text-xs">
                      <Images className="h-3 w-3 mr-1" />
                      {portfolio.media.length}
                    </Badge>
                  </div>
                )}
                
                {/* Category overlay */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="capitalize bg-white bg-opacity-90 text-gray-700 text-xs">
                    {portfolio.category}
                  </Badge>
                </div>

                {/* Delete button overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => handleDeleteClick(e, portfolio)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {portfolio.title}
                </CardTitle>
                {portfolio.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {portfolio.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {new Date(portfolio.created_at).toLocaleDateString()}
                  </p>
                  {portfolio.status && (
                    <Badge 
                      variant={portfolio.status === 'published' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {portfolio.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}

          {/* Empty State */}
          {portfolios.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Images className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No portfolios yet</h3>
              <p className="text-gray-500 mb-4 max-w-md">
                Start building your portfolio by creating your first project. 
                Showcase your best work to potential clients.
              </p>
            </div>
          )}
        </div>



        {/* Portfolio Detail Modal */}
        <PortfolioDetailModal 
          portfolio={selectedPortfolio}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onProjectUpdate={(updatedProject) => {
            // Update the project in the list
            setPortfolios(prev => 
              prev.map(p => p.id === updatedProject.id ? updatedProject : p)
            )
            // Update the selected project for the modal
            setSelectedPortfolio(updatedProject)
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Portfolio?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{portfolioToDelete?.title}"? 
                This will permanently delete the portfolio and all its files. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Portfolio
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  )
}
