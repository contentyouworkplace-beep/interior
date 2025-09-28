"use client"

import { useState, useRef, useEffect } from 'react'
import { ExpenseService, type Expense, type ExpenseFile } from '@/lib/services/expense-service'
import { uploadExpenseFilesToNewBucket } from '@/lib/services/expense-uploads-fix'
import { useAuth } from '@/contexts/auth-context'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Card, CardContent } from './ui/card'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Progress } from './ui/progress'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { 
  Upload, 
  Camera, 
  FileText, 
  X, 
  Eye, 
  Download,
  Plus, 
  IndianRupee,
  Calendar,
  Tag,
  Receipt,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ImageIcon,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExpenseFormData {
  amount: string
  category: string
  description: string
  expenseDate: string
  vendor: string
  paymentMethod: string
  taxAmount: string
  notes: string
  projectId: string
  clientId: string
  isBillable: boolean
  receiptType: 'bill' | 'invoice' | 'receipt' | 'other'
}

interface UploadedFile {
  id: string
  file: File
  preview: string
  name: string
  size: number
  type: 'bill' | 'invoice' | 'receipt' | 'other'
}

const expenseCategories = [
  'Materials & Supplies',
  'Furniture & Décor',
  'Labor & Wages',
  'Transportation',
  'Office Expenses',
  'Marketing & Advertising',
  'Equipment & Tools',
  'Professional Services',
  'Utilities & Communication',
  'Maintenance & Repairs'
]

const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Cheque', 'Other']

export function AddExpenseDialog({ 
  projectId, 
  onSuccess, 
  triggerButton 
}: { 
  projectId?: string
  onSuccess?: () => void
  triggerButton?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const [showFilePreview, setShowFilePreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Add state for projects and clients
  const [projects, setProjects] = useState<Array<{id: string, name: string, client_id?: string | null}>>([])
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([])
  const [loadingData, setLoadingData] = useState(false)

  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    category: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: '',
    taxAmount: '',
    notes: '',
    projectId: 'none',
    clientId: 'none',
    isBillable: false,
    receiptType: 'receipt'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load projects and clients when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      loadProjectsAndClients()
    }
  }, [open, user?.id])

  // Pre-select project when projectId prop is provided
  useEffect(() => {
    if (projectId && open) {
      setFormData(prev => ({ ...prev, projectId }))
    }
  }, [projectId, open])

  const loadProjectsAndClients = async () => {
    if (!user?.id) return
    
    setLoadingData(true)
    try {
      console.log('🔄 Loading projects and clients...')
      
      // Load projects
  const projectsResponse = await fetch(`/api/projects`)
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        console.log('📋 Projects loaded:', projectsData)
        
        // Handle different API response formats
        const projectsList = Array.isArray(projectsData) ? projectsData : (projectsData.projects || [])
        setProjects(projectsList.map((project: any) => ({
          id: project.id,
          name: project.name || project.project_name || 'Unnamed Project',
          client_id: project.client_id ?? null,
        })))
      } else {
        console.warn('Failed to load projects:', projectsResponse.status)
      }
      
      // Load clients
  const clientsResponse = await fetch(`/api/clients`)
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        console.log('👥 Clients loaded:', clientsData)
        
        // Handle different API response formats
        const clientsList = Array.isArray(clientsData) ? clientsData : (clientsData.clients || [])
        
        // Remove duplicates based on name (since clients API might return multiple entries)
        const uniqueClients = clientsList.filter((client: any, index: number, self: any[]) => 
          index === self.findIndex(c => c.id === client.id)
        ).map((client: any) => ({
          id: client.id,
          name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.name || 'Unnamed Client'
        }))
        
        setClients(uniqueClients)
      } else {
        console.warn('Failed to load clients:', clientsResponse.status)
      }
      
    } catch (error) {
      console.error('Error loading projects and clients:', error)
      toast({
        title: "Warning",
        description: "Could not load projects and clients. You can still create the expense.",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const validateForm = (): boolean => {
    console.log('🔍 Validating form data:', formData);
    const newErrors: Record<string, string> = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Date is required'
    }

    console.log('❌ Validation errors found:', newErrors);
    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0;
    console.log('✅ Form validation result:', isValid);
    return isValid;
  }

  const handleInputChange = (field: keyof ExpenseFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // If project is selected (and not 'none'), try to auto-select the corresponding client based on client_name
    if (field === 'projectId' && typeof value === 'string') {
      if (!value || value === 'none') {
        setFormData(prev => ({ ...prev, projectId: 'none' }))
      } else {
        const selectedProject = projects.find(p => p.id === value)
        if (selectedProject?.client_id) {
          // Auto-select client by client_id
          const matchingClient = clients.find(c => c.id === selectedProject.client_id)
          setFormData(prev => ({ ...prev, projectId: value, clientId: matchingClient ? matchingClient.id : prev.clientId }))
        } else {
          setFormData(prev => ({ ...prev, projectId: value }))
        }
      }
      return
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    setUploadLoading(true)
    setUploadProgress(0)
    
    try {
      const totalFiles = files.length
      let processedFiles = 0
      
      for (const file of files) {
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: `${file.name}: File size must be less than 5MB.`,
            variant: "destructive"
          })
          continue
        }

        await new Promise((resolve) => {
          const fileId = Math.random().toString(36).substring(7)
          const reader = new FileReader()
          
          reader.onload = (e) => {
            const newFile: UploadedFile = {
              id: fileId,
              file,
              preview: e.target?.result as string,
              name: file.name,
              size: file.size,
              type: formData.receiptType
            }
            
            setUploadedFiles(prev => [...prev, newFile])
            
            processedFiles++
            setUploadProgress((processedFiles / totalFiles) * 100)
            resolve(true)
          }
          
          reader.readAsDataURL(file)
        })
      }

      toast({
        title: "Files Uploaded",
        description: `Successfully processed ${files.length} file(s)`,
      })
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to process some files. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadLoading(false)
      setUploadProgress(0)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    if (previewFile?.id === fileId) {
      setPreviewFile(null)
    }
  }

  const handleFilePreview = (file: UploadedFile) => {
    console.log('👁️ Opening file preview:', file.name);
    setPreviewFile(file);
    setShowFilePreview(true);
  };

  const handleFileDownload = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.preview;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeDisplay = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('image')) return 'Image'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Excel'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'Document'
    if (mimeType.includes('text')) return 'Text'
    return 'File'
  }

  const calculateTotal = (): number => {
    const amount = parseFloat(formData.amount) || 0
    const tax = parseFloat(formData.taxAmount) || 0
    return amount + tax
  }

  const handleSubmit = async () => {
    console.log('🚀 Starting expense submission...');
    console.log('Form data:', formData);
    console.log('User:', user);
    console.log('Uploaded files:', uploadedFiles.length);

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive"
      })
      return
    }

    if (!user?.id) {
      console.log('❌ No user authenticated');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add expenses.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Prepare expense data with proper field mapping
      const expenseData = {
        user_id: user!.id,
        project_id: formData.projectId === 'none' ? (projectId || undefined) : (formData.projectId || projectId || undefined),
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        expense_date: formData.expenseDate,
        vendor: formData.vendor || undefined,
        // TODO: Add billable column to database schema first
        billable: formData.isBillable,
        payment_method: formData.paymentMethod || undefined,
        tax_amount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        notes: formData.notes || undefined
        // Note: file_urls column doesn't exist in database, files handled separately
      };

      console.log('💾 Creating expense with data:', expenseData);

      const { data: newExpense, error: createError } = await ExpenseService.createExpense(expenseData);
      
      console.log('📊 Create expense result:', { newExpense, createError });
      
      if (createError) {
        console.error('❌ Create expense error:', createError);
        throw new Error(createError?.message || 'Failed to create expense');
      }
      
      if (!newExpense) {
        console.error('❌ No expense data returned');
        throw new Error('No expense data returned from database');
      }

      // Upload files if any
      if (uploadedFiles.length > 0) {
        console.log('📎 Uploading', uploadedFiles.length, 'files...');
        try {
          const expenseFiles: ExpenseFile[] = uploadedFiles.map(file => ({
            file: file.file,
            type: file.type,
            description: file.name
          }));

          const { data: fileUrls, error: uploadError } = await uploadExpenseFilesToNewBucket(
            user!.id,
            newExpense.id!,
            expenseFiles
          );

          console.log('📤 Upload result:', { fileUrls, uploadError });

          if (uploadError) {
            console.warn('⚠️ File upload failed:', uploadError);
            // Don't fail the entire process, just warn the user
            toast({
              title: "Partial Success",
              description: "Expense created successfully, but some files failed to upload. You can add them later by editing the expense.",
            });
          } else if (fileUrls && fileUrls.length > 0) {
            console.log('✅ Successfully uploaded', fileUrls.length, 'file(s)');
            // Persist the file URLs to the expense record so they show up in views/exports
            try {
              const { error: persistError } = await ExpenseService.updateExpense(newExpense.id!, user!.id, { file_urls: fileUrls } as any);
              if (persistError) {
                console.warn('⚠️ Failed to persist file URLs to expense record', persistError);
                toast({
                  title: 'Attachments saved to storage',
                  description: 'Could not save attachment list to database (missing column?). They will still appear via storage, but please add file_urls column.',
                })
              } else {
                console.log('📝 Expense updated with file URLs');
              }
            } catch (e) {
              console.warn('⚠️ Failed to persist file URLs to expense record', e);
            }
          }
        } catch (fileError) {
          console.error('❌ File upload process error:', fileError);
          // Continue with success message since expense was created
        }
      }

      console.log('🎉 Expense creation process completed successfully!');
      
      toast({
        title: "Expense Added Successfully",
        description: uploadedFiles.length > 0 
          ? `Expense recorded with ${uploadedFiles.length} file(s) attached.`
          : "The expense has been successfully recorded.",
      });

      // Reset form
      setFormData({
        amount: '',
        category: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        vendor: '',
        paymentMethod: '',
        taxAmount: '',
        notes: '',
        projectId: 'none',
        clientId: 'none',
        isBillable: false,
        receiptType: 'receipt'
      })
      setUploadedFiles([])
      setErrors({})
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('💥 Error in expense submission:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Error details:', errorMessage);
      
      toast({
        title: "Failed to Save Expense",
        description: `Error: ${errorMessage}. Please try again or contact support if the issue persists.`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      console.log('🔄 Expense submission process finished');
    }
  }

  return (
    <>
  <Dialog open={open} onOpenChange={setOpen}>
        {triggerButton ? (
          <div onClick={() => setOpen(true)}>
            {triggerButton}
          </div>
        ) : (
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        )}
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Add New Expense
            </DialogTitle>
            <DialogDescription>
              Fill in the expense details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Basic Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax/GST Amount</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.taxAmount}
                      onChange={(e) => handleInputChange('taxAmount', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => {
                        handleInputChange('category', value)
                      }}
                    >
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expenseDate">Date *</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => handleInputChange('expenseDate', e.target.value)}
                      className={errors.expenseDate ? 'border-red-500' : ''}
                    />
                    {errors.expenseDate && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.expenseDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => handleInputChange('paymentMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Total Display */}
                {(formData.amount || formData.taxAmount) && (
                  <div className="p-3 bg-blue-50 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Amount:</span>
                      <span className="font-semibold text-lg">₹ {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project & Client Linking */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Project & Client Linking
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectId">Link to Project</Label>
                    <Select 
                      value={formData.projectId} 
                      onValueChange={(value) => handleInputChange('projectId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Project</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Link to Client</Label>
                    <Select 
                      value={formData.clientId} 
                      onValueChange={(value) => handleInputChange('clientId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Client</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billable Status */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Billing Information
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </div>

                <RadioGroup
                  value={formData.isBillable ? "billable" : "overhead"}
                  onValueChange={(value) => handleInputChange('isBillable', value === "billable")}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className={`relative flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    formData.isBillable 
                      ? 'border-green-500 bg-green-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                    <RadioGroupItem value="billable" id="billable" className="text-green-600" />
                    <Label htmlFor="billable" className="flex-1 cursor-pointer">
                      <div className={`font-medium ${formData.isBillable ? 'text-green-700' : 'text-gray-700'}`}>
                        💰 Billable to Client
                      </div>
                      <div className="text-xs text-gray-500">Charge to client</div>
                    </Label>
                    {formData.isBillable && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`relative flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    !formData.isBillable 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                    <RadioGroupItem value="overhead" id="overhead" className="text-blue-600" />
                    <Label htmlFor="overhead" className="flex-1 cursor-pointer">
                      <div className={`font-medium ${!formData.isBillable ? 'text-blue-700' : 'text-gray-700'}`}>
                        🏢 Company Overhead
                      </div>
                      <div className="text-xs text-gray-500">Business expense</div>
                    </Label>
                    {!formData.isBillable && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </RadioGroup>

                {/* Simplified: no explicit billable amount input */}

                {!formData.isBillable && (
                  <div className="pt-3 border-t border-blue-200 bg-blue-50/30 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                      <span className="text-blue-600">ℹ️</span>
                      This expense will be recorded as company overhead and won't be charged to clients.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description & Details */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description & Details
                </h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of the expense"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor/Supplier</Label>
                    <Input
                      id="vendor"
                      placeholder="Name of vendor or supplier"
                      value={formData.vendor}
                      onChange={(e) => handleInputChange('vendor', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional details or notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Bills, Invoices & Receipts
                </h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptType">Document Type</Label>
                    <Select 
                      value={formData.receiptType} 
                      onValueChange={(value) => handleInputChange('receiptType', value as 'bill' | 'invoice' | 'receipt' | 'other')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bill">Bill/Purchase Order</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="receipt">Receipt/Payment Proof</SelectItem>
                        <SelectItem value="other">Other Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="*/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadLoading}
                      className="hidden"
                    />
                    
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Upload {formData.receiptType || 'documents'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Support: All file types • Max 5MB per file
                        </p>
                        {uploadLoading && (
                          <div className="mt-2">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              Uploading files... {Math.round(uploadProgress)}%
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadLoading}
                          className="gap-2"
                        >
                          {uploadLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-4 w-4" />
                              Choose Files
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                    <div className="grid grid-cols-1 gap-2">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            {file.file.type.startsWith('image/') ? (
                              <img 
                                src={file.preview} 
                                alt={file.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : file.file.type.includes('pdf') ? (
                              <FileText className="h-5 w-5 text-red-500" />
                            ) : file.file.type.includes('spreadsheet') || file.file.type.includes('excel') ? (
                              <FileText className="h-5 w-5 text-green-500" />
                            ) : file.file.type.includes('document') || file.file.type.includes('word') ? (
                              <FileText className="h-5 w-5 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {getFileTypeDisplay(file.file.type)}
                            </p>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFilePreview(file)}
                              title="View file"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = file.preview;
                                link.download = file.name;
                                link.click();
                              }}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              title="Remove file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Expense
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced File Preview Dialog */}
      <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Preview: {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4">
            {previewFile && (
              <div className="w-full h-full flex items-center justify-center">
                {previewFile.file.type.startsWith('image/') ? (
                  <img 
                    src={previewFile.preview} 
                    alt={previewFile.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  />
                ) : previewFile.file.type === 'application/pdf' ? (
                  <div className="w-full h-[60vh] border rounded-lg overflow-hidden">
                    <iframe 
                      src={previewFile.preview}
                      className="w-full h-full border-0"
                      title={`Preview of ${previewFile.name}`}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-600 mb-2">{previewFile.name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      File type: {previewFile.file.type || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Size: {formatFileSize(previewFile.file.size)}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={() => handleFileDownload(previewFile)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-500">
              {previewFile && `${formatFileSize(previewFile.file.size)} • ${previewFile.file.type}`}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => previewFile && handleFileDownload(previewFile)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button 
                onClick={() => setShowFilePreview(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
