"use client"

import { SidebarNav } from "@/components/navigation/sidebar-nav"
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen">
      <SidebarNav currentPath={pathname} />
      <main className="md:pl-64 pt-16">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}