'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  CalendarIcon, 
  Download, 
  FileText, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Enhanced mock data with additional metrics
  const mockQuotes = [
    { id: 1, client: "Ahmed Al Mansouri", project: "Villa Interior Design", amount: "₹2,45,000", status: "Sent", date: "2024-01-15", priority: "High" },
    { id: 2, client: "Sarah Johnson", project: "Office Space Renovation", amount: "₹1,89,000", status: "Accepted", date: "2024-01-16", priority: "Medium" },
    { id: 3, client: "Mohammed Hassan", project: "Restaurant Design", amount: "₹3,22,000", status: "Pending", date: "2024-01-17", priority: "High" },
    { id: 4, client: "Fatima Al Zahra", project: "Retail Store Design", amount: "₹1,67,000", status: "Sent", date: "2024-01-18", priority: "Low" },
    { id: 5, client: "Priya Sharma", project: "Apartment Interior", amount: "₹95,000", status: "Rejected", date: "2024-01-19", priority: "Medium" },
  ]

  const mockInvoices = [
    { id: 1, client: "Ahmed Al Mansouri", project: "Villa Interior Design", amount: "₹2,45,000", status: "Paid", date: "2024-01-20", dueDate: "2024-02-20" },
    { id: 2, client: "Sarah Johnson", project: "Office Space", amount: "₹1,89,000", status: "Partial", date: "2024-01-21", dueDate: "2024-02-21" },
    { id: 3, client: "Mohammed Hassan", project: "Restaurant Design", amount: "₹3,22,000", status: "Overdue", date: "2024-01-22", dueDate: "2024-02-22" },
    { id: 4, client: "Fatima Al Zahra", project: "Retail Store", amount: "₹1,67,000", status: "Sent", date: "2024-01-23", dueDate: "2024-02-23" },
    { id: 5, client: "Rahul Verma", project: "Home Office Setup", amount: "₹78,000", status: "Paid", date: "2024-01-24", dueDate: "2024-02-24" },
  ]

  const mockProjects = [
    { id: 1, name: "Villa Interior Design", client: "Ahmed Al Mansouri", status: "In Progress", progress: 75, startDate: "2024-01-01", endDate: "2024-03-01", budget: "₹2,45,000", team: "Team A" },
    { id: 2, name: "Office Space", client: "Sarah Johnson", status: "Completed", progress: 100, startDate: "2023-12-01", endDate: "2024-01-15", budget: "₹1,89,000", team: "Team B" },
    { id: 3, name: "Restaurant Design", client: "Mohammed Hassan", status: "Planning", progress: 25, startDate: "2024-01-15", endDate: "2024-04-15", budget: "₹3,22,000", team: "Team C" },
    { id: 4, name: "Retail Store", client: "Fatima Al Zahra", status: "On Hold", progress: 50, startDate: "2024-01-10", endDate: "2024-02-28", budget: "₹1,67,000", team: "Team A" },
    { id: 5, name: "Luxury Apartment", client: "Arjun Mehta", status: "In Progress", progress: 60, startDate: "2024-01-20", endDate: "2024-03-20", budget: "₹4,50,000", team: "Team B" },
  ]

  const mockOutstanding = [
    { id: 1, client: "Ahmed Al Mansouri", project: "Villa Interior Design", amount: "₹45,000", dueDate: "2024-02-15", daysOverdue: 5, priority: "High" },
    { id: 2, client: "Mohammed Hassan", project: "Restaurant Design", amount: "₹1,22,000", dueDate: "2024-02-10", daysOverdue: 10, priority: "Critical" },
    { id: 3, client: "Fatima Al Zahra", project: "Retail Store", amount: "₹67,000", dueDate: "2024-02-20", daysOverdue: 0, priority: "Medium" },
    { id: 4, client: "Priya Sharma", project: "Apartment Design", amount: "₹89,000", dueDate: "2024-02-05", daysOverdue: 15, priority: "Critical" },
    { id: 5, client: "Vikram Singh", project: "Commercial Space", amount: "₹1,45,000", dueDate: "2024-02-12", daysOverdue: 8, priority: "High" },
  ]

  const mockExpenses = [
    { id: 1, date: "2024-01-15", category: "Materials", description: "Premium wooden flooring", amount: "₹25,000", status: "Paid", vendor: "Wood Works Ltd" },
    { id: 2, date: "2024-01-16", category: "Furniture", description: "Designer chairs & tables", amount: "₹18,000", status: "Pending", vendor: "Furniture Hub" },
    { id: 3, date: "2024-01-17", category: "Transport", description: "Material delivery charges", amount: "₹3,500", status: "Paid", vendor: "Quick Transport" },
    { id: 4, date: "2024-01-18", category: "Tools", description: "Professional equipment", amount: "₹12,000", status: "Overdue", vendor: "Tool Master" },
    { id: 5, date: "2024-01-19", category: "Labor", description: "Installation services", amount: "₹35,000", status: "Paid", vendor: "Skilled Workers Co" },
  ]

  // Summary metrics
  const summaryMetrics = {
    totalQuotes: mockQuotes.length,
    acceptedQuotes: mockQuotes.filter(q => q.status === 'Accepted').length,
    totalInvoices: mockInvoices.length,
    paidInvoices: mockInvoices.filter(i => i.status === 'Paid').length,
    totalProjects: mockProjects.length,
    activeProjects: mockProjects.filter(p => p.status === 'In Progress').length,
    totalOutstanding: mockOutstanding.reduce((sum, o) => sum + parseInt(o.amount.replace(/[₹,]/g, '')), 0),
    totalExpenses: mockExpenses.reduce((sum, e) => sum + parseInt(e.amount.replace(/[₹,]/g, '')), 0),
  }

  // Export functions
  const exportQuotesCSV = () => {
    const headers = ['ID', 'Client', 'Project', 'Amount', 'Status', 'Date']
    const csvData = [headers, ...mockQuotes.map(q => [q.id, q.client, q.project, q.amount, q.status, q.date])]
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quotes.csv'
    a.click()
  }

  const exportInvoicesCSV = () => {
    const headers = ['ID', 'Client', 'Project', 'Amount', 'Status', 'Date']
    const csvData = [headers, ...mockInvoices.map(i => [i.id, i.client, i.project, i.amount, i.status, i.date])]
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoices.csv'
    a.click()
  }

  const exportProjectsCSV = () => {
    const headers = ['ID', 'Name', 'Client', 'Status', 'Progress', 'Start Date', 'End Date']
    const csvData = [headers, ...mockProjects.map(p => [p.id, p.name, p.client, p.status, p.progress, p.startDate, p.endDate])]
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'projects.csv'
    a.click()
  }

  const exportOutstandingCSV = () => {
    const headers = ['ID', 'Client', 'Project', 'Amount', 'Due Date', 'Days Overdue']
    const csvData = [headers, ...mockOutstanding.map(o => [o.id, o.client, o.project, o.amount, o.dueDate, o.daysOverdue])]
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'outstanding-payments.csv'
    a.click()
  }

  const exportExpensesCSV = () => {
    const headers = ['ID', 'Date', 'Category', 'Description', 'Amount', 'Status']
    const csvData = [headers, ...mockExpenses.map(e => [e.id, e.date, e.category, e.description, e.amount, e.status])]
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses.csv'
    a.click()
  }

  // PDF export functions (placeholder)
  const exportQuotesPDF = () => {
    alert('PDF export feature coming soon!')
  }

  const exportInvoicesPDF = () => {
    alert('PDF export feature coming soon!')
  }

  const exportProjectsPDF = () => {
    alert('PDF export feature coming soon!')
  }

  const exportOutstandingPDF = () => {
    alert('PDF export feature coming soon!')
  }

  const exportExpensesPDF = () => {
    alert('PDF export feature coming soon!')
  }

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Comprehensive business insights and performance metrics"
      currentPath="/reports"
    >
      <div className="space-y-6">
        {/* Enhanced Header with Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">₹12,45,000</p>
                  <p className="text-blue-100 text-xs mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Projects</p>
                  <p className="text-2xl font-bold">{summaryMetrics.activeProjects}</p>
                  <p className="text-green-100 text-xs mt-1 flex items-center">
                    <Activity className="h-3 w-3 mr-1" />
                    {summaryMetrics.totalProjects} total projects
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-bold">₹{summaryMetrics.totalOutstanding.toLocaleString()}</p>
                  <p className="text-orange-100 text-xs mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    5 overdue payments
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Quote Success</p>
                  <p className="text-2xl font-bold">{Math.round((summaryMetrics.acceptedQuotes / summaryMetrics.totalQuotes) * 100)}%</p>
                  <p className="text-purple-100 text-xs mt-1 flex items-center">
                    <Target className="h-3 w-3 mr-1" />
                    {summaryMetrics.acceptedQuotes} of {summaryMetrics.totalQuotes} accepted
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Business Reports</h2>
            <p className="text-muted-foreground">Analyze your business performance across different metrics</p>
          </div>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={() => setDateRange(undefined)}>
              Clear
            </Button>
          </div>
        </div>

        <Card>
          <Tabs defaultValue="quotes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="quotes">Quotes</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="projects">Total Projects</TabsTrigger>
              <TabsTrigger value="outstanding">Outstanding Payments</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            {/* Enhanced Quotes Tab */}
            <TabsContent value="quotes">
              <div className="space-y-6">
                {/* Quotes Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Total Quotes</p>
                          <p className="text-2xl font-bold">{mockQuotes.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Accepted</p>
                          <p className="text-2xl font-bold text-green-600">{mockQuotes.filter(q => q.status === 'Accepted').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Pending</p>
                          <p className="text-2xl font-bold text-orange-600">{mockQuotes.filter(q => q.status === 'Pending').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Total Value</p>
                          <p className="text-2xl font-bold text-purple-600">₹10.18L</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Quotes List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xl">Quote Details</CardTitle>
                      <p className="text-sm text-muted-foreground">Manage and track your project quotes</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportQuotesCSV} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={exportQuotesPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockQuotes.map((quote) => (
                        <Card key={quote.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold">{quote.client}</h4>
                                  <Badge variant={quote.priority === 'High' ? 'destructive' : quote.priority === 'Medium' ? 'default' : 'secondary'}>
                                    {quote.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{quote.project}</p>
                                <p className="text-xs text-muted-foreground">Date: {quote.date}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-lg font-bold">{quote.amount}</p>
                                <Badge className={
                                  quote.status === 'Accepted' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  quote.status === 'Sent' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                  quote.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }>
                                  {quote.status}
                                </Badge>
                              </div>
                            </div>
                            {quote.status === 'Accepted' && (
                              <div className="mt-3 p-2 bg-green-50 rounded-md">
                                <p className="text-xs text-green-700 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Quote accepted - Ready to convert to project
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Enhanced Invoices Tab */}
            <TabsContent value="invoices">
              <div className="space-y-6">
                {/* Invoice Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Total Invoices</p>
                          <p className="text-2xl font-bold">{mockInvoices.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Paid</p>
                          <p className="text-2xl font-bold text-green-600">{mockInvoices.filter(i => i.status === 'Paid').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Overdue</p>
                          <p className="text-2xl font-bold text-red-600">{mockInvoices.filter(i => i.status === 'Overdue').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Collection Rate</p>
                          <p className="text-2xl font-bold text-purple-600">85%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Invoices List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xl">Invoice Management</CardTitle>
                      <p className="text-sm text-muted-foreground">Track payments and outstanding invoices</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportInvoicesCSV} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={exportInvoicesPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockInvoices.map((invoice) => (
                        <Card key={invoice.id} className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold">{invoice.client}</h4>
                                  <Badge variant="outline">INV-{invoice.id.toString().padStart(4, '0')}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{invoice.project}</p>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>Issued: {invoice.date}</span>
                                  <span>Due: {invoice.dueDate}</span>
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-lg font-bold">{invoice.amount}</p>
                                <Badge className={
                                  invoice.status === 'Paid' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  invoice.status === 'Partial' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  invoice.status === 'Overdue' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                  'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                }>
                                  {invoice.status}
                                </Badge>
                              </div>
                            </div>
                            {invoice.status === 'Overdue' && (
                              <div className="mt-3 p-2 bg-red-50 rounded-md">
                                <p className="text-xs text-red-700 flex items-center">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Payment overdue - Follow up required
                                </p>
                              </div>
                            )}
                            {invoice.status === 'Partial' && (
                              <div className="mt-3">
                                <p className="text-xs text-muted-foreground mb-1">Payment Progress</p>
                                <Progress value={60} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">₹1,13,400 of {invoice.amount} received</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Enhanced Projects Tab */}
            <TabsContent value="projects">
              <div className="space-y-6">
                {/* Project Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Total Projects</p>
                          <p className="text-2xl font-bold">{mockProjects.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">In Progress</p>
                          <p className="text-2xl font-bold text-green-600">{mockProjects.filter(p => p.status === 'In Progress').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Completed</p>
                          <p className="text-2xl font-bold text-purple-600">{mockProjects.filter(p => p.status === 'Completed').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Success Rate</p>
                          <p className="text-2xl font-bold text-orange-600">92%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Projects List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xl">Project Portfolio</CardTitle>
                      <p className="text-sm text-muted-foreground">Monitor project progress and performance</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportProjectsCSV} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={exportProjectsPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {mockProjects.map((project) => (
                        <Card key={project.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-semibold">{project.name}</h4>
                                  <p className="text-sm text-muted-foreground">{project.client}</p>
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    <span>{project.team}</span>
                                    <span>•</span>
                                    <span>{project.budget}</span>
                                  </div>
                                </div>
                                <Badge className={
                                  project.status === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  project.status === 'In Progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                  project.status === 'Planning' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }>
                                  {project.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{project.progress}%</span>
                                </div>
                                <Progress value={project.progress} className="h-2" />
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Start: {project.startDate}</span>
                                <span>End: {project.endDate}</span>
                              </div>
                              
                              {project.progress === 100 && (
                                <div className="p-2 bg-green-50 rounded-md">
                                  <p className="text-xs text-green-700 flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Project completed successfully
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Enhanced Outstanding Payments Tab */}
            <TabsContent value="outstanding">
              <div className="space-y-6">
                {/* Outstanding Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Total Outstanding</p>
                          <p className="text-2xl font-bold">₹{summaryMetrics.totalOutstanding.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Critical</p>
                          <p className="text-2xl font-bold text-red-600">{mockOutstanding.filter(o => o.priority === 'Critical').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">Avg Days Overdue</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {Math.round(mockOutstanding.reduce((sum, o) => sum + o.daysOverdue, 0) / mockOutstanding.length)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Affected Clients</p>
                          <p className="text-2xl font-bold text-blue-600">{mockOutstanding.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Outstanding List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xl">Payment Collection</CardTitle>
                      <p className="text-sm text-muted-foreground">Track and manage outstanding payments</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportOutstandingCSV} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={exportOutstandingPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockOutstanding.map((payment) => (
                        <Card key={payment.id} className={`border-l-4 ${
                          payment.priority === 'Critical' ? 'border-l-red-500' :
                          payment.priority === 'High' ? 'border-l-orange-500' :
                          'border-l-yellow-500'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold">{payment.client}</h4>
                                  <Badge variant={
                                    payment.priority === 'Critical' ? 'destructive' :
                                    payment.priority === 'High' ? 'default' :
                                    'secondary'
                                  }>
                                    {payment.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{payment.project}</p>
                                <p className="text-xs text-muted-foreground">Due Date: {payment.dueDate}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-lg font-bold">{payment.amount}</p>
                                <Badge className={
                                  payment.daysOverdue === 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  payment.daysOverdue <= 5 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }>
                                  {payment.daysOverdue === 0 ? 'Due Today' : `${payment.daysOverdue} days overdue`}
                                </Badge>
                              </div>
                            </div>
                            
                            {payment.daysOverdue > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                  <span>Urgency Level</span>
                                  <span>{payment.daysOverdue > 10 ? 'Critical' : payment.daysOverdue > 5 ? 'High' : 'Medium'}</span>
                                </div>
                                <Progress 
                                  value={Math.min((payment.daysOverdue / 30) * 100, 100)} 
                                  className="h-2"
                                />
                              </div>
                            )}
                            
                            {payment.priority === 'Critical' && (
                              <div className="mt-3 p-2 bg-red-50 rounded-md">
                                <p className="text-xs text-red-700 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Immediate action required - Contact client urgently
                                </p>
                              </div>
                            )}
                            
                            {payment.daysOverdue === 0 && (
                              <div className="mt-3 p-2 bg-green-50 rounded-md">
                                <p className="text-xs text-green-700 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Payment due today - Send reminder
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Enhanced Expenses Tab */}
            <TabsContent value="expenses">
              <div className="space-y-6">
                {/* Expense Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Total Expenses</p>
                          <p className="text-2xl font-bold">₹{summaryMetrics.totalExpenses.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Paid</p>
                          <p className="text-2xl font-bold text-green-600">{mockExpenses.filter(e => e.status === 'Paid').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">Pending</p>
                          <p className="text-2xl font-bold text-yellow-600">{mockExpenses.filter(e => e.status === 'Pending').length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">Categories</p>
                          <p className="text-2xl font-bold text-purple-600">{[...new Set(mockExpenses.map(e => e.category))].length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Category Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Expense Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[...new Set(mockExpenses.map(e => e.category))].map((category) => {
                        const categoryExpenses = mockExpenses.filter(e => e.category === category)
                        const categoryTotal = categoryExpenses.reduce((sum, e) => sum + parseInt(e.amount.replace(/[₹,]/g, '')), 0)
                        return (
                          <Card key={category} className="border-dashed">
                            <CardContent className="p-4 text-center">
                              <h4 className="font-medium">{category}</h4>
                              <p className="text-2xl font-bold text-purple-600">₹{categoryTotal.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{categoryExpenses.length} transactions</p>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Expenses List */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-xl">Expense Management</CardTitle>
                      <p className="text-sm text-muted-foreground">Track and categorize business expenses</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={exportExpensesCSV} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={exportExpensesPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockExpenses.map((expense) => (
                        <Card key={expense.id} className="border-l-4 border-l-red-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold">{expense.description}</h4>
                                  <Badge variant="outline">{expense.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{expense.vendor}</p>
                                <p className="text-xs text-muted-foreground">Date: {expense.date}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-lg font-bold">{expense.amount}</p>
                                <Badge className={
                                  expense.status === 'Paid' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }>
                                  {expense.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {expense.status === 'Overdue' && (
                              <div className="mt-3 p-2 bg-red-50 rounded-md">
                                <p className="text-xs text-red-700 flex items-center">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Payment overdue to {expense.vendor}
                                </p>
                              </div>
                            )}
                            
                            {expense.status === 'Paid' && (
                              <div className="mt-3 p-2 bg-green-50 rounded-md">
                                <p className="text-xs text-green-700 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Paid to {expense.vendor} - Transaction complete
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  )
}
