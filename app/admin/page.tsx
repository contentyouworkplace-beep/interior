"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Activity,
  FolderPlus,
  FileText,
  Upload,
  AlertCircle,
  Database,
  Clock,
  Building2,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OverviewData {
  kpis: {
    totalUsers: number
    userGrowth: number
    totalRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    thisMonthRevenue: number
    upcomingRenewals: number
    renewalsRevenue: number
  }
  charts: {
    projectsByMonth: Array<{ month: string; count: number }>
    quotationsByMonth: number
    invoicesByMonth: number
    featureUsage: {
      projects: number
      quotations: number
      invoices: number
      activeUsers: number
    }
  }
  activities: Array<{
    type: string
    user: string
    description: string
    timestamp: string
    icon: string
  }>
  userActivity: Array<{
    id: string
    email: string
    company: string
    lastLogin: string | null
    projectsCount: number
    storageUsed: string
    status: string
  }>
  systemStats: {
    totalOrganizations: number
    totalProjects: number
    activeSubscriptions: number
  }
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('7days')
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOverviewData()
  }, [])

  const fetchOverviewData = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/admin/overview')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch overview data',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
      toast({
        title: 'Error',
        description: 'Failed to load overview data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const exportData = (format: string) => {
    toast({
      title: 'Exporting',
      description: `Exporting data as ${format.toUpperCase()}...`
    })
    // Implement actual export logic here
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Failed to load data</h2>
          <Button onClick={fetchOverviewData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview Dashboard</h1>
          <p className="text-gray-500 mt-1">Complete system analytics and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverviewData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* 1️⃣ Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.kpis.totalUsers}
            </div>
            <div className="flex items-center mt-2">
              {data.kpis.userGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${data.kpis.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.kpis.userGrowth}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(data.kpis.totalRevenue)}
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">
                MRR: {formatCurrency(data.kpis.monthlyRevenue)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* This Month Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Month Revenue
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(data.kpis.thisMonthRevenue)}
            </div>
            <div className="flex items-center mt-2">
              {data.kpis.revenueGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${data.kpis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.kpis.revenueGrowth}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Upcoming Renewals
            </CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.kpis.upcomingRenewals}
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500">
                Expected: {formatCurrency(data.kpis.renewalsRevenue)}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-xs text-orange-600 font-medium">
                Next 7 days
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2️⃣ System Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Projects Created (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.charts.projectsByMonth.map((item, index) => {
                const maxCount = Math.max(...data.charts.projectsByMonth.map(i => i.count))
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-semibold">{item.count} projects</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Feature Usage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FolderPlus className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Projects</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {data.charts.featureUsage.projects}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Quotations</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {data.charts.featureUsage.quotations}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Invoices</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {data.charts.featureUsage.invoices}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Active Users</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {data.charts.featureUsage.activeUsers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3️⃣ Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Recent Activities
            </CardTitle>
            <Badge variant="outline">{data.activities.length} activities</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.activities.map((activity, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className={`p-2 rounded-full ${
                  activity.type === 'signup' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {activity.type === 'signup' ? (
                    <Users className="h-4 w-4 text-blue-600" />
                  ) : (
                    <FolderPlus className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {activity.user}
                  </p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4️⃣ User/Company Activity Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                User & Company Activity
              </CardTitle>
              <CardDescription className="mt-1">
                Detailed activity log for each user and company
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.userActivity.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {user.company}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {formatDate(user.lastLogin)}
                      </div>
                    </TableCell>
                    <TableCell>{user.projectsCount}</TableCell>
                    <TableCell>{user.storageUsed}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === 'active' ? 'default' : 'destructive'}
                        className={user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* System Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Organizations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.systemStats.totalOrganizations}
                </p>
              </div>
              <Building2 className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.systemStats.totalProjects}
                </p>
              </div>
              <FolderPlus className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data.systemStats.activeSubscriptions}
                </p>
              </div>
              <Users className="h-12 w-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
