'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  Users, 
  Building2, 
  FileText, 
  Receipt, 
  Wallet, 
  CreditCard,
  UsersRound,
  Store,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarIcon,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportsSummary {
  clients: {
    total: number
  }
  projects: {
    total: number
    active: number
    completed: number
    totalBudget: number
  }
  quotations: {
    total: number
    draft: number
    sent: number
    approved: number
    totalValue: number
  }
  invoices: {
    total: number
    paid: number
    pending: number
    totalValue: number
    paidValue: number
    pendingValue: number
  }
  expenses: {
    total: number
    totalAmount: number
  }
  payments: {
    total: number
    totalAmount: number
  }
  team: {
    total: number
  }
  vendors: {
    total: number
  }
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [preset, setPreset] = useState<'1m' | '3m' | '1y' | 'all' | null>('all')

  useEffect(() => {
    fetchReports()
  }, [dateRange, preset])

  async function fetchReports() {
    try {
      setLoading(true)
      setError(null)
      
      let url = '/api/reports/summary'
      const params = new URLSearchParams()
      
      if (preset === 'all') {
        params.append('allTime', 'true')
      } else if (preset) {
        const now = new Date()
        let from: Date
        if (preset === '1m') from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        else if (preset === '3m') from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        else from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        params.append('from', from.toISOString())
        params.append('to', now.toISOString())
      } else if (dateRange?.from && dateRange?.to) {
        params.append('from', dateRange.from.toISOString())
        params.append('to', dateRange.to.toISOString())
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const res = await fetch(url)
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to load reports')
      }
      const json = await res.json()
      console.log('Reports data received:', json)
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  function handlePreset(p: '1m' | '3m' | '1y' | 'all') {
    setPreset(p)
    setDateRange(undefined)
  }

  function handleDateRange(range?: DateRange) {
    setDateRange(range)
    setPreset(null)
  }

  function handleClear() {
    setDateRange(undefined)
    setPreset('all')
  }

  function exportToPDF() {
    if (!data) return
    
    const doc = new jsPDF()
    
    // Header with company branding
    doc.setFillColor(59, 130, 246) // Blue color
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('CRM Business Reports', 14, 20)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Report Generated: ${format(new Date(), 'PPP p')}`, 14, 28)
    
    // Date Range Info
    let dateRangeText = 'Period: All Time'
    if (preset === '1m') dateRangeText = 'Period: Last Month'
    else if (preset === '3m') dateRangeText = 'Period: Last 3 Months'
    else if (preset === '1y') dateRangeText = 'Period: Last Year'
    else if (dateRange?.from) {
      dateRangeText = `Period: ${format(dateRange.from, 'PP')} - ${dateRange.to ? format(dateRange.to, 'PP') : 'Present'}`
    }
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(dateRangeText, 14, 43)
    
    // Business Overview Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('Business Overview', 14, 53)
    
    const overviewData = [
      ['Metric', 'Value'],
      ['Total Clients', data.clients.total.toString()],
      ['Total Projects', data.projects.total.toString()],
      ['  • Active Projects', data.projects.active.toString()],
      ['  • Completed Projects', data.projects.completed.toString()],
      ['Total Project Budget', `Rs. ${data.projects.totalBudget.toLocaleString('en-IN')}`],
      ['Team Members', data.team.total.toString()],
      ['Vendors', data.vendors.total.toString()],
    ]
    
    autoTable(doc, {
      head: [overviewData[0]],
      body: overviewData.slice(1),
      startY: 58,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 11, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'normal' },
        1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
      }
    })
    
    // Financial Overview Section
    const finalY1 = (doc as any).lastAutoTable.finalY || 110
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('Financial Overview', 14, finalY1 + 10)
    
    const financialData = [
      ['Category', 'Details', 'Amount'],
      ['Quotations', `${data.quotations.total} total (${data.quotations.draft} draft, ${data.quotations.sent} sent, ${data.quotations.approved} approved)`, `Rs. ${data.quotations.totalValue.toLocaleString('en-IN')}`],
      ['Invoices', `${data.invoices.total} total (${data.invoices.paid} paid, ${data.invoices.pending} pending)`, `Rs. ${data.invoices.totalValue.toLocaleString('en-IN')}`],
      ['Revenue (Paid)', `${data.invoices.paid} paid invoices`, `Rs. ${data.invoices.paidValue.toLocaleString('en-IN')}`],
      ['Pending Amount', `${data.invoices.pending} pending invoices`, `Rs. ${data.invoices.pendingValue.toLocaleString('en-IN')}`],
      ['Expenses', `${data.expenses.total} expenses`, `Rs. ${data.expenses.totalAmount.toLocaleString('en-IN')}`],
      ['Payments Received', `${data.invoices.paid} paid invoices`, `Rs. ${data.payments.totalAmount.toLocaleString('en-IN')}`],
    ]
    
    autoTable(doc, {
      head: [financialData[0]],
      body: financialData.slice(1),
      startY: finalY1 + 15,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 11, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 80 },
        2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
      }
    })
    
    // Net Position Summary
    const finalY2 = (doc as any).lastAutoTable.finalY || 200
    const netPosition = data.payments.totalAmount - data.expenses.totalAmount
    
    doc.setFillColor(netPosition >= 0 ? 34 : 239, netPosition >= 0 ? 197 : 68, netPosition >= 0 ? 94 : 68)
    doc.rect(14, finalY2 + 10, 182, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Net Position:', 20, finalY2 + 20)
    doc.setFontSize(14)
    doc.text(`Rs. ${netPosition.toLocaleString('en-IN')}`, 20, finalY2 + 26)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('(Payments Received - Expenses)', 140, finalY2 + 23)
    
    // Footer
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(8)
    doc.text('This is a system-generated report', 105, 285, { align: 'center' })
    
    doc.save(`CRM-Business-Report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`)
  }

  function exportToCSV() {
    if (!data) return
    
    // Prepare date range info
    let dateRangeText = 'All Time'
    if (preset === '1m') dateRangeText = 'Last Month'
    else if (preset === '3m') dateRangeText = 'Last 3 Months'
    else if (preset === '1y') dateRangeText = 'Last Year'
    else if (dateRange?.from) {
      dateRangeText = `${format(dateRange.from, 'PP')} - ${dateRange.to ? format(dateRange.to, 'PP') : 'Present'}`
    }
    
    const csvRows = [
      ['CRM Business Reports'],
      ['Generated on', format(new Date(), 'PPP p')],
      ['Period', dateRangeText],
      [], // Empty row
      
      ['BUSINESS OVERVIEW'],
      ['Metric', 'Value'],
      ['Total Clients', data.clients.total],
      ['Total Projects', data.projects.total],
      ['Active Projects', data.projects.active],
      ['Completed Projects', data.projects.completed],
      ['Total Project Budget', `Rs. ${data.projects.totalBudget.toLocaleString('en-IN')}`],
      ['Team Members', data.team.total],
      ['Vendors', data.vendors.total],
      [], // Empty row
      
      ['QUOTATIONS'],
      ['Category', 'Count', 'Amount'],
      ['Total Quotations', data.quotations.total, `Rs. ${data.quotations.totalValue.toLocaleString('en-IN')}`],
      ['Draft Quotations', data.quotations.draft, ''],
      ['Sent Quotations', data.quotations.sent, ''],
      ['Approved Quotations', data.quotations.approved, ''],
      [], // Empty row
      
      ['INVOICES'],
      ['Category', 'Count', 'Amount'],
      ['Total Invoices', data.invoices.total, `Rs. ${data.invoices.totalValue.toLocaleString('en-IN')}`],
      ['Paid Invoices', data.invoices.paid, `Rs. ${data.invoices.paidValue.toLocaleString('en-IN')}`],
      ['Pending Invoices', data.invoices.pending, `Rs. ${data.invoices.pendingValue.toLocaleString('en-IN')}`],
      [], // Empty row
      
      ['FINANCIAL SUMMARY'],
      ['Category', 'Amount'],
      ['Total Revenue (Paid Invoices)', `Rs. ${data.invoices.paidValue.toLocaleString('en-IN')}`],
      ['Pending Amount', `Rs. ${data.invoices.pendingValue.toLocaleString('en-IN')}`],
      ['Expenses', `Rs. ${data.expenses.totalAmount.toLocaleString('en-IN')}`],
      ['Payments Received', `Rs. ${data.payments.totalAmount.toLocaleString('en-IN')}`],
      ['Net Position', `Rs. ${(data.payments.totalAmount - data.expenses.totalAmount).toLocaleString('en-IN')}`],
      [], // Empty row
      
      ['EXPENSES BREAKDOWN'],
      ['Category', 'Count', 'Amount'],
      ['Total Expenses', data.expenses.total, `Rs. ${data.expenses.totalAmount.toLocaleString('en-IN')}`],
    ]
    
    // Convert to CSV format with proper escaping
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        const cellStr = cell?.toString() || ''
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    ).join('\n')
    
    // Add BOM for proper Excel UTF-8 support
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CRM-Business-Report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Reports & Analytics"
        subtitle="Real-time business insights from your CRM data"
        currentPath="/reports"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data) {
    return (
      <DashboardLayout
        title="Reports & Analytics"
        subtitle="Real-time business insights from your CRM data"
        currentPath="/reports"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Failed to load reports</p>
              <p className="text-sm mt-2">{error || 'Unknown error'}</p>
              <button 
                onClick={fetchReports}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Real-time business insights from your CRM data"
      currentPath="/reports"
    >
      <div className="space-y-6">
        {/* Filter Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm" variant={preset === '1m' ? 'default' : 'outline'} onClick={() => handlePreset('1m')}>
                  1 Month
                </Button>
                <Button size="sm" variant={preset === '3m' ? 'default' : 'outline'} onClick={() => handlePreset('3m')}>
                  3 Months
                </Button>
                <Button size="sm" variant={preset === '1y' ? 'default' : 'outline'} onClick={() => handlePreset('1y')}>
                  1 Year
                </Button>
                <Button size="sm" variant={preset === 'all' ? 'default' : 'outline'} onClick={() => handlePreset('all')}>
                  All Time
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Pick Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={handleDateRange}
                      numberOfMonths={2}
                      disabled={(d) => d > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <Button size="sm" variant="ghost" onClick={handleClear}>
                  Clear
                </Button>
                {(dateRange?.from || preset) && (
                  <div className="text-sm text-muted-foreground">
                    {preset === 'all' && 'All Time'}
                    {preset === '1m' && 'Last 1 Month'}
                    {preset === '3m' && 'Last 3 Months'}
                    {preset === '1y' && 'Last 1 Year'}
                    {dateRange?.from && !preset && `${format(dateRange.from, 'PP')} - ${dateRange.to ? format(dateRange.to, 'PP') : '...'}`}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportToCSV} disabled={!data}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={exportToPDF} disabled={!data}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="space-y-8">
        {/* Clients & Projects */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Business Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.clients.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total clients
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.projects.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.projects.active} active · {data.projects.completed} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Project Budget
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.projects.totalBudget)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total across all projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Members
                </CardTitle>
                <UsersRound className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.team.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total team members
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Financial Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quotations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Quotations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold">{data.quotations.total}</div>
                    <p className="text-xs text-muted-foreground">Total quotations</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{data.quotations.draft} draft</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <FileText className="h-3 w-3" />
                      <span>{data.quotations.sent} sent</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{data.quotations.approved} approved</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(data.quotations.totalValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Invoices</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold">{data.invoices.total}</div>
                    <p className="text-xs text-muted-foreground">Total invoices</p>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{data.invoices.paid} paid</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>{data.invoices.pending} pending</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(data.invoices.paidValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pending:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(data.invoices.pendingValue)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments & Expenses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Payments & Expenses</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Payments Received</span>
                    </div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(data.payments.totalAmount)}</div>
                    <p className="text-xs text-muted-foreground">{data.invoices.paid} paid invoices</p>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Expenses</span>
                    </div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(data.expenses.totalAmount)}</div>
                    <p className="text-xs text-muted-foreground">{data.expenses.total} expenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vendors
                </CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.vendors.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total vendors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Position
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(data.payments.totalAmount - data.expenses.totalAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.payments.totalAmount - data.expenses.totalAmount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Payments minus expenses
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
