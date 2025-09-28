"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Building2, Users, Folder, Eye, Edit, Trash2, Upload, Files } from "lucide-react"
import { AddVendorDialogOld } from "@/components/add-vendor-dialog-enhanced"
import { ViewVendorDialog } from "@/components/view-vendor-dialog"
import { ViewVendorDialogCompact } from "@/components/view-vendor-dialog-compact"
import { EditVendorDialog } from "@/components/edit-vendor-dialog-new"
import { UploadVendorFilesDialog } from "@/components/upload-vendor-files-dialog"
import { UploadVendorFilesDialogEnhanced } from "@/components/upload-vendor-files-dialog-enhanced"
import { ViewVendorFilesDialog } from "@/components/view-vendor-files-dialog"
import { ViewVendorFilesDialogEnhanced } from "@/components/view-vendor-files-dialog-enhanced"
import { DeleteVendorDialogEnhanced } from "@/components/delete-vendor-dialog-enhanced"
import { useToast } from "@/hooks/use-toast"

interface Vendor {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  city?: string | null
  state?: string | null
  whatsapp_number?: string | null
  category: string | null
  status: string | null
  notes?: string | null
  created_at: string
}

export default function VendorsPage() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("vendors")
  
  // Dialog states
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [viewFilesDialogOpen, setViewFilesDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const fetchVendors = async () => {
    setLoading(true)
    try {
      // Try primary API endpoint first
      const response = await fetch('/api/vendors')
      if (!response.ok) {
        // If primary fails, use fallback endpoint
        console.log("Primary vendor API failed, using fallback...")
        const fallbackResponse = await fetch('/api/vendors-fallback')
        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! status: ${fallbackResponse.status}`)
        }
        const fallbackResult = await fallbackResponse.json()
        if (fallbackResult.data) {
          setVendors(fallbackResult.data)
          toast({
            title: "Using Demo Mode",
            description: "Database connection issue - showing demo data",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
        throw new Error(fallbackResult.error || 'Fallback API also failed')
      }
      const result = await response.json()
      if (result.data) {
        setVendors(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch vendors')
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setVendors([])
      toast({
        title: "Error",
        description: "Failed to load vendors. Please run the SQL fix in Supabase first.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const filteredVendors = vendors.filter(vendor => {
    const searchLower = searchQuery.toLowerCase()
    return !searchQuery || 
      vendor.name.toLowerCase().includes(searchLower) ||
      vendor.contact_person?.toLowerCase().includes(searchLower) ||
      vendor.email?.toLowerCase().includes(searchLower)
  })

  // Get unique categories
  const categories = [...new Set(vendors.map(vendor => vendor.category).filter(Boolean))]

  return (
    <DashboardLayout title="Vendors" currentPath="/vendors">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-80 grid-cols-2">
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Categories
            </TabsTrigger>
          </TabsList>
          
          <AddVendorDialogOld onVendorAdded={fetchVendors}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Vendor
            </Button>
          </AddVendorDialogOld>
        </div>

        <TabsContent value="vendors" className="space-y-6">
          <div className="space-y-4">
            <div className="relative md:w-72">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredVendors.length} of {vendors.length} vendors
            </div>

            {loading ? (
              <div className="text-center py-8">Loading vendors...</div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {vendors.length === 0 ? (
                  <>
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No vendors found.</p>
                    <p className="text-sm mt-2">
                      Please run the SQL fix script in Supabase first, then add your first vendor.
                    </p>
                    <AddVendorDialogOld onVendorAdded={fetchVendors}>
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Vendor
                      </Button>
                    </AddVendorDialogOld>
                  </>
                ) : (
                  <p>No vendors match your search criteria.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map((vendor) => (
                  <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {vendor.name?.charAt(0)}{vendor.contact_person?.charAt(0) || vendor.name?.charAt(1)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {vendor.name}
                          </h3>
                          {vendor.status && (
                            <Badge variant="outline" className="mt-1">
                              {vendor.status}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <div className="bg-gray-50 rounded-md p-0.5 flex items-center gap-0.5 shadow-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-primary rounded-md transition-colors"
                              onClick={() => {
                                setSelectedVendor(vendor)
                                setViewDialogOpen(true)
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-primary rounded-md transition-colors"
                              onClick={() => {
                                setSelectedVendor(vendor)
                                setEditDialogOpen(true)
                              }}
                              title="Edit vendor"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-blue-500 rounded-md transition-colors"
                              onClick={() => {
                                setSelectedVendor(vendor)
                                setUploadDialogOpen(true)
                              }}
                              title="Upload files"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100 hover:text-green-600 rounded-md transition-colors"
                              onClick={() => {
                                setSelectedVendor(vendor)
                                setViewFilesDialogOpen(true)
                              }}
                              title="View files"
                            >
                              <Files className="h-4 w-4 stroke-[1.5px]" />
                            </Button>
                            <div className="w-px h-6 bg-gray-200 mx-0.5"></div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                              onClick={() => {
                                setSelectedVendor(vendor)
                                setDeleteDialogOpen(true)
                              }}
                              title="Delete vendor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {vendor.contact_person && (
                          <p>Contact: {vendor.contact_person}</p>
                        )}
                        {vendor.email && (
                          <p>Email: {vendor.email}</p>
                        )}
                        {vendor.phone && (
                          <p>Phone: {vendor.phone}</p>
                        )}
                        {vendor.category && (
                          <Badge variant="secondary" className="text-xs">
                            {vendor.category}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        Added: {new Date(vendor.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing {categories.length} categories
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No categories found.</p>
                <p className="text-sm mt-2">
                  Categories will appear here once you add vendors with categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const categoryVendors = vendors.filter(vendor => vendor.category === category)
                  return (
                    <Card key={category} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Folder className="h-5 w-5 text-primary" />
                          {category}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {categoryVendors.length} vendor{categoryVendors.length !== 1 ? 's' : ''}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchQuery(category || '')
                              setActiveTab("vendors")
                            }}
                          >
                            View All
                          </Button>
                        </div>
                        
                        {categoryVendors.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {categoryVendors.slice(0, 3).map((vendor) => (
                              <div key={vendor.id} className="text-sm text-muted-foreground">
                                • {vendor.name}
                              </div>
                            ))}
                            {categoryVendors.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                ... and {categoryVendors.length - 3} more
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* View Vendor Dialog */}
      {selectedVendor && (
        <ViewVendorDialogCompact
          vendor={selectedVendor}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />
      )}
      
      {/* Edit Vendor Dialog */}
      {selectedVendor && (
        <EditVendorDialog
          vendor={selectedVendor}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchVendors}
          availableCategories={categories}
        />
      )}
      
      {/* Upload Files Dialog */}
      {selectedVendor && (
        <UploadVendorFilesDialogEnhanced
          vendorId={selectedVendor.id}
          vendorName={selectedVendor.name}
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onSuccess={fetchVendors}
        />
      )}
      
      {/* View Files Dialog */}
      {selectedVendor && (
        <ViewVendorFilesDialogEnhanced
          vendorId={selectedVendor.id}
          vendorName={selectedVendor.name}
          open={viewFilesDialogOpen}
          onOpenChange={setViewFilesDialogOpen}
        />
      )}
      
      {/* Delete Vendor Dialog */}
      {selectedVendor && (
        <DeleteVendorDialogEnhanced
          vendor={{
            id: selectedVendor.id,
            name: selectedVendor.name
          }}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={fetchVendors}
        />
      )}
    </DashboardLayout>
  )
}
