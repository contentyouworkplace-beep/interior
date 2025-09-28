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
import { User, Building2, Mail, Phone, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClientRow } from "@/lib/services/supabase/clients"

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
    email: '',
    phone: '',
    whatsappNumber: '',
    siteAddress: '',
    city: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation for specific fields
    if (field === 'firstName') {
      if (value.length < 2) {
        toast({
          title: "Validation Error",
          description: "First name must be at least 2 characters long.",
          variant: "destructive",
        })
      }
    }
    if (field === 'lastName') {
      if (value.length < 2) {
        toast({
          title: "Validation Error",
          description: "Last name must be at least 2 characters long.",
          variant: "destructive",
        })
      }
    }
    if (field === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(value)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address.",
          variant: "destructive",
        })
      }
    }
    if (field === 'phone') {
      const phonePattern = /^[\+]?[1-9][\d]{0,15}$/
      if (!phonePattern.test(value)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid phone number.",
          variant: "destructive",
        })
      }
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      siteAddress: '',
      city: '',
      notes: ''
    })
  }

  // Update handleSubmit to integrate with Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (formData.firstName.length < 2 || formData.lastName.length < 2) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      })
      return
    }

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

      const result = await createClientRow(payload)

      if (result.error) {
        throw new Error(result.error.message)
      }

      toast({
        title: "Success!",
        description: "Client has been added successfully.",
      })

      resetForm()
      setOpen(false)
      onClientAdded?.()

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create client",
        variant: "destructive",
      })
    }
  }

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
                <Input id="firstName" placeholder="Enter first name" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Enter last name" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Company name (optional)" value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Contact Information</h4>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="client@example.com" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input id="whatsappNumber" placeholder="+91 87654 32109" value={formData.whatsappNumber} onChange={(e) => handleInputChange('whatsappNumber', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Address Information</h4>

            <div className="space-y-2">
              <Label htmlFor="siteAddress">Site Address</Label>
              <Input id="siteAddress" placeholder="Site address" value={formData.siteAddress} onChange={(e) => handleInputChange('siteAddress', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="City" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Client
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}