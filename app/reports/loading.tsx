import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Loading comprehensive business insights..."
      currentPath="/reports"
    >
      <div className="space-y-6">
        {/* Header Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-10 w-96" />

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-4 w-8" />
                          <Skeleton className="h-2 w-32" />
                        </div>
                        <div className="text-right space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
