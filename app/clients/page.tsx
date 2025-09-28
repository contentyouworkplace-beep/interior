"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, 
         DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Phone, Mail, MapPin, User, FolderOpen, Edit, Trash2, Building2, 
         Eye, Upload, MessageCircle, FileText, UserPlus, Calendar, Download, Copy, Star, 
         Archive, PhoneCall, Video, Folder, History, Files, Pencil } from "lucide-react"
import { AddClientDialog } from "@/components/add-client-dialog"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { DeleteClientDialog } from "@/components/delete-client-dialog"
import { FileUploadDialog } from "@/components/file-upload-dialog"
import { ViewFilesDialog } from "@/components/view-files-dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/types/database" // adjust if actual path differs

// Local Client type interface
interface Client {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  alt_phone: string | null
  company: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  client_type: string | null
  budget_range: string | null
  preferred_style: string | null
  website: string | null
  notes: string | null
  status: string | null
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  inactive: "bg-muted text-foreground",
  potential: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
}

export default function ClientsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"name" | "newest">("newest")
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [fileUploadClient, setFileUploadClient] = useState<{ id: string; name: string } | null>(null)
  const [viewFilesClient, setViewFilesClient] = useState<{ id: string; name: string } | null>(null)

  const fetchClients = async () => {
    setLoading(true)
    
    try {
      // Fetch clients from our API endpoint which has debug monitoring
      const response = await fetch('/api/clients')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.clients) {
        setClients(result.clients)
      } else {
        throw new Error(result.error || 'Failed to fetch clients')
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      
      // Fallback to empty array or show error
      setClients([])
      
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return clients
      .filter(c => {
  const s = `${c.first_name} ${c.last_name} ${c.email} ${c.phone || ""} ${c.alt_phone || ""}`.toLowerCase()
        if (searchQuery && !s.includes(searchQuery.toLowerCase())) return false
        if (statusFilter && c.status !== statusFilter) return false
        if (typeFilter && c.client_type !== typeFilter) return false
        if (cityFilter && (c.city || "") !== cityFilter) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          const an = `${a.first_name} ${a.last_name}`.toLowerCase()
          const bn = `${b.first_name} ${b.last_name}`.toLowerCase()
          return an.localeCompare(bn)
        }
        // newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [clients, searchQuery, statusFilter, typeFilter, cityFilter, sortBy])

  const uniqueStatuses = useMemo(() => Array.from(new Set(clients.map(c => c.status).filter(Boolean))), [clients])
  const uniqueTypes = useMemo(() => Array.from(new Set(clients.map(c => c.client_type).filter(Boolean))), [clients])
  const uniqueCities = useMemo(() => Array.from(new Set(clients.map(c => c.city).filter(Boolean))), [clients])

  const clearFilters = () => {
    setStatusFilter(null)
    setTypeFilter(null)
    setCityFilter(null)
    setSortBy("newest")
  }

  const renderClientCard = (client: Client) => (
    <Card key={client.id} className="border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <a href={`/clients/${client.id}`} className="hover:underline">
                <h3 className="font-semibold text-foreground">
                  {client.first_name} {client.last_name}
                </h3>
              </a>
              <Badge variant="outline" className={STATUS_COLORS[client.status || ""] || undefined}>
                {client.status}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <a href={`mailto:${client.email || ''}`} className="truncate hover:underline" title={client.email || ''}>{client.email}</a>
            <div className="ml-2 flex items-center gap-2">
              <a href={`mailto:${client.email || ''}`} title="Email" className="hover:text-primary"><Mail className="h-4 w-4" /></a>
              <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => navigator.clipboard.writeText(client.email || '')} title="Copy email">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M8 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-2"/><rect width="13" height="13" x="3" y="8" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
            </div>
          </div>
          {client.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
              <a href={`tel:${client.phone}`} className="truncate hover:underline" title={client.phone}>{client.phone}</a>
              <div className="ml-2 flex items-center gap-2">
                <a href={`tel:${client.phone}`} title="Call" className="hover:text-primary"><Phone className="h-4 w-4" /></a>
                <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => navigator.clipboard.writeText(client.phone!)} title="Copy phone">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M8 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-2"/><rect width="13" height="13" x="3" y="8" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
              </div>
            </div>
          )}
          {client.alt_phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="mr-2 text-foreground">WhatsApp:</span>
              <a
                href={`https://wa.me/${(client.alt_phone || '').replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:underline"
                title={client.alt_phone}
              >
                {client.alt_phone}
              </a>
              <div className="ml-2 flex items-center gap-2">
                <a
                  href={`https://wa.me/${(client.alt_phone || '').replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp"
                  className="hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <button
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => navigator.clipboard.writeText(client.alt_phone!)}
                  title="Copy WhatsApp number"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M8 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-2"/><rect width="13" height="13" x="3" y="8" rx="2" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
              </div>
            </div>
          )}

          {client.city && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              {client.city}
            </div>
          )}
          {client.company && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{client.company}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => {
              router.push(`/clients/${client.id}`)
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setEditingClient(client)}
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setFileUploadClient({ id: client.id, name: `${client.first_name} ${client.last_name}` })}
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setClientToDelete({ id: client.id, name: `${client.first_name} ${client.last_name}` })}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>

        {/* Files View Toggle */}
        <div className="pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs text-muted-foreground mb-2"
            onClick={() => setViewFilesClient({ id: client.id, name: `${client.first_name} ${client.last_name}` })}
          >
            <Files className="h-3 w-3 mr-1" />
            View All Files
          </Button>
          
          <div className="text-xs text-muted-foreground mt-2">
            Joined: {new Date(client.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout title="Clients" currentPath="/clients">
      <div className="flex items-center gap-2 mb-4">
        <AddClientDialog onClientAdded={fetchClients}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Client
          </Button>
        </AddClientDialog>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative md:w-72">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs items-center">
            {/* Status filter */}
            {uniqueStatuses.map(st => (
              <Button key={st} variant={statusFilter === st ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(statusFilter === st ? null : st)}>{st}</Button>
            ))}
            {/* Type filter */}
            {uniqueTypes.map(tp => (
              <Button key={tp} variant={typeFilter === tp ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(typeFilter === tp ? null : tp)}>{tp}</Button>
            ))}
            {/* City filter (limit to first 5 for compactness) */}
            {uniqueCities.slice(0,5).map(ct => (
              <Button key={ct} variant={cityFilter === ct ? "default" : "outline"} size="sm" onClick={() => setCityFilter(cityFilter === ct ? null : ct)}>{ct || 'Unknown'}</Button>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={!statusFilter && !typeFilter && !cityFilter && sortBy === 'newest'}>Reset</Button>
            <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === 'newest' ? 'name' : 'newest')}>{sortBy === 'newest' ? 'Sort A-Z' : 'Sort Newest'}</Button>
          </div>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No clients found</h3>
              <p className="text-muted-foreground mb-4">{searchQuery || statusFilter || typeFilter || cityFilter ? 'Try adjusting your filters or search.' : 'Get started by adding your first client.'}</p>
              <AddClientDialog onClientAdded={fetchClients}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Client
                </Button>
              </AddClientDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(renderClientCard)}
          </div>
        )}
      </div>

      {/* File Upload Dialog */}
      {fileUploadClient && (
        <FileUploadDialog
          open={!!fileUploadClient}
          onOpenChange={(open) => !open && setFileUploadClient(null)}
          clientId={fileUploadClient.id}
          clientName={fileUploadClient.name}
          onFilesUploaded={fetchClients}
        />
      )}

      {/* View Files Dialog */}
      {viewFilesClient && (
        <ViewFilesDialog
          open={!!viewFilesClient}
          onOpenChange={(open) => !open && setViewFilesClient(null)}
          clientId={viewFilesClient.id}
          clientName={viewFilesClient.name}
        />
      )}

      {/* Edit Client Dialog */}
      {editingClient && (
        <EditClientDialog 
          client={editingClient} 
          onClientUpdated={fetchClients}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {clientToDelete && (
        <DeleteClientDialog
          open={!!clientToDelete}
          onOpenChange={(open) => !open && setClientToDelete(null)}
          clientId={clientToDelete.id}
          clientName={clientToDelete.name}
          onDeleted={fetchClients}
        />
      )}
    </DashboardLayout>
  )
}