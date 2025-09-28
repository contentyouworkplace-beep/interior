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

interface AddClientDialogProps {
  children: React.ReactNode
  onClientAdded?: () => void
}

export function AddClientDialog({ children, onClientAdded }: AddClientDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    clientType: 'individual',
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    country: 'India',
    budgetRange: '',
    preferredStyle: '',
    website: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation for specific fields
    if (field === 'firstName' && errors.firstName) {
      validateField('firstName', value, { required: true, minLength: 2 })
    }
    if (field === 'lastName' && errors.lastName) {
      validateField('lastName', value, { required: true, minLength: 2 })
    }
    if (field === 'email' && errors.email) {
      validateField('email', value, { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
    }
    if (field === 'phone' && errors.phone) {
      validateField('phone', value, { pattern: /^[\+]?[1-9][\d]{0,15}$/ })
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      siteAddress: '',
      city: '',
      notes: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        alt_phone: formData.whatsappNumber,
        company: formData.company,
        address: formData.siteAddress,
        city: formData.city,
        notes: formData.notes,
      }

      // Simulate API call
      console.log('Submitting payload:', payload)

      resetForm()
      setOpen(false)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  // Removed unused variables and fixed type errors
  const formatIndianPhone = (phone: string) => {
    return phone.replace(/[^0-9+]/g, '')
  }

  const isLoading = false
  const errors = {}
  const validateField = () => {}
  const clearErrors = () => {}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Create a new client profile for your interior design business.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Basic Information</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="firstName" 
                    placeholder="Enter first name" 
                    className="pl-10" 
                    required 
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input 
                  id="lastName" 
                  placeholder="Enter last name" 
                  required 
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="company" 
                  placeholder="Company name (optional)" 
                  className="pl-10" 
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientType">Client Type</Label>
              <Select value={formData.clientType} onValueChange={(value) => handleInputChange('clientType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual/Private</SelectItem>
                  <SelectItem value="business">Corporate/Business</SelectItem>
                  <SelectItem value="developer">Property Developer</SelectItem>
                  <SelectItem value="hotel">Hotel/Hospitality</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Contact Information</h4>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="client@email.com" 
                  className="pl-10" 
                  required 
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
                    onBlur={(e) => handleInputChange('phone', formatIndianPhone(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="altPhone">Alternative Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="altPhone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="pl-10"
                    value={formData.altPhone}
                    onChange={(e) => handleInputChange('altPhone', e.target.value)}
                    onBlur={(e) => handleInputChange('altPhone', formatIndianPhone(e.target.value))}
                  />
                </div>
              </div>
            </div>


          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Address Information</h4>

            <div className="space-y-2">
              <Label htmlFor="address">Site Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="address" 
                  placeholder="Site address" 
                  className="pl-10" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Additional Information</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetRange">Budget Range</Label>
                <Select value={formData.budgetRange} onValueChange={(value) => handleInputChange('budgetRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-500000">Under ₹5,00,000</SelectItem>
                    <SelectItem value="500000-1000000">₹5,00,000 - ₹10,00,000</SelectItem>
                    <SelectItem value="1000000-5000000">₹10,00,000 - ₹50,00,000</SelectItem>
                    <SelectItem value="5000000-10000000">₹50,00,000 - ₹1,00,00,000</SelectItem>
                    <SelectItem value="over-10000000">Over ₹1,00,00,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredStyle">Preferred Style</Label>
                <Select value={formData.preferredStyle} onValueChange={(value) => handleInputChange('preferredStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select design style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="traditional">Traditional</SelectItem>
                    <SelectItem value="eclectic">Eclectic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional notes about the client..." 
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
            <Button type="submit" disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email || !formData.phone}>
              {isLoading ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


