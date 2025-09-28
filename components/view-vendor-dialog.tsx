"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, User, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface ViewVendorDialogProps {
  vendor: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewVendorDialog({ vendor, open, onOpenChange }: ViewVendorDialogProps) {
  if (!vendor) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Vendor Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this vendor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
              {vendor.name?.charAt(0)}{vendor.contact_person?.charAt(0) || vendor.name?.charAt(1)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{vendor.name}</h2>
            {vendor.category && (
              <Badge className="mt-1">{vendor.category}</Badge>
            )}
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="h-4 w-4" /> Contact Person
                </Label>
                <p className="font-medium">{vendor.contact_person || 'Not specified'}</p>
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Phone className="h-4 w-4" /> Phone
                </Label>
                <p className="font-medium">{vendor.phone || 'Not specified'}</p>
              </div>
              
              {vendor.whatsapp_number && (
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" /> WhatsApp
                  </Label>
                  <p className="font-medium">{vendor.whatsapp_number}</p>
                </div>
              )}
              
              <div>
                <Label className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <p className="font-medium">{vendor.email || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" /> Address
                </Label>
                <p className="font-medium">
                  {vendor.address || 'Not specified'}
                  {(vendor.city || vendor.state) && (
                    <>
                      <br />
                      {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                    </>
                  )}
                </p>
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" /> Added
                </Label>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(vendor.created_at), { addSuffix: true })}
                </p>
              </div>
              
              {vendor.status && (
                <div>
                  <Label className="flex items-center gap-2 text-muted-foreground mb-1">
                    Status
                  </Label>
                  <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                    {vendor.status}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {vendor.notes && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <Label className="text-muted-foreground mb-1">Notes</Label>
              <p className="whitespace-pre-wrap">{vendor.notes}</p>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end mt-6">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}