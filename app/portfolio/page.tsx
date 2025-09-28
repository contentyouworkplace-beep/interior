"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { AddPortfolioModal } from "@/components/add-portfolio-modal"

import { Images, Upload, Folder, Calendar, Plus } from "lucide-react"
import { toast } from "sonner"
import { generateThumbnail, ThumbnailResult } from "@/lib/thumbnail-generator"
import { PortfolioDetailModal } from "@/components/portfolio-detail-modal"
import { PortfolioService } from "@/lib/services/portfolio-service"

import type { PortfolioProject, CreatePortfolioProjectRequest } from "@/types/portfolio"

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<PortfolioProject[]>([])
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioProject | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)


  const handlePortfolioClick = (portfolio: PortfolioProject) => {
    setSelectedPortfolio(portfolio)
    setDetailModalOpen(true)
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

  const handleSavePortfolio = async (data: { name: string; category: string; files: File[] }) => {
    try {
      setLoading(true)
      console.log('Saving portfolio:', data)
      
      toast.info("Creating portfolio...", {
        description: "Creating project and uploading files"
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
      console.log('Portfolio created:', result)
      
      // If files were provided, upload them
      if (data.files && data.files.length > 0) {
        // TODO: Implement file upload logic
        console.log('Files to upload:', data.files)
      }
      
      // Refresh the portfolios
      await loadPortfolios()
      
      toast.success("Portfolio created successfully!", {
        description: `${data.name} has been added to your portfolio`
      })
      

    } catch (error) {
      console.error('Error creating portfolio:', error)
      toast.error("Failed to create portfolio", {
        description: "Please try again later"
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

        {/* Add Sample Data Button for Testing */}
        {portfolios.length === 0 && !loading && (
          <div className="text-center py-12">
            <Images className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Portfolio Projects Yet</h3>
            <p className="text-gray-600 mb-6">Create your first portfolio project to get started</p>
            <p className="text-muted-foreground mb-4">
              Use the "New Project" button above to get started.
            </p>
          </div>
        )}

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
        

        

      </div>
    </DashboardLayout>
  )
}
