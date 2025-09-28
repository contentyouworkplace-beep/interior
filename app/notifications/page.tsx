"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { NotificationCenter } from "@/components/notification-center"

export default function NotificationsPage() {
  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Stay updated with your business activities and important alerts"
      currentPath="/notifications"
    >
      <NotificationCenter />
    </DashboardLayout>
  )
}
