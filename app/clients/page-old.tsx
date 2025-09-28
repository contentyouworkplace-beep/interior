"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Plus } from "lucide-react"
import { AddClientDialog } from "@/components/add-client-dialog"

export default function LegacyClientsPage() {
  return (
    <DashboardLayout
      title="Legacy Clients Page"
      subtitle="This view has been deprecated. Use the updated Clients page."
      currentPath="/clients"
    >
      <Card className="border-border/50">
        <CardContent className="p-12 text-center space-y-4">
          <User className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Legacy Clients Page Removed</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The previous implementation was removed during the INR & GST localization refactor. All client management
            features now live in the main Clients page.
          </p>
          <AddClientDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </AddClientDialog>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
