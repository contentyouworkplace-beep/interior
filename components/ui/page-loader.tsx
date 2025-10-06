"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Preloader from "./preloader"

interface PageLoaderProps {
  children: React.ReactNode
  minLoadTime?: number
}

export default function PageLoader({ children, minLoadTime = 1000 }: PageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    if (isFirstLoad) {
      // First page load
      const timer = setTimeout(() => {
        setIsLoading(false)
        setIsFirstLoad(false)
      }, minLoadTime)

      return () => clearTimeout(timer)
    } else {
      // Page transitions
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 800) // Shorter for page transitions

      return () => clearTimeout(timer)
    }
  }, [pathname, isFirstLoad, minLoadTime])

  return (
    <>
      <Preloader 
        isLoading={isLoading} 
        duration={isFirstLoad ? minLoadTime : 800}
      />
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </>
  )
}