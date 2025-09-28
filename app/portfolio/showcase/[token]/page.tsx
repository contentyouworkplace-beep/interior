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
  Loader2,
  User,
  Briefcase,
  Award,
  MapPin
} from "lucide-react"
import type { PortfolioProject } from "@/types/portfolio"
import { PortfolioService } from "@/lib/services/portfolio-service"
import { toast } from "sonner"

export default function PortfolioShowcasePage() {
  const params = useParams()
  const token = params?.token as string
  
  const [portfolios, setPortfolios] = useState<PortfolioProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showcaseInfo, setShowcaseInfo] = useState<{
    designer_name?: string
    company_name?: string
    bio?: string
    location?: string
  }>({})

  useEffect(() => {
    if (token) {
      loadPortfolioShowcase()
    }
  }, [token])

  const loadPortfolioShowcase = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get showcase data by token
      const showcaseData = await PortfolioService.getPortfolioShowcase(token)
      
      if (!showcaseData || showcaseData.length === 0) {
        setError('Portfolio showcase not found or no projects available')
        return
      }
      
      setPortfolios(showcaseData)
      
      // Set some mock designer info (you can extend this with real user data)
      setShowcaseInfo({
        designer_name: "Interior Designer",
        company_name: "GoPLNR Design Studio",
        bio: "Creating beautiful, functional spaces that reflect your unique style and personality.",
        location: "Professional Interior Design Services"
      })
      
    } catch (err) {
      console.error('Failed to load portfolio showcase:', err)
      setError('Failed to load portfolio showcase. The link may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (portfolio: PortfolioProject) => {
    // For showcase, we'll open projects in a modal or navigate to individual share pages
    if (portfolio.id) {
      // You can implement individual project sharing here
      toast.info('Individual project sharing coming soon!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">Loading portfolio showcase...</p>
        </div>
      </div>
    )
  }

  if (error || portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Portfolio Showcase Not Available</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'This portfolio showcase could not be found.'}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            {/* Designer Info */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{showcaseInfo.designer_name}</h1>
              <p className="text-xl text-gray-600 mb-2">{showcaseInfo.company_name}</p>
              {showcaseInfo.location && (
                <div className="flex items-center justify-center gap-1 text-gray-500 mb-4">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{showcaseInfo.location}</span>
                </div>
              )}
              <p className="text-gray-700 max-w-2xl mx-auto">{showcaseInfo.bio}</p>
            </div>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{portfolios.length}</div>
                <div className="text-sm text-gray-500">Projects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {portfolios.reduce((acc, p) => acc + (p.media?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Photos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {new Set(portfolios.map(p => p.category)).size}
                </div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
            </div>
            
            {/* Branding */}
            <div className="text-xs text-gray-400">
              Powered by <span className="font-semibold text-gray-600">GoPLNR</span> - Professional Interior Design Platform
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Portfolio Showcase</h2>
          <p className="text-gray-600">Explore our latest interior design projects and transformations</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolios.map((portfolio) => (
            <Card 
              key={portfolio.id} 
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => handleProjectClick(portfolio)}
            >
              <div className="aspect-video bg-gray-100 overflow-hidden relative">
                {/* Featured Image or First Media */}
                {portfolio.media && portfolio.media.length > 0 ? (
                  <img
                    src={portfolio.media.find(m => m.is_featured)?.thumbnail_url || portfolio.media[0]?.thumbnail_url || '/placeholder-image.jpg'}
                    alt={portfolio.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Images className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-3">
                      <ExternalLink className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>
                </div>
                
                {/* Watermark */}
                <div className="absolute top-3 left-3 bg-white bg-opacity-90 rounded px-2 py-1 text-xs font-bold text-gray-700 shadow-sm">
                  GoPLNR
                </div>
                
                {/* Category Badge */}
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="capitalize bg-white bg-opacity-90 text-gray-700">
                    {portfolio.category}
                  </Badge>
                </div>
                
                {/* Media Count */}
                {portfolio.media && portfolio.media.length > 0 && (
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="bg-black bg-opacity-60 text-white">
                      <Images className="h-3 w-3 mr-1" />
                      {portfolio.media.length}
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {portfolio.title}
                </h3>
                {portfolio.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {portfolio.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(portfolio.created_at).toLocaleDateString()}
                  </div>
                  {portfolio.client_name && (
                    <div className="text-sm text-gray-500">
                      {portfolio.client_name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Transform Your Space?</h3>
              <p className="text-gray-600 mb-4">
                Get in touch to discuss your interior design project and bring your vision to life.
              </p>
              <Button className="w-full">
                <Briefcase className="h-4 w-4 mr-2" />
                Start Your Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 {showcaseInfo.company_name}. Portfolio powered by{" "}
            <span className="font-semibold text-blue-600">GoPLNR</span> - 
            Professional Interior Design Platform
          </p>
        </div>
      </div>
    </div>
  )
}