"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, 
  Download, 
  CheckCircle, 
  Palette,
  FileText,
  Building2,
  Star,
  Sparkles
} from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  category: 'business' | 'creative' | 'minimal'
  features: string[]
  preview: string
  isPremium?: boolean
  recommended?: boolean
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean and contemporary design with elegant typography",
    category: "business",
    features: ["Clean layout", "Professional typography", "Color accents", "GST compliant"],
    preview: "/templates/modern-preview.png",
    recommended: true
  },
  {
    id: "classic",
    name: "Classic Business",
    description: "Traditional corporate style with formal presentation",
    category: "business", 
    features: ["Traditional layout", "Formal design", "Corporate colors", "Professional"],
    preview: "/templates/classic-preview.png"
  },
  {
    id: "minimalist",
    name: "Minimalist Clean",
    description: "Simple and elegant with focus on content",
    category: "minimal",
    features: ["Minimal design", "Clean typography", "Spacious layout", "Easy to read"],
    preview: "/templates/minimalist-preview.png"
  },
  {
    id: "corporate",
    name: "Corporate Elite",
    description: "Professional corporate look with structured design",
    category: "business",
    features: ["Structured layout", "Corporate branding", "Professional", "Table focused"],
    preview: "/templates/corporate-preview.png"
  },
  {
    id: "creative",
    name: "Creative Studio",
    description: "Bold and artistic design for creative businesses",
    category: "creative",
    features: ["Bold colors", "Creative layout", "Artistic elements", "Unique design"],
    preview: "/templates/creative-preview.png"
  },
  {
    id: "premium",
    name: "Premium Luxury",
    description: "Sophisticated design for high-end businesses",
    category: "business",
    features: ["Luxury feel", "Gold accents", "Premium design", "High-end"],
    preview: "/templates/premium-preview.png",
    isPremium: true
  }
]

interface TemplatePreviewProps {
  onSelect: (templateId: string) => void
  selectedTemplate?: string
}

export function TemplatePreview({ onSelect, selectedTemplate }: TemplatePreviewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredTemplates = templates.filter(template => 
    selectedCategory === "all" || template.category === selectedCategory
  )

  const handlePreview = (templateId: string) => {
    // TODO: Open full preview modal
    console.log("Preview template:", templateId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Choose Your Template</h2>
          <p className="text-muted-foreground">
            Select a professional template for your quotations
          </p>
        </div>
        
        {/* Category Filters */}
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All
          </Button>
          <Button
            variant={selectedCategory === "business" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("business")}
          >
            Business
          </Button>
          <Button
            variant={selectedCategory === "creative" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("creative")}
          >
            Creative
          </Button>
          <Button
            variant={selectedCategory === "minimal" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("minimal")}
          >
            Minimal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => onSelect(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.recommended && (
                      <Badge className="bg-green-100 text-green-800">
                        <Star className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    )}
                    {template.isPremium && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                {selectedTemplate === template.id && (
                  <CheckCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Template Preview */}
              <div className="aspect-[4/5] bg-gray-100 rounded-lg flex items-center justify-center border overflow-hidden">
                {template.preview ? (
                  <img 
                    src={template.preview} 
                    alt={`${template.name} preview`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Template Preview</p>
                    <p className="text-xs text-gray-400">{template.name}</p>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Features:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePreview(template.id)
                  }}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(template.id)
                  }}
                  className="flex-1"
                >
                  {selectedTemplate === template.id ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Selected
                    </>
                  ) : (
                    "Select"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Template Customization Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Palette className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Template Customization</h4>
              <p className="text-sm text-blue-700 mt-1">
                All templates automatically use your business settings including logo, colors, 
                contact information, and GST details from your Business Settings page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TemplatePreview