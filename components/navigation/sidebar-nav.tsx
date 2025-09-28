"use client"
import React from "react"
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  Receipt,
  UserCheck,
  Calendar,
  Settings,
  X,
  Menu,
  LogOut,
  Crown,
  Building2,
  BarChart3,
  Truck,
  Images,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { usePathname, useSearchParams } from "next/navigation"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current: boolean
  badge?: string
  comingSoon?: boolean
}

interface SidebarNavProps {
  currentPath?: string
}

export function SidebarNav({ currentPath = "/dashboard" }: SidebarNavProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error("Error during sign out:", err)
    } finally {
      setIsMobileOpen(false)
    }
  }

  // HARDCORE HACK: Force detection of current page
  const [forceUpdate, setForceUpdate] = React.useState(0)
  
  React.useEffect(() => {
    // Force re-render every 100ms to catch any route changes
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1)
    }, 100)
    
    return () => clearInterval(interval)
  }, [])

  // HARDCORE: Always check window.location directly, no state
  const getCurrentPath = () => {
    if (typeof window === "undefined") return currentPath || "/dashboard"
    return window.location.pathname
  }

  const currentPath_ = getCurrentPath()
  
  // HARDCORE: Force Invoices to be true if URL contains invoices
  const isInvoicesPage = currentPath_.includes('/invoices') || window?.location?.href?.includes('invoices') || false
  const isQuotationsPage = currentPath_.includes('/quotations') || window?.location?.href?.includes('quotations') || false
  const isDashboardPage = (currentPath_ === '/dashboard' || currentPath_ === '/') && !isInvoicesPage && !isQuotationsPage
  const isClientsPage = currentPath_.includes('/clients') && !isInvoicesPage
  const isProjectsPage = currentPath_.includes('/projects') && !isInvoicesPage
  const isExpensesPage = currentPath_.includes('/expenses') && !isInvoicesPage
  const isTeamPage = currentPath_.includes('/team') && !isInvoicesPage
  const isVendorsPage = currentPath_.includes('/vendors') && !isInvoicesPage
  const isReportsPage = currentPath_.includes('/reports') && !isInvoicesPage
  const isPortfolioPage = currentPath_.includes('/portfolio') && !isInvoicesPage
  const isAILocalSEOPage = currentPath_.includes('/ai-local-seo') && !isInvoicesPage
  const is3DViewPage = currentPath_.includes('/3d-view') && !isInvoicesPage
  const isSettingsPage = currentPath_.includes('/settings') && !isInvoicesPage
  
  // DEBUG: Log everything
  console.log('HARDCORE DEBUG:', {
    currentPath_,
    windowLocation: typeof window !== 'undefined' ? window.location.pathname : 'undefined',
    windowHref: typeof window !== 'undefined' ? window.location.href : 'undefined',
    isInvoicesPage,
    isDashboardPage,
    forceUpdate
  })

  const navigation: NavigationItem[] = [
    // Core Business
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: isDashboardPage,
    },
    {
      name: "Clients",
      href: "/clients",
      icon: Users,
      current: isClientsPage,
      badge: "Core",
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderOpen,
      current: isProjectsPage,
      badge: "Core",
    },
    // Financial Management
    {
      name: "Expenses",
      href: "/expenses",
      icon: Receipt,
      current: isExpensesPage,
      badge: "Finance",
    },
    {
      name: "Quotations",
      href: "/quotations",
      icon: FileText,
      current: isQuotationsPage,
      badge: "Finance",
    },
    {
      name: "Invoices",
      href: "/invoices",
      icon: Receipt,
      current: isInvoicesPage,
      badge: "Finance",
    },
    // Team & Collaboration
    {
      name: "Team",
      href: "/team",
      icon: UserCheck,
      current: isTeamPage,
      badge: "Team",
    },
    {
      name: "Vendors",
      href: "/vendors",
      icon: Truck,
      current: isVendorsPage,
      badge: "Business",
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      current: isReportsPage,
    },
    {
      name: "Portfolio",
      href: "/portfolio",
      icon: Images,
      current: isPortfolioPage,
    },
    {
      name: "AI Local SEO",
      href: "/ai-local-seo",
      icon: Users,
      current: isAILocalSEOPage,
      badge: "Free",
    },
    {
      name: "3D View",
      href: "/3d-view",
      icon: LayoutDashboard,
      current: is3DViewPage,
      comingSoon: true,
    },
  ]

  const bottomNavigation: NavigationItem[] = [
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      current: isSettingsPage,
    },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-background/95 backdrop-blur-sm border shadow-lg hover:bg-background/90 transition-colors"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          // Mobile: show/hide with transform, Desktop: always visible
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0 z-40" : "-translate-x-full lg:translate-x-0 z-40",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center")}>
                <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
                {!isCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold text-sidebar-foreground">GoPLNR.com</h1>
                    <div className="flex items-center space-x-1">
                      <Crown className="h-3 w-3 text-primary" />
                      <span className="text-xs text-primary font-medium">Pro Plan</span>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin scrollbar-thumb-sidebar-accent/40 scrollbar-track-sidebar-border">
            {navigation.map((item) => (
              item.comingSoon ? (
                <div key={item.name} className="flex flex-col items-start w-full">
                  <span className="text-xs text-gray-500 mb-1 bg-gray-200 rounded px-2 py-0.5">Coming soon</span>
                  <span className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed select-none w-full">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="flex-1">{item.name}</span>}
                  </span>
                </div>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    item.current
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center",
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      <div className="flex items-center gap-1">
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </a>
              )
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
            {bottomNavigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.current
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center",
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </a>
            ))}

            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50",
                isCollapsed && "justify-center px-3",
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3">Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}