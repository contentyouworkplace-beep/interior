"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import type { Database } from "@/types/supabase"
import { updateClient } from '@/lib/services/supabase/clients'
import { useToast } from "@/hooks/use-toast"

type Client = Database["public"]["Tables"]["clients"]["Row"]

interface EditClientDialogProps {
  children?: React.ReactNode
  client: Client
  onClientUpdated?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditClientDialog({ children, client, onClientUpdated, open, onOpenChange }: EditClientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Use controlled or uncontrolled state
  const isOpen = open !== undefined ? open : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  // Form state
  const [formData, setFormData] = useState({
    firstName: client.first_name,
    lastName: client.last_name,
    company: client.company || '',
    email: client.email || '',
    phone: client.phone || '',
    whatsappNumber: client.alt_phone || '',
    siteAddress: client.address || '',
    city: client.city || '',
    notes: client.notes || ''
  })

  // Update form data when client prop changes
  useEffect(() => {
    setFormData({
      firstName: client.first_name,
      lastName: client.last_name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      whatsappNumber: client.alt_phone || '',
      siteAddress: client.address || '',
      city: client.city || '',
      notes: client.notes || ''
    })
  }, [client])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const clientUpdate: Database["public"]["Tables"]["clients"]["Update"] = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        company: formData.company?.trim() || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        alt_phone: formData.whatsappNumber?.trim() || null,
        address: formData.siteAddress?.trim() || null,
        city: formData.city?.trim() || null,
        notes: formData.notes?.trim() || null
      }

      const { error } = await updateClient(client.id, clientUpdate)

      if (error) {
        throw error
      }

      toast({
        title: "Success!",
        description: "Client has been updated successfully.",
      })

      setOpen(false)
      onClientUpdated?.()

    } catch (error) {
      console.error('Error updating client:', error)
      const message = (error as any)?.message || (error instanceof Error ? error.message : 'Failed to update client')
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>Update client information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName" 
                  placeholder="Enter first name" 
                  required 
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
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
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                placeholder="Company name (optional)" 
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Contact Information</h4>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="client@example.com" 
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  placeholder="+91 98765 43210" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input 
                  id="whatsappNumber" 
                  placeholder="+91 87654 32109" 
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Address Information</h4>

            <div className="space-y-2">
              <Label htmlFor="siteAddress">Site Address</Label>
              <Input 
                id="siteAddress" 
                placeholder="Site address" 
                value={formData.siteAddress}
                onChange={(e) => handleInputChange('siteAddress', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                placeholder="City" 
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input 
              id="notes" 
              placeholder="Any additional notes about the client" 
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.firstName || !formData.lastName}>
              {isLoading ? "Updating..." : "Update Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}