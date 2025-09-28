"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Building2, Mail, Phone, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

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

interface EditVendorDialogProps {
  vendor: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  availableCategories?: string[] // Add this prop for dynamic categories
}

export function EditVendorDialog({ vendor, open, onOpenChange, onSuccess, availableCategories = [] }: EditVendorDialogProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    vendorName: '',
    contactPerson: '',
    category: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    city: '',
    notes: '',
    status: ''
  })

  // Initialize form with vendor data when opened
  useEffect(() => {
    if (vendor && open) {
      console.log('Initializing form with vendor data:', vendor)
      
      // Map category from database value to form value
      let categoryValue = 'carpenter' // default
      if (vendor.category) {
        const normalizedCategory = vendor.category.toLowerCase()
        
        // Check if the category matches available categories first
        if (availableCategories.length > 0) {
          const matchingCategory = availableCategories.find(cat => 
            cat.toLowerCase() === normalizedCategory
          )
          if (matchingCategory) {
            categoryValue = matchingCategory.toLowerCase()
          } else {
            // If not found in available categories, use the original value
            categoryValue = normalizedCategory
          }
        } else {
          // Fallback to original validation logic if no available categories
          const validCategories = ['carpenter', 'electrician', 'plumber', 'painter', 'flooring', 'supplier', 'other']
          if (validCategories.includes(normalizedCategory)) {
            categoryValue = normalizedCategory
          } else {
            // Map common variations
            switch (normalizedCategory) {
              case 'material supplier':
              case 'materials':
                categoryValue = 'supplier'
                break
              default:
                categoryValue = 'other'
            }
          }
        }
      }
      
      setFormData({
        vendorName: vendor.name || '',
        contactPerson: vendor.contact_person || '',
        category: categoryValue,
        email: vendor.email || '',
        phone: vendor.phone || '',
        whatsappNumber: vendor.whatsapp_number || '',
        address: vendor.address || '',
        city: vendor.city || '',
        notes: vendor.notes || '',
        status: 'active' // Default since status column doesn't exist in table
      })
      
      console.log('Form initialized with category:', categoryValue)
    }
  }, [vendor, open])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateForm = () => {
    if (!formData.vendorName.trim()) {
      setError("Vendor name is required")
      return false
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("Updating vendor data:", formData)
      
      // Track the attempts for better error reporting
      let supabaseErrorMessage: string | null = null;
      let fallbackErrorMessage: string | null = null;
      
      // Try direct Supabase update first
      try {
        const { data, error: supabaseError } = await supabase
          .from('vendors')
          .update({
            name: formData.vendorName,
            contact_person: formData.contactPerson,
            category: formData.category,
            email: formData.email,
            phone: formData.phone,
            whatsapp_number: formData.whatsappNumber,
            address: formData.address,
            city: formData.city,
            notes: formData.notes
            // Removed status since it's not in the table schema
          })
          .eq('id', vendor.id)
          .select()
        
        if (supabaseError) {
          supabaseErrorMessage = supabaseError.message;
          throw supabaseError;
        }
        
        console.log("Vendor updated successfully:", data)
        toast({
          title: "Vendor Updated",
          description: `${formData.vendorName} has been successfully updated.`,
        })

        onOpenChange(false)
        onSuccess?.()
        return; // Exit early on success
      } catch (dbError: any) {
        console.error("Database update failed:", dbError);
        supabaseErrorMessage = dbError.message || "Database connection failed";
        
        // Continue to fallback API
      }
      
      // If database update fails, try using the API endpoint
      try {
        console.log("Trying API endpoint for vendor update")
        const response = await fetch(`/api/vendors`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: vendor.id,
            name: formData.vendorName,
            contact_person: formData.contactPerson,
            category: formData.category,
            email: formData.email,
            phone: formData.phone,
            whatsapp_number: formData.whatsappNumber,
            address: formData.address,
            city: formData.city,
            notes: formData.notes
            // Removed status since it's not in the table schema
          }),
        })

        if (!response.ok) {
          const errorData = await response.json();
          fallbackErrorMessage = errorData.message || 'API failed';
          throw new Error(fallbackErrorMessage || 'API failed');
        }

        // API was successful
        toast({
          title: "Vendor Updated",
          description: `${formData.vendorName} has been updated successfully.`,
        })

        onOpenChange(false)
        onSuccess?.()
        return; // Exit early on success
      } catch (fallbackError: any) {
        console.error("API update failed:", fallbackError);
        fallbackErrorMessage = fallbackError.message || "API connection failed";
        
        // Both methods failed, throw a combined error
        throw new Error(`Failed to update vendor: Primary and API methods both failed`);
      }
    } catch (error: any) {
      console.error("Error updating vendor:", error)
      setError(error.message || "An unexpected error occurred")
      toast({
        title: "Error Updating Vendor",
        description: error.message || "Failed to update vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Edit Vendor
          </DialogTitle>
          <DialogDescription>
            Update the information for {vendor?.name}.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Basic Information</h4>

            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor/Company Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="vendorName" 
                  placeholder="Enter vendor or company name" 
                  className="pl-10"
                  value={formData.vendorName}
                  onChange={(e) => handleInputChange('vendorName', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="contactPerson" 
                  placeholder="Contact person's name (optional)" 
                  className="pl-10"
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Vendor Category *</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {/* Show available categories from the categories tab */}
                  {availableCategories.length > 0 ? (
                    (() => {
                      // Debug: log the available categories
                      console.log('Available categories received:', availableCategories)
                      
                      // Remove duplicates and sort categories
                      const uniqueCategories = Array.from(new Set(availableCategories.map(cat => cat.toLowerCase())))
                        .sort()
                      
                      console.log('Unique categories after deduplication:', uniqueCategories)
                      
                      return uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {/* Capitalize first letter for display */}
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))
                    })()
                  ) : (
                    // Fallback to default categories if none are available
                    <>
                      <SelectItem value="carpenter">Carpenter</SelectItem>
                      <SelectItem value="electrician">Electrician</SelectItem>
                      <SelectItem value="plumber">Plumber</SelectItem>
                      <SelectItem value="painter">Painter</SelectItem>
                      <SelectItem value="flooring">Flooring</SelectItem>
                      <SelectItem value="supplier">Material Supplier</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Contact Information</h4>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="vendor@example.com" 
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Address Information</h4>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="address" 
                  placeholder="Vendor address" 
                  className="pl-10"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Additional Information</h4>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional notes about the vendor..." 
                rows={3} 
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}