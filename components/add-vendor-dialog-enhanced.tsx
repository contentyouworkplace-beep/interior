"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Building2, Mail, Phone, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface AddVendorDialogProps {
  children: React.ReactNode
  onVendorAdded?: () => void
}

export function AddVendorDialogOld({ children, onVendorAdded }: AddVendorDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    vendorName: '',
    contactPerson: '',
    category: 'carpenter',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    city: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (error) setError(null)
  }

  const resetForm = () => {
    setFormData({
      vendorName: '',
      contactPerson: '',
      category: 'carpenter',
      email: '',
      phone: '',
      whatsappNumber: '',
      address: '',
      city: '',
      notes: ''
    })
    setError(null)
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
    setError(null)
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("Authentication error: You must be logged in to add a vendor")
        toast({
          title: "Authentication Error",
          description: "You must be logged in to add a vendor.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("Creating vendor with user ID:", user.id)

      const payload = {
        user_id: user.id,
        name: formData.vendorName,
        contact_person: formData.contactPerson,
        category: formData.category,
        email: formData.email,
        phone: formData.phone,
        whatsapp_number: formData.whatsappNumber,
        address: formData.address,
        city: formData.city,
        notes: formData.notes,
      }

      // Try using the fallback API if in emergency mode
      try {
        // First try direct database insertion
        const { data, error } = await supabase.from('vendors').insert([payload]).select()

        if (error) {
          console.error("Database insertion failed:", error)
          throw error
        }

        console.log("Vendor created successfully:", data)
        toast({
          title: "Vendor Created",
          description: `${formData.vendorName} has been successfully added.`,
        })

        resetForm()
        setOpen(false)
        onVendorAdded?.()
      } catch (dbError: any) {
        // If database insertion fails, try using the fallback API
        console.log("Trying fallback API for vendor creation")
        const response = await fetch('/api/vendors-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`Fallback API failed with status: ${response.status}`)
        }

        const result = await response.json()
        console.log("Vendor created using fallback API:", result)
        toast({
          title: "Vendor Created (Demo Mode)",
          description: `${formData.vendorName} has been added in demo mode.`,
          variant: "default",
        })

        resetForm()
        setOpen(false)
        onVendorAdded?.()
      }
    } catch (error: any) {
      console.error('Error submitting form:', error)
      setError(error.message || "An unexpected error occurred")
      toast({
        title: "Error Creating Vendor",
        description: error.message || "Failed to create vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Add New Vendor
          </DialogTitle>
          <DialogDescription>
            Add a new vendor to your database. Fill in as much information as possible.
          </DialogDescription>
        </DialogHeader>        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Show error message if any */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

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
                    required 
                    value={formData.vendorName}
                    onChange={(e) => handleInputChange('vendorName', e.target.value)}
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
              <Input
                id="category"
                placeholder="e.g., Carpenter, Electrician"
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
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
            <Button type="button" variant="outline" onClick={() => {
              resetForm()
              setOpen(false)
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}