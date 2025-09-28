"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  Users,
  IndianRupee,
  TrendingUp,
  Crown,
  Shield,
  Settings,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

export default function SuperAdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("overview")

  const platformStats = [
    {
      title: "Total Companies",
      value: "47",
      change: "+12%",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Active Subscriptions",
      value: "42",
      change: "+8%",
      icon: Crown,
      color: "text-primary",
    },
    {
      title: "Monthly Revenue",
      value: "₹ 94,500",
      change: "+15%",
      icon: IndianRupee,
      color: "text-green-600",
    },
    {
      title: "Total Users",
      value: "156",
      change: "+23%",
      icon: Users,
      color: "text-orange-600",
    },
  ]

  const companies = [
    {
      id: 1,
      name: "Elite Design Studio",
  owner: "Arjun Mehta",
  email: "arjun@elitedesign.in",
      plan: "Pro",
      status: "active",
      users: 8,
      projects: 24,
  revenue: "₹ 2,500",
      joinDate: "2023-06-15",
      lastActive: "2024-01-15",
  location: "Mumbai, India",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Modern Interiors LLC",
  owner: "Neha Sharma",
  email: "neha@moderninteriors.in",
      plan: "Free",
      status: "active",
      users: 3,
      projects: 8,
  revenue: "₹ 0",
      joinDate: "2023-08-20",
      lastActive: "2024-01-14",
  location: "Bengaluru, India",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "Luxury Spaces",
  owner: "Rahul Verma",
  email: "rahul@luxuryspaces.in",
      plan: "Pro",
      status: "suspended",
      users: 12,
      projects: 45,
  revenue: "₹ 2,500",
      joinDate: "2023-03-10",
      lastActive: "2024-01-05",
  location: "Chennai, India",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "Creative Design Hub",
  owner: "Priya Nair",
  email: "priya@creativehub.in",
      plan: "Pro",
      status: "trial",
      users: 5,
      projects: 12,
  revenue: "₹ 0",
      joinDate: "2024-01-01",
      lastActive: "2024-01-15",
  location: "Pune, India",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      title: "High Server Load",
      message: "Server CPU usage is at 85%. Consider scaling resources.",
      time: "5 minutes ago",
    },
    {
      id: 2,
      type: "info",
      title: "New Company Registration",
      message: "Creative Design Hub has registered for a trial account.",
      time: "2 hours ago",
    },
    {
      id: 3,
      type: "error",
      title: "Payment Failed",
      message: "Luxury Spaces payment failed. Account suspended.",
      time: "1 day ago",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      company: "Elite Design Studio",
      action: "Created new project",
      details: "Villa Renovation - Palm Jumeirah",
      time: "10 minutes ago",
    },
    {
      id: 2,
      company: "Modern Interiors LLC",
      action: "Upgraded to Pro plan",
      details: "Monthly subscription activated",
      time: "2 hours ago",
    },
    {
      id: 3,
      company: "Creative Design Hub",
      action: "Added team member",
      details: "New designer joined the team",
      time: "4 hours ago",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "trial":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Pro":
        return "bg-primary/10 text-primary border-primary/20"
      case "Free":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = selectedFilter === "all" || company.status === selectedFilter

    return matchesSearch && matchesFilter
  })

  return (
    <DashboardLayout
      title="Super Admin Panel"
      subtitle="Manage all interior design companies on the platform"
      currentPath="/admin"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformStats.map((stat, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <div className="flex items-center text-xs mt-1">
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                        <span className="text-green-600 font-medium">{stat.change}</span>
                      </div>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Alerts */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.company}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          {/* Filters */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="bg-transparent">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter: {selectedFilter === "all" ? "All" : selectedFilter}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setSelectedFilter("all")}>All Companies</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter("active")}>Active</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter("trial")}>Trial</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedFilter("suspended")}>Suspended</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Companies List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={company.avatar || "/placeholder.svg"} alt={company.name} />
                        <AvatarFallback>
                          {company.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{company.owner}</p>
                        <p className="text-xs text-muted-foreground">{company.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getPlanColor(company.plan)}>
                        {company.plan === "Pro" && <Crown className="h-3 w-3 mr-1" />}
                        {company.plan}
                      </Badge>
                      <Badge className={getStatusColor(company.status)}>{company.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Company
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{company.users}</p>
                      <p className="text-xs text-muted-foreground">Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{company.projects}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{company.revenue}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-muted-foreground">{company.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="text-muted-foreground">{company.joinDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Active:</span>
                      <span className="text-muted-foreground">{company.lastActive}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart Placeholder */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Revenue analytics chart would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Growth Chart Placeholder */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">User growth analytics chart would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* System Health */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="font-medium">62%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Storage Usage</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Database Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Connection Status</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Query Performance</span>
                  <span className="text-sm font-medium">12ms avg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Connections</span>
                  <span className="text-sm font-medium">24/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Backup</span>
                  <span className="text-sm font-medium">2 hours ago</span>
                </div>
              </CardContent>
            </Card>

            {/* System Actions */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">System Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Logs
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance Reports
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Maintenance Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
