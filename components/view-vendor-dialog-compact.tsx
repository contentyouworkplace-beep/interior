"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, User, Mail, Phone, MapPin, Calendar, LinkIcon, ClipboardCheck, MessageSquare, Clock } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export function ViewVendorDialogCompact({ vendor, open, onOpenChange }: ViewVendorDialogProps) {
  if (!vendor) return null
  
  // Get formatted date for better display
  const formattedDate = format(new Date(vendor.created_at), 'MMM d, yyyy')
  const timeAgo = formatDistanceToNow(new Date(vendor.created_at), { addSuffix: true })
  
  // Compute status color
  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"
    
    switch(status.toLowerCase()) {
      case 'active':
        return "bg-green-50 text-green-700 border-green-200"
      case 'inactive':
        return "bg-gray-50 text-gray-700 border-gray-200"
      case 'pending':
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-blue-50 text-blue-700 border-blue-200"
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Simplified header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-t-lg">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> {vendor.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
                {vendor.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              {vendor.category && (
                <Badge variant="outline" className="bg-background/80 text-xs mb-1">
                  {vendor.category}
                </Badge>
              )}
              {vendor.status && (
                <Badge className={`${getStatusColor(vendor.status)} border text-xs ml-1`}>
                  {vendor.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="px-3 pt-0 pb-2">
          <TabsList className="mt-[-12px] bg-background shadow-sm border w-fit mx-3 h-8">
            <TabsTrigger value="details" className="text-xs px-3">Details</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs px-3">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-4">
            <div className="grid grid-cols-1 gap-3">
              {/* Contact Information - Compact List */}
              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="bg-blue-50/50 py-2 px-3">
                  <CardTitle className="text-xs font-medium text-blue-700 flex items-center gap-1">
                    <User className="h-3 w-3" /> Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ul className="space-y-2 text-xs">
                    {vendor.contact_person && (
                      <li className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium truncate">{vendor.contact_person}</span>
                      </li>
                    )}
                    
                    {vendor.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium truncate">{vendor.phone}</span>
                      </li>
                    )}
                    
                    {vendor.whatsapp_number && vendor.whatsapp_number !== vendor.phone && (
                      <li className="flex items-center gap-2 pl-5">
                        <span className="text-muted-foreground">WhatsApp:</span>
                        <span className="font-medium truncate">{vendor.whatsapp_number}</span>
                      </li>
                    )}
                    
                    {vendor.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Email:</span>
                        <a 
                          href={`mailto:${vendor.email}`} 
                          className="font-medium text-primary hover:underline truncate"
                          title={vendor.email}
                        >
                          {vendor.email}
                        </a>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
              
              {/* Location Information - Compact List */}
              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="bg-purple-50/50 py-2 px-3">
                  <CardTitle className="text-xs font-medium text-purple-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location & Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <ul className="space-y-2 text-xs">
                    {(vendor.address || vendor.city || vendor.state) && (
                      <li className="flex gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Address:</span>
                          <div className="font-medium">
                            {vendor.address && <span className="block truncate">{vendor.address}</span>}
                            {(vendor.city || vendor.state) && (
                              <span className="block truncate">
                                {[vendor.city, vendor.state].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    )}
                    
                    <li className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Added:</span>
                      <span className="font-medium">{formattedDate}</span>
                      <span className="text-muted-foreground text-[10px]">({timeAgo})</span>
                    </li>
                    
                    {vendor.category && (
                      <li className="flex items-center gap-2">
                        <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium truncate">{vendor.category}</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="pt-4">
            <Card className="overflow-hidden shadow-sm">
              <CardHeader className="bg-amber-50/50 py-2 px-3">
                <CardTitle className="text-xs font-medium text-amber-700 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                {vendor.notes ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-xs">{vendor.notes}</p>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    No notes have been added for this vendor.
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-sm mt-3">
              <CardHeader className="bg-green-50/50 py-2 px-3">
                <CardTitle className="text-xs font-medium text-green-700 flex items-center gap-1">
                  <ClipboardCheck className="h-3 w-3" /> Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground italic">
                  No projects associated with this vendor yet.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end p-3 border-t">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}