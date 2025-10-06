"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface PreloaderProps {
  isLoading?: boolean
  onComplete?: () => void
  duration?: number
}

export default function Preloader({ 
  isLoading = true, 
  onComplete, 
  duration = 2000 
}: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(isLoading)

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isLoading, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Clean logo display without circle */}
      <div className="relative">
        <Image
          src="/logo.png"
          alt="Loading"
          width={144}
          height={144}
          className="rounded-lg"
          priority
        />
      </div>
      
      {/* Simple loading text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Loading your workspace...
        </p>
        
        {/* Animated loading lines with sliding animation */}
        <div className="mt-6 space-y-3">
          <div className="w-32 h-1 bg-muted rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary rounded-full animate-pulse w-full"></div>
          </div>
          <div className="w-24 h-1 bg-muted rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary/80 rounded-full animate-pulse w-full" style={{ animationDelay: '0.3s' }}></div>
          </div>
          <div className="w-20 h-1 bg-muted rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary/60 rounded-full animate-pulse w-full" style={{ animationDelay: '0.6s' }}></div>
          </div>
          <div className="w-16 h-1 bg-muted rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-primary/40 rounded-full animate-pulse w-full" style={{ animationDelay: '0.9s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}