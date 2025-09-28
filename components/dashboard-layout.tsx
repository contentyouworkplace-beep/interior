"use client"

import type React from "react"

import { SidebarNav } from "./sidebar-nav"
import { DashboardHeader } from "./dashboard-header"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  currentPath?: string
  showBackButton?: boolean
  actions?: React.ReactNode
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  currentPath, 
  showBackButton = false,
  actions 
}: DashboardLayoutProps) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className="min-h-screen bg-background">
      <SidebarNav currentPath={currentPath} />

      <div className={cn(
        "transition-all duration-300 ease-in-out",
        // Desktop: Account for sidebar width
        isCollapsed ? "lg:pl-16" : "lg:pl-64",
        // Mobile: Add top padding to account for hamburger menu
        "pl-0 pt-10 lg:pt-0"
      )}>
        <DashboardHeader 
          title={title} 
          subtitle={subtitle} 
          showBackButton={showBackButton}
          actions={actions}
        />

        <main className="p-3 sm:p-4">{children}</main>
      </div>
    </div>
  )
}
