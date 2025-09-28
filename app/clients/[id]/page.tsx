"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { DeleteClientDialog } from "@/components/delete-client-dialog"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  LineChart,
  Clock,
  IndianRupee,
  Palette,
} from "lucide-react"

import type { Database } from "@/types/supabase"

type Client = Database["public"]["Tables"]["clients"]["Row"]

interface QuotationSummary {
  total: number
  accepted: number
  pending: number
  rejected: number
}

interface InvoiceSummary {
  total: number
  paid: number
  pending: number
  overdue: number
}

interface ProjectSummary {
  total: number
  active: number
  completed: number
  onHold: number
}

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [quotations, setQuotations] = useState<QuotationSummary>({ total: 0, accepted: 0, pending: 0, rejected: 0 })
  const [invoices, setInvoices] = useState<InvoiceSummary>({ total: 0, paid: 0, pending: 0, overdue: 0 })
  const [projects, setProjects] = useState<ProjectSummary>({ total: 0, active: 0, completed: 0, onHold: 0 })
  
  useEffect(() => {
    fetchClientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchClientData = async () => {
    const supabase = createClient()

    try {
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .single()

      if (clientError) throw clientError
      if (!clientData) return notFound()

      setClient(clientData)

      // Fetch quotations summary
      const { data: quotationsData } = await supabase
        .from("quotations")
        .select("status")
        .eq("client_id", params.id)

      if (quotationsData) {
        const summary = quotationsData.reduce((acc, curr) => {
          acc.total++
          if (curr.status === "accepted") acc.accepted++
          else if (curr.status === "pending") acc.pending++
          else if (curr.status === "rejected") acc.rejected++
          return acc
        }, { total: 0, accepted: 0, pending: 0, rejected: 0 } as QuotationSummary)
        setQuotations(summary)
      }

      // Fetch invoices summary
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("status")
        .eq("client_id", params.id)

      if (invoicesData) {
        const summary = invoicesData.reduce((acc, curr) => {
          acc.total++
          if (curr.status === "paid") acc.paid++
          else if (curr.status === "pending") acc.pending++
          else if (curr.status === "overdue") acc.overdue++
          return acc
        }, { total: 0, paid: 0, pending: 0, overdue: 0 } as InvoiceSummary)
        setInvoices(summary)
      }

      // Fetch projects summary
      const { data: projectsData } = await supabase
        .from("projects")
        .select("status")
        .eq("client_id", params.id)

      if (projectsData) {
        const summary = projectsData.reduce((acc, curr) => {
          acc.total++
          if (curr.status === "active") acc.active++
          else if (curr.status === "completed") acc.completed++
          else if (curr.status === "on-hold") acc.onHold++
          return acc
        }, { total: 0, active: 0, completed: 0, onHold: 0 } as ProjectSummary)
        setProjects(summary)
      }

    } catch (error) {
      console.error('Error fetching client data:', error)
      toast({
        title: "Error",
        description: "Failed to load client details.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClientDeleted = () => {
    toast({
      title: "Success",
      description: "Client deleted successfully.",
    })
    router.push("/clients")
  }

  if (loading) {
    return (
      <DashboardLayout title="Client Profile" showBackButton>
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return notFound()
  }

  return (
    <DashboardLayout
      title={`${client.first_name} ${client.last_name}`}
      currentPath={`/clients/${params.id}`}
      showBackButton
      actions={
        <div className="flex items-center gap-2">
          <EditClientDialog client={client} onClientUpdated={fetchClientData}>
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </EditClientDialog>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-600"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Client
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Client Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {client.first_name} {client.last_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize">{client.client_type}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        client.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : client.status === "inactive"
                          ? "bg-muted text-foreground"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }
                    >
                      {client.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a href={`mailto:${client.email}`} className="text-foreground hover:underline">
                        {client.email}
                      </a>
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`tel:${client.phone}`} className="text-foreground hover:underline">
                          {client.phone}
                        </a>
                      </div>
                    )}
                    {client.alt_phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`tel:${client.alt_phone}`} className="text-foreground hover:underline">
                          {client.alt_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {client.company && (
                      <div className="flex items-center text-sm">
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-foreground">{client.company}</span>
                      </div>
                    )}
                    {client.city && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-foreground">{client.city}</span>
                      </div>
                    )}
                    {client.budget_range && (
                      <div className="flex items-center text-sm">
                        <IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-foreground">{client.budget_range}</span>
                      </div>
                    )}
                    {client.preferred_style && (
                      <div className="flex items-center text-sm">
                        <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-foreground capitalize">{client.preferred_style}</span>
                      </div>
                    )}
                  </div>
                </div>

                {client.notes && (
                  <div>
                    <Separator className="my-4" />
                    <div className="text-sm text-muted-foreground">{client.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Quotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold">{quotations.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-600">{quotations.accepted}</div>
                  <div className="text-xs text-muted-foreground">Accepted</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-yellow-600">{quotations.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-red-600">{quotations.rejected}</div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <LineChart className="h-4 w-4 text-muted-foreground" />
                Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold">{invoices.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-600">{invoices.paid}</div>
                  <div className="text-xs text-muted-foreground">Paid</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-yellow-600">{invoices.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-red-600">{invoices.overdue}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold">{projects.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-600">{projects.active}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-green-600">{projects.completed}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-yellow-600">{projects.onHold}</div>
                  <div className="text-xs text-muted-foreground">On Hold</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteClientDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          onDeleted={handleClientDeleted}
        />
      </div>
    </DashboardLayout>
  )
}