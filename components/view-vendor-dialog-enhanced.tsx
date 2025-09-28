"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, User, Mail, Phone, MapPin, Calendar, LinkIcon, ClipboardCheck, MessageSquare, Clock, ExternalLink } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Separator } from "@/components/ui/separator"
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

interface ViewVendorDialogEnhancedProps {
  vendor: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewVendorDialogEnhanced({ vendor, open, onOpenChange }: ViewVendorDialogEnhancedProps) {
  if (!vendor) return null
  
  // Get formatted date for better display
  const formattedDate = format(new Date(vendor.created_at), 'PPP')
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        {/* Header with banner style */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 pb-8 rounded-t-lg">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-primary" /> Vendor Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this vendor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
              <AvatarFallback className="bg-primary/15 text-primary text-2xl font-semibold">
                {vendor.name?.charAt(0)}{vendor.contact_person?.charAt(0) || vendor.name?.charAt(1)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{vendor.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {vendor.category && (
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                    {vendor.category}
                  </Badge>
                )}
                {vendor.status && (
                  <Badge className={`${getStatusColor(vendor.status)} border`}>
                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="p-6 pt-0">
          <TabsList className="mt-[-20px] bg-background shadow-sm border w-fit mx-6">
            <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
            <TabsTrigger value="notes" className="text-sm">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="pt-6">
            {/* Main content grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card className="overflow-hidden border-0 shadow-md">
                <CardHeader className="bg-blue-50/50 py-3">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-1">
                    <User className="h-4 w-4" /> Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-sm">
                  {vendor.contact_person && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{vendor.contact_person}</p>
                      </div>
                    </div>
                  )}
                  
                  {vendor.phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Phone</p>
                        <p className="font-medium">{vendor.phone}</p>
                        {vendor.whatsapp_number && vendor.whatsapp_number !== vendor.phone && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            WhatsApp: {vendor.whatsapp_number}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {vendor.email && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Email</p>
                        <a href={`mailto:${vendor.email}`} className="font-medium text-primary hover:underline flex items-center gap-1">
                          {vendor.email}
                          <ExternalLink className="h-3 w-3 opacity-70" />
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Location & Details */}
              <Card className="overflow-hidden border-0 shadow-md">
                <CardHeader className="bg-purple-50/50 py-3">
                  <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Location & Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-sm">
                  {(vendor.address || vendor.city || vendor.state) && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Address</p>
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
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Added on</p>
                      <p className="font-medium">{formattedDate}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
                    </div>
                  </div>
                  
                  {vendor.category && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <LinkIcon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Category</p>
                        <p className="font-medium">{vendor.category}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="pt-6 space-y-4">
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-amber-50/50 py-3">
                <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {vendor.notes ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">{vendor.notes}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No notes have been added for this vendor.
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-green-50/50 py-3">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-1">
                  <ClipboardCheck className="h-4 w-4" /> Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground italic">
                  No projects associated with this vendor yet.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end p-4 pt-0 border-t mt-2">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}