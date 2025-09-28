"use client"

import type React from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Building2, Mail, Phone, MapPin, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface AddVendorDialogOldProps {
  children: React.ReactNode
  onVendorAdded?: () => void
}

export function AddVendorDialogOld({ children, onVendorAdded }: AddVendorDialogOldProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    vendorName: '',
    contactPerson: '',
    category: 'carpenter',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    website: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
        vendorName: '',
        contactPerson: '',
        category: 'carpenter',
        email: '',
        phone: '',
        altPhone: '',
        address: '',
        city: '',
        website: '',
        notes: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add a vendor.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const payload = {
        user_id: user.id,
        name: formData.vendorName,
        contact_person: formData.contactPerson,
        category: formData.category,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
      }

      const { error } = await supabase.from('vendors').insert([payload])

      if (error) {
        throw error
      }

      toast({
        title: "Vendor Created",
        description: `${formData.vendorName} has been successfully added.`,
      })

      resetForm()
      setOpen(false)
      onVendorAdded?.()
    } catch (error: any) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>Create a new vendor profile for your business.</DialogDescription>
        </DialogHeader>

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
              <Label htmlFor="category">Vendor Category</Label>
              <Input
                id="category"
                placeholder="e.g., Carpenter, Electrician"
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
                  placeholder="vendor@email.com" 
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
                <Label htmlFor="altPhone">WhatsApp Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="altPhone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10"
                    value={formData.altPhone}
                    onChange={(e) => handleInputChange('altPhone', e.target.value)}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.vendorName || !formData.phone}>
              {isLoading ? "Creating..." : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
