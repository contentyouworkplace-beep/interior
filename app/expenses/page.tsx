"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { ViewExpenseDialog } from "@/components/view-expense-dialog";
import { EditExpenseDialog } from "@/components/edit-expense-dialog";
import { DeleteExpenseDialog } from "@/components/delete-expense-dialog";
import { ExpenseService, type Expense } from "@/lib/services/expense-service";
import { useAuth } from "@/contexts/auth-context";
import { DollarSign, Calendar, TrendingUp, Filter, Plus, Search, Download, MoreHorizontal, Eye, Edit, Trash2, Receipt, CalendarIcon, FileText, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyForPDF, formatCurrencyForPDFSafe } from "@/lib/pdf-currency-utils";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Array<{id: string, name: string, client_id?: string}>>([]);
  const [projectFilter, setProjectFilter] = useState<string>("All Projects");

  // Dialog states
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

  const [filter, setFilter] = useState("All Categories");
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Fetch expenses from backend
  useEffect(() => {
    loadExpenses();
    loadProjects();
  }, [user]); // Add user as dependency

  const loadProjects = async () => {
    try {
      if (!user?.id) return;
      
      // Fetch projects for project filter options
      const response = await fetch(`/api/projects?user_id=${user.id}`);
      if (response.ok) {
        const apiResponse = await response.json();
        console.log('API Response:', apiResponse);
        
        // Expect array of projects: [{ id, name, client_id }]
        const projectsData = apiResponse.projects || apiResponse || [];

        if (Array.isArray(projectsData)) {
          const projectList = projectsData.map((project: any) => ({
            id: project.id,
            name: project.name,
            client_id: project.client_id
          }));

          // Remove duplicates by id just in case
          const uniqueProjects = projectList.filter((p, index, self) =>
            index === self.findIndex(x => x.id === p.id)
          );

          setProjects(uniqueProjects);
        } else {
          console.warn('Projects data is not an array:', projectsData);
          setProjects([]);
        }
      } else {
        console.error('Failed to fetch projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]); // Set empty array as fallback
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }
      
      // Use the regular getExpenses method with user ID
      const { data, error } = await ExpenseService.getExpenses(user.id);
      
      console.log('Debug - User ID:', user.id);
      console.log('Debug - Expenses data:', data);
      console.log('Debug - Error:', error);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load expenses: " + error.message,
          variant: "destructive",
        });
        return;
      }

      // Debug each expense file_urls
      if (data) {
        data.forEach((exp, i) => {
          console.log(`Expense ${i+1}:`, {
            description: exp.description,
            file_urls: exp.file_urls,
            file_urls_type: typeof exp.file_urls,
            file_urls_length: exp.file_urls?.length || 0
          });
        });
      }

      setExpenses(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "Success",
          description: `Loaded ${data.length} expenses successfully`,
        });
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: "Error", 
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Materials & Supplies", 
    "Furniture & Décor", 
    "Labor & Wages", 
    "Transportation", 
    "Professional Services", 
    "Equipment & Tools",
    "Office Expenses", 
    "Marketing & Advertising",
    "Utilities",
    "Miscellaneous"
  ];

  // Enhanced filtering with search and date range
  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = filter === "All Categories" || expense.category === filter;
    
    // Project filtering logic
    const matchesProject = projectFilter === "All Projects" || (() => {
      if (expense.project_id) {
        return projectFilter === projects.find(p => p.id === expense.project_id)?.name;
      }
      return false;
    })();
    
    // Date filtering logic
    const expenseDate = new Date(expense.expense_date + 'T00:00:00');
    let matchesDateRange = true;
    
    if (dateFilter.from) {
      const fromDate = new Date(dateFilter.from);
      fromDate.setHours(0, 0, 0, 0);
      matchesDateRange = matchesDateRange && expenseDate >= fromDate;
    }
    
    if (dateFilter.to) {
      const toDate = new Date(dateFilter.to);
      toDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && expenseDate <= toDate;
    }

    const matchesSearch = searchTerm === '' || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesProject && matchesDateRange && matchesSearch;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const billableAmount = filteredExpenses.filter(e => e.billable).reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  });

  const generateReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csvHeaders = ["Date", "Category", "Amount", "Vendor", "Billable"];
      const csvData = filteredExpenses.map(expense => [
        new Date(expense.expense_date).toLocaleDateString(),
        expense.category,
        expense.amount.toString(),
        expense.vendor || 'N/A',
        expense.billable ? 'Yes' : 'No'
      ]);
      
      const csvContent = [
        csvHeaders,
        ...csvData
      ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
  const projectSuffixCsv = projectFilter !== 'All Projects' ? `-${projectFilter.replace(/\s+/g, '-').toLowerCase()}` : '-all';
  link.setAttribute("download", `expense-report-${new Date().toISOString().split('T')[0]}${projectSuffixCsv}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      console.log('🎯 PDF Generation Started');
      console.log('📊 Filtered Expenses:', filteredExpenses.length);
      
      // Check if we have expenses to show
      if (filteredExpenses.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no expenses matching your current filters. Please adjust your filters and try again.",
          variant: "destructive",
        });
        return;
      }
      
  const doc = new jsPDF();
      
  // Start layout at top without company/tagline
  let yPos = 20;
      
      // Report Title with enhanced styling
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175); // Dark blue
      if (projectFilter !== "All Projects") {
        doc.text('PROJECT EXPENSE REPORT', 14, yPos);
        yPos += 10;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 51, 51);
        doc.text(`For: ${projectFilter}`, 14, yPos);
        yPos += 14;
      } else {
        doc.text('EXPENSE REPORT', 14, yPos);
        yPos += 12;
      }
      
      // Report Details
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, yPos);
      yPos += 7;
      
      // Filter Information
      if (projectFilter !== "All Projects") {
        doc.text(`Project: ${projectFilter}`, 14, yPos);
        yPos += 7;
      }
      if (filter !== "All Categories") {
        doc.text(`Category: ${filter}`, 14, yPos);
        yPos += 7;
      }
      if (dateFilter.from || dateFilter.to) {
        const fromDate = dateFilter.from ? dateFilter.from.toLocaleDateString('en-IN') : 'Beginning';
        const toDate = dateFilter.to ? dateFilter.to.toLocaleDateString('en-IN') : 'Today';
        doc.text(`Period: ${fromDate} to ${toDate}`, 14, yPos);
        yPos += 7;
      }
      
      yPos += 5;
      
      // Enhanced Summary Box with clean styling
      doc.setFillColor(255, 255, 255); // Pure white background
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setLineWidth(1);
      doc.roundedRect(14, yPos, 180, 28, 4, 4, 'FD'); // Fill and Draw
      
      // Summary Text with better formatting
      yPos += 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175); // Darker blue
      doc.text(`Total Expenses: ${formatCurrencyForPDFSafe(totalAmount)}`, 20, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setTextColor(34, 34, 34);
      doc.text(`Billable Amount: ${formatCurrencyForPDFSafe(billableAmount)}`, 20, yPos);
      doc.text(`Overhead Amount: ${formatCurrencyForPDFSafe(totalAmount - billableAmount)}`, 120, yPos);
      
      yPos += 15;
      
      // Table Header
      const tableHeaders = [['Date', 'Category', 'Description', 'Amount (INR)', 'Vendor', 'Type']];
      const tableData = filteredExpenses.map(expense => [
        new Date(expense.expense_date).toLocaleDateString('en-IN'),
        expense.category,
        expense.description.length > 30 ? expense.description.substring(0, 30) + '...' : expense.description,
        formatCurrencyForPDFSafe(expense.amount),
        expense.vendor || 'N/A',
        expense.billable ? 'Billable' : 'Overhead'
      ]);
      
      // Enhanced table styling
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: yPos,
        styles: { 
          fontSize: 10,
          cellPadding: 5,
          font: 'helvetica',
          textColor: [34, 34, 34],
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: { 
          fillColor: [59, 130, 246], // Blue header
          textColor: [255, 255, 255],
          font: 'helvetica',
          fontStyle: 'bold',
          fontSize: 11,
          halign: 'center'
        },
        alternateRowStyles: { 
          fillColor: [248, 250, 252] // Light blue alternate rows
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25 }, // Date
          1: { cellWidth: 30 }, // Category
          2: { cellWidth: 50 }, // Description
          3: { halign: 'right', cellWidth: 28 }, // Amount
          4: { cellWidth: 25 }, // Vendor
          5: { halign: 'center', cellWidth: 22 } // Type
        },
        margin: { top: 60, left: 14, right: 14 },
        didDrawPage: function (data) {
          // Add page numbers with better styling
          doc.setFontSize(9);
          doc.setTextColor(128, 128, 128);
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }
      });
      
      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(14, finalY + 15, 196, finalY + 15);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('* All amounts are in Indian Rupees (INR)', 14, finalY + 22);
      const companyFooter = 'Interior Designer CRM';
      doc.text(`Generated by ${companyFooter} on ${new Date().toLocaleString('en-IN')}`, 14, finalY + 28);
      
      // Save the PDF with descriptive filename
  const projectSuffix = projectFilter !== 'All Projects' ? `-${projectFilter.replace(/\s+/g, '-').toLowerCase()}` : '-all';
  const filename = `expense-report-${new Date().toISOString().split('T')[0]}${projectSuffix}.pdf`;
      doc.save(filename);
      
      // Show success message
      toast({
        title: "PDF Generated Successfully!",
        description: projectFilter !== 'All Projects' 
          ? `Expense report for ${projectFilter} has been downloaded`
          : "Complete expense report has been downloaded",
      });
    }
  };

  return (
    <DashboardLayout 
      title="Expenses" 
      subtitle="Track and manage your business expenses efficiently"
      currentPath="/expenses"
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-2">Track and manage your business expenses efficiently</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">₹ {totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Billable Expenses</p>
                    <p className="text-2xl font-bold text-green-600">₹ {billableAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{currentMonthExpenses.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{new Set(expenses.map(e => e.category)).size}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Filter className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <CardTitle className="text-xl">Expense Management</CardTitle>
                  <CardDescription>Track and manage your business expenses</CardDescription>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-[200px]"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Categories">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Project Filter */}
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Projects">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Date Filters */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">From:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[140px] justify-start text-left font-normal",
                            !dateFilter.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilter.from ? format(dateFilter.from, "dd/MM/yyyy") : "dd/mm/yyyy"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFilter.from}
                          onSelect={(date) => setDateFilter(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">To:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[140px] justify-start text-left font-normal",
                            !dateFilter.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFilter.to ? format(dateFilter.to, "dd/MM/yyyy") : "dd/mm/yyyy"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFilter.to}
                          onSelect={(date) => setDateFilter(prev => ({ ...prev, to: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {(dateFilter.from || dateFilter.to || searchTerm || projectFilter !== "All Projects" || filter !== "All Categories") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDateFilter({ from: undefined, to: undefined });
                        setSearchTerm('');
                        setProjectFilter("All Projects");
                        setFilter("All Categories");
                      }}
                      className="text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                  
                  {/* Export Buttons */}
                  <Button
                    disabled={filteredExpenses.length === 0}
                    variant="outline"
                    className="gap-2"
                    onClick={() => generateReport('csv')}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  
                  <Button
                    disabled={filteredExpenses.length === 0}
                    variant="outline"
                    className="gap-2"
                    onClick={() => generateReport('pdf')}
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </Button>

                  <AddExpenseDialog 
                    onSuccess={() => {
                      loadExpenses(); // Refresh expenses list when new expense is added
                      toast({
                        title: "Success",
                        description: "Expense added successfully",
                      });
                    }}
                    triggerButton={
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Expense
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading expenses...</h3>
                  <p className="text-gray-500">Please wait while we fetch your data</p>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {expenses.length === 0 ? "No expenses yet" : "No expenses match your filters"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {expenses.length === 0 
                      ? "Start tracking your business expenses" 
                      : "Try adjusting your search criteria"
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Billable
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(expense.expense_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {expense.category}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹ {expense.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {expense.vendor || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={expense.billable ? 'default' : 'secondary'}
                              className={expense.billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                            >
                              {expense.billable ? 'Billable' : 'Overhead'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  console.log('🔍 Viewing expense:', expense.description);
                                  console.log('🔍 Expense file_urls:', expense.file_urls);
                                  console.log('🔍 File_urls type:', typeof expense.file_urls);
                                  console.log('🔍 Is array:', Array.isArray(expense.file_urls));
                                  setViewExpense(expense);
                                }}
                                title="View expense details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => setEditExpense(expense)}
                                title="Edit expense"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => setDeleteExpense(expense)}
                                title="Delete expense"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Components */}
      <ViewExpenseDialog 
        expense={viewExpense}
        open={!!viewExpense}
        onOpenChange={(open) => !open && setViewExpense(null)}
      />

      <EditExpenseDialog 
        expense={editExpense}
        open={!!editExpense}
        onOpenChange={(open) => !open && setEditExpense(null)}
        onSuccess={() => {
          loadExpenses();
          toast({
            title: "Success",
            description: "Expense updated successfully",
          });
        }}
      />

      <DeleteExpenseDialog 
        expense={deleteExpense}
        open={!!deleteExpense}
        onOpenChange={(open) => !open && setDeleteExpense(null)}
        onSuccess={() => {
          loadExpenses();
        }}
      />
    </DashboardLayout>
  );
}
