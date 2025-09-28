"use client"

import { SettingsProvider } from "@/contexts/settings-context"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { AuthProvider } from "@/contexts/auth-context"
import { UserProvider } from "@/contexts/user-context"
import { Toaster } from "@/components/ui/sonner"
import { DebugBotProvider, useErrorBoundary } from "@/lib/debug-bot"
import { DebugDashboard } from "@/components/debug-dashboard"

function DebugBoundary({ children }: { children: React.ReactNode }) {
  useErrorBoundary()
  return <>{children}</>
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <DebugBotProvider>
      <SettingsProvider>
        <AuthProvider>
          <UserProvider>
            <SidebarProvider>
              <DebugBoundary>
                {children}
                <Toaster />
                <DebugDashboard />
              </DebugBoundary>
            </SidebarProvider>
          </UserProvider>
        </AuthProvider>
      </SettingsProvider>
    </DebugBotProvider>
  )
}