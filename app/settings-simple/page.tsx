"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ProfileSection } from "@/components/profile-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SimpleSettingsPage() {
  const router = useRouter()

  return (
    <DashboardLayout title="Settings">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Company settings coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Security settings coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Billing settings coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}