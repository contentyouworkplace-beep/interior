"use client"

import { FileText, Palette, Building2, Sparkles, Crown, Zap } from "lucide-react"

interface TemplateIconProps {
  template: string
  className?: string
}

export function TemplateIcon({ template, className = "h-5 w-5" }: TemplateIconProps) {
  const getTemplateIcon = () => {
    switch (template) {
      case 'modern':
        return <Zap className={`${className} text-blue-500`} />
      case 'classic':
        return <Building2 className={`${className} text-gray-600`} />
      case 'minimalist':
        return <FileText className={`${className} text-slate-500`} />
      case 'corporate':
        return <Building2 className={`${className} text-slate-800`} />
      case 'creative':
        return <Palette className={`${className} text-purple-500`} />
      case 'premium':
        return <Crown className={`${className} text-yellow-600`} />
      default:
        return <FileText className={`${className} text-gray-400`} />
    }
  }

  return getTemplateIcon()
}

export function TemplatePreviewThumbnail({ template, primaryColor = '#3B82F6' }: { template: string, primaryColor?: string }) {
  const thumbnailStyle = {
    modern: `linear-gradient(135deg, ${primaryColor} 0%, #1E40AF 100%)`,
    classic: `linear-gradient(to bottom, #f8fafc 0%, ${primaryColor} 100%)`,
    minimalist: `linear-gradient(to right, #ffffff 0%, #f1f5f9 100%)`,
    corporate: `linear-gradient(90deg, #1e293b 0%, ${primaryColor} 100%)`,
    creative: `linear-gradient(45deg, ${primaryColor} 0%, #6366f1 50%, #8b5cf6 100%)`,
    premium: `linear-gradient(135deg, #1a1a1a 0%, ${primaryColor} 50%, #d4af37 100%)`
  }

  return (
    <div 
      className="w-full h-16 rounded-md mb-2 border border-gray-200 flex items-center justify-center text-white text-xs font-semibold shadow-sm"
      style={{ 
        background: thumbnailStyle[template as keyof typeof thumbnailStyle] || thumbnailStyle.modern 
      }}
    >
      <div className="flex items-center gap-1">
        <TemplateIcon template={template} className="h-4 w-4" />
        <span className="capitalize">{template}</span>
      </div>
    </div>
  )
}