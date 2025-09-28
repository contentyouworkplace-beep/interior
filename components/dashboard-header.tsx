"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, ArrowLeft } from "lucide-react"
import { AddProjectDialog } from "./add-project-dialog"
import { useRouter } from "next/navigation"
import { useCompanyLogo } from "@/hooks/useCompanyLogo"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  actions?: React.ReactNode
}

export function DashboardHeader({ 
  title, 
  subtitle, 
  showBackButton = false,
  actions 
}: DashboardHeaderProps) {
  const router = useRouter()
  const { logoUrl } = useCompanyLogo()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Searching for:", searchQuery)
    // Implement global search functionality
    setSearchOpen(false)
  }

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-30">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center space-x-3 sm:space-x-4 ml-14 lg:ml-0">
          {showBackButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-4">
          {actions && <div className="flex items-center space-x-1 sm:space-x-2">{actions}</div>}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Search...</span>
                <Search className="h-4 w-4 md:hidden" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Search CRM</DialogTitle>
                <DialogDescription>Search for clients, projects, quotations, or team members</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSearch} className="space-y-4">
                <Input
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setSearchOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Search</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <AddProjectDialog>
            <Button size="sm" className="hidden sm:inline-flex">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">New Project</span>
              <span className="md:hidden">New</span>
            </Button>
          </AddProjectDialog>

          {/* Company Logo */}
          {logoUrl && (
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-gray-200 bg-white overflow-hidden">
              <img 
                src={logoUrl} 
                alt="Company Logo" 
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
