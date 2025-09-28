"use client"

import React, { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Vendor {
  id: string
  user_id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  gstin: string | null
  category: string | null
  rating: number | null
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface EditVendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: Vendor | null
  onVendorUpdated: () => void
}

export function EditVendorDialog({
  open,
  onOpenChange,
  vendor,
  onVendorUpdated
}: EditVendorDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    category: "",
    gstin: "",
    rating: "",
    status: "active",
    notes: ""
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Populate form when vendor changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        contact_person: vendor.contact_person || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        address: vendor.address || "",
        category: vendor.category || "",
        gstin: vendor.gstin || "",
        rating: vendor.rating?.toString() || "",
        status: vendor.status || "active",
        notes: vendor.notes || ""
      })
    }
  }, [vendor])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!vendor) return

    if (!formData.name.trim() || !formData.category.trim()) {
      toast({
        title: "Validation Error",
        description: "Vendor name and category are required.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const updateData = {
        id: vendor.id,
        ...formData,
        rating: formData.rating ? parseFloat(formData.rating) : null
      }

      const response = await fetch('/api/vendors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update vendor')
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: "Vendor updated successfully.",
      })

      onVendorUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update vendor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      category: "",
      gstin: "",
      rating: "",
      status: "active",
      notes: ""
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  if (!vendor) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>
            Update vendor information and details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter vendor name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                placeholder="e.g., Interior Design, Furniture"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange("contact_person", e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter full address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => handleInputChange("gstin", e.target.value)}
                placeholder="Enter GSTIN"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => handleInputChange("rating", e.target.value)}
                placeholder="e.g., 4.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}