"use client"

import { SettingsProvider } from "@/contexts/settings-context"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { AuthProvider } from "@/contexts/auth-context"
import { UserProvider } from "@/contexts/user-context"
import { Toaster } from "@/components/ui/sonner"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <UserProvider>
          <SidebarProvider>
            {children}
            <Toaster />
          </SidebarProvider>
        </UserProvider>
      </AuthProvider>
    </SettingsProvider>
  )
}