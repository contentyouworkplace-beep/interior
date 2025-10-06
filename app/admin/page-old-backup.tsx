"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  BarChart3, 
  UserPlus, 
  Settings, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminPage() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', company: '' })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const platformStats = [
    {
      label: "Total Companies",
      value: "47",
      change: "+12%",
      icon: Building2,
      color: "blue"
    },
    {
      label: "Active Subscriptions",
      value: "42",
      change: "+8%",
      icon: Users,
      color: "green"
    },
    {
      label: "Monthly Revenue",
      value: "₹ 94,500",
      change: "+18%",
      icon: DollarSign,
      color: "emerald"
    },
    {
      label: "Total Users",
      value: "156",
      change: "+23%",
      icon: TrendingUp,
      color: "orange"
    },
  ]

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      title: "High Server Load",
      message: "Server CPU usage is at 85%. Consider scaling resources.",
      time: "5 minutes ago",
      icon: AlertTriangle
    },
    {
      id: 2,
      type: "info",
      title: "New Company Registration",
      message: "Creative Design Hub has registered for a trial account.",
      time: "2 hours ago",
      icon: CheckCircle
    },
    {
      id: 3,
      type: "success",
      title: "System Update Complete",
      message: "Platform has been updated to v2.1.0 successfully.",
      time: "1 day ago",
      icon: CheckCircle
    },
  ]

  const recentActivity = [
    {
      id: 1,
      company: "Elite Design Studio",
      action: "Created new project",
      details: "Villa Renovation - Palm Jumeirah",
      time: "10 minutes ago"
    },
    {
      id: 2,
      company: "Modern Interiors LLC",
      action: "Upgraded to Pro plan",
      details: "Monthly subscription activated",
      time: "1 hour ago"
    },
    {
      id: 3,
      company: "Creative Spaces",
      action: "Added new team member",
      details: "Invited designer@creativespaces.com",
      time: "2 hours ago"
    },
  ]

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.company) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully",
        })
        setNewUser({ email: '', password: '', company: '' })
        setIsAddUserOpen(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600 text-sm sm:text-base">Platform statistics and recent activity</p>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {platformStats.map((stat, index) => (
          <Card key={index} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-green-600 font-medium mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* System Alerts */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Shield className="h-5 w-5 mr-2" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.type === 'warning' ? 'bg-yellow-500' : 
                    alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.company}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Settings className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 hover:bg-primary hover:text-white transition-colors"
                >
                  <UserPlus className="mr-3 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Add User</div>
                    <div className="text-xs opacity-70">Create new account</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="user@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={newUser.company}
                      onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddUserOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddUser} 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 hover:bg-primary hover:text-white transition-colors"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Manage Users</div>
                <div className="text-xs opacity-70">View all users</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 hover:bg-primary hover:text-white transition-colors"
              onClick={() => window.location.href = '/admin/analytics'}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Analytics</div>
                <div className="text-xs opacity-70">Platform insights</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}