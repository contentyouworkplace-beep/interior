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
import { AddVendorDialogOld } from "@/components/add-vendor-dialog-old"
import { useToast } from "@/hooks/use-toast"

interface Vendor {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  category: string | null
  status: string | null
  created_at: string
}

// Static vendor data for emergency use when database connection fails
const DEMO_VENDORS = [
  {
    id: "b6a1b150-d2a2-4b9c-9bc5-73d94b4dcfc1",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Creative Carpenters",
    contact_person: "Anil Kumar",
    category: "Carpenter",
    email: "anil@creativecarpenters.com",
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
    address: "12 Wood Lane",
    city: "Mumbai",
    notes: "Specializes in custom furniture.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "e5c21b90-f768-4f6e-8b2a-9a8f639c4e87",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Bright Sparks Electric",
    contact_person: "Sunita Sharma",
    category: "Electrician",
    email: "sunita@brightsparks.com",
    phone: "+919876543211",
    whatsapp_number: "+919876543211",
    address: "45 Power Grid Road",
    city: "Delhi",
    notes: "All types of residential and commercial wiring.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "d3e45f78-c12a-4b67-9d35-8a7e6b432f10",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Perfect Plumbers",
    contact_person: "Rajesh Singh",
    category: "Plumber",
    email: "rajesh@perfectplumbers.in",
    phone: "+919876543212",
    whatsapp_number: "+919876543212",
    address: "78 Water Works",
    city: "Bangalore",
    notes: "24/7 emergency plumbing services.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "f9a2d3e4-b5c6-4d7e-8f9a-0b1c2d3e4f5a",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Royal Coatings",
    contact_person: "Priya Patel",
    category: "Painter",
    email: "priya@royalcoatings.co",
    phone: "+919876543213",
    whatsapp_number: "+919876543213",
    address: "101 Color Street",
    city: "Chennai",
    notes: "Interior and exterior painting experts.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  },
  {
    id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
    name: "Modern Flooring Co.",
    contact_person: "Vikram Reddy",
    category: "Flooring",
    email: "vikram@modernflooring.com",
    phone: "+919876543214",
    whatsapp_number: "+919876543214",
    address: "23 Tile Avenue",
    city: "Pune",
    notes: "Provides marble, wood, and tile flooring options.",
    created_at: "2025-09-16T10:00:00.000Z",
    updated_at: "2025-09-16T10:00:00.000Z"
  }
];

export default function VendorsDemo() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("vendors")
  const [addVendorOpen, setAddVendorOpen] = useState(false)

  useEffect(() => {
    // Using static data directly
    setVendors(DEMO_VENDORS as Vendor[]);
    setLoading(false);
    
    // Show notification that we're in demo mode
    toast({
      title: "Demo Mode Activated",
      description: "Using static vendor data due to database issues",
      variant: "destructive",
    });
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      vendor.name?.toLowerCase().includes(searchLower) ||
      vendor.contact_person?.toLowerCase().includes(searchLower) ||
      vendor.email?.toLowerCase().includes(searchLower) ||
      vendor.category?.toLowerCase().includes(searchLower)
    )
  })

  const uniqueCategories = [...new Set(vendors.map((vendor) => vendor.category))].filter(Boolean)

  const vendorsByCategory: Record<string, Vendor[]> = {}
  uniqueCategories.forEach((category) => {
    if (category) {
      vendorsByCategory[category] = vendors.filter((v) => v.category === category)
    }
  })

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <div className="flex space-x-2">
            <Button onClick={() => setAddVendorOpen(true)} className="gap-2">
              <Plus size={16} /> Add Vendor
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="vendors" className="gap-2">
                <Users size={16} /> Vendors
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <Building2 size={16} /> Categories
              </TabsTrigger>
            </TabsList>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={18} />
              <Input
                placeholder="Search vendors..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <TabsContent value="vendors" className="space-y-4">
            {loading ? (
              <div className="text-center py-10">
                <p className="text-lg text-gray-500 dark:text-gray-400">Loading vendors...</p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-xl font-medium">No vendors found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {searchQuery ? "Try a different search term" : "Add your first vendor to get started"}
                </p>
                <Button onClick={() => setAddVendorOpen(true)} variant="outline" className="mt-4 gap-2">
                  <Plus size={16} /> Add First Vendor
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map((vendor) => (
                  <Card key={vendor.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {vendor.name?.charAt(0) || "V"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{vendor.name}</CardTitle>
                            {vendor.category && (
                              <Badge variant="secondary" className="mt-1">
                                {vendor.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {vendor.contact_person && (
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-gray-500" />
                            <span>{vendor.contact_person}</span>
                          </div>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-500" />
                            <span>{vendor.phone}</span>
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-500" />
                            <span>{vendor.email}</span>
                          </div>
                        )}
                        {vendor.address && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-500" />
                            <span>{vendor.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between mt-4 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            alert('Demo mode - View vendor details not available')
                          }}
                        >
                          <Eye size={14} /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            alert('Demo mode - Edit vendor not available')
                          }}
                        >
                          <Edit size={14} /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => {
                            alert('Demo mode - Delete vendor not available')
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueCategories.map((category) => (
                <Card key={category} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 size={18} />
                        {category}
                      </CardTitle>
                      <Badge variant="outline">{vendorsByCategory[category!]?.length || 0} vendors</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {vendorsByCategory[category!]?.slice(0, 3).map((vendor, idx) => (
                          <Avatar key={idx} className="border-2 border-background">
                            <AvatarFallback className="bg-primary/10">
                              {vendor.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {vendorsByCategory[category!]?.length > 3 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted border-2 border-background text-xs font-medium">
                            +{vendorsByCategory[category!].length - 3}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => {
                          setActiveTab("vendors")
                          setSearchQuery(category || "")
                        }}
                      >
                        View Vendors
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddVendorDialogOld 
        open={addVendorOpen} 
        onOpenChange={setAddVendorOpen} 
        onSuccess={() => {
          toast({
            title: "Demo Mode",
            description: "New vendor would be added here (demo only)",
            variant: "default",
          })
        }}
      />
    </DashboardLayout>
  )
}

// Missing components
const Phone = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const Mail = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const MapPin = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);