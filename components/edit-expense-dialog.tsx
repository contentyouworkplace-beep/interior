"use client"

import { useState, useRef, useEffect } from 'react'
import { ExpenseService, type Expense, type ExpenseFile } from '@/lib/services/expense-service'
import { useAuth } from '@/contexts/auth-context'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Card, CardContent } from './ui/card'
import { Switch } from './ui/switch'
import { Badge } from './ui/badge'
import { 
  Upload, 
  Camera, 
  FileText, 
  X, 
  Eye, 
  Download,
  IndianRupee,
  Calendar,
  Tag,
  Receipt,
  AlertCircle,
  CheckCircle,
  Loader2,
  ImageIcon,
  Edit
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

interface EditExpenseDialogProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditExpenseDialog({ expense, open, onOpenChange, onSuccess }: EditExpenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    category: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendor: '',
    paymentMethod: '',
    taxAmount: '',
    notes: '',
    projectId: '',
    clientId: '',
    isBillable: false,
    receiptType: 'receipt'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when expense changes
  useEffect(() => {
    if (expense) {
  setFormData({
        amount: expense.amount?.toString() || '',
        category: expense.category || '',
        description: expense.description || '',
        expenseDate: expense.expense_date || new Date().toISOString().split('T')[0],
        vendor: expense.vendor || '',
        paymentMethod: expense.payment_method || '',
        taxAmount: expense.tax_amount?.toString() || '',
  notes: (expense as any).notes || '',
        projectId: expense.project_id || '',
        clientId: '', // We don't have client_id in the expense type yet
        isBillable: expense.billable || false,
        receiptType: 'receipt'
      })
      setUploadedFiles([])
      setErrors({})
    }
  }, [expense])

  const validateForm = (): boolean => {
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof ExpenseFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    setUploadLoading(true)
    
    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
          toast({
            title: "Invalid File Type",
            description: `${file.name}: Please upload images (JPG, PNG) or PDF files only.`,
            variant: "destructive"
          })
          continue
        }

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const calculateTotal = (): number => {
    const amount = parseFloat(formData.amount) || 0
    const tax = parseFloat(formData.taxAmount) || 0
    return amount + tax
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive"
      })
      return
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to edit expenses.",
        variant: "destructive"
      })
      return
    }

    if (!expense?.id) {
      toast({
        title: "Error",
        description: "Expense ID is required for editing.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Update expense record
  const updateData: Partial<Expense> = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        expense_date: formData.expenseDate,
        vendor: formData.vendor || undefined,
        billable: formData.isBillable,
        payment_method: formData.paymentMethod || undefined,
        tax_amount: formData.taxAmount ? parseFloat(formData.taxAmount) : undefined,
        ...(formData.notes ? { notes: formData.notes } as any : {}),
      }

      const { error: updateError } = await ExpenseService.updateExpense(expense.id, user.id, updateData)
      
      if (updateError) {
        throw new Error(updateError.message || 'Failed to update expense')
      }

      // Upload new files if any
      if (uploadedFiles.length > 0) {
        const expenseFiles: ExpenseFile[] = uploadedFiles.map(file => ({
          file: file.file,
          type: file.type,
          description: file.name
        }))

        const { data: fileUrls, error: uploadError } = await ExpenseService.uploadExpenseFiles(
          user.id,
          expense.id,
          expenseFiles
        )

        if (uploadError) {
          console.warn('File upload failed:', uploadError)
          // Continue with expense update even if file upload fails
        } else if (fileUrls) {
          // Append new file URLs to existing ones
          const existingUrls = expense.file_urls || []
          const updatedUrls = [...existingUrls, ...fileUrls]
          await ExpenseService.updateExpense(expense.id, user.id, { file_urls: updatedUrls })
        }
      }

      toast({
        title: "Expense Updated",
        description: "The expense has been successfully updated.",
      })

      setUploadedFiles([])
      setErrors({})
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error updating expense:', error)
      toast({
        title: "Error",
        description: "Failed to update expense. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!expense) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Expense
            </DialogTitle>
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
                    <Label htmlFor="edit-amount">Amount *</Label>
                    <Input
                      id="edit-amount"
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
                    <Label htmlFor="edit-taxAmount">Tax/GST Amount</Label>
                    <Input
                      id="edit-taxAmount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.taxAmount}
                      onChange={(e) => handleInputChange('taxAmount', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => handleInputChange('category', value)}
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
                    <Label htmlFor="edit-expenseDate">Date *</Label>
                    <Input
                      id="edit-expenseDate"
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
                    <Label htmlFor="edit-paymentMethod">Payment Method</Label>
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

            {/* Billable Status */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Billing Information
                  </h4>
                  <Switch
                    checked={formData.isBillable}
                    onCheckedChange={(checked) => handleInputChange('isBillable', checked)}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Mark as:</span>
                  <Badge variant={formData.isBillable ? 'default' : 'secondary'}>
                    {formData.isBillable ? 'Billable to Client' : 'Company Overhead'}
                  </Badge>
                </div>
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
                    <Label htmlFor="edit-description">Description *</Label>
                    <Input
                      id="edit-description"
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
                    <Label htmlFor="edit-vendor">Vendor/Supplier</Label>
                    <Input
                      id="edit-vendor"
                      placeholder="Name of vendor or supplier"
                      value={formData.vendor}
                      onChange={(e) => handleInputChange('vendor', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Additional Notes</Label>
                    <Textarea
                      id="edit-notes"
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
                  Add New Attachments
                </h4>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-receiptType">Document Type</Label>
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
                      accept="image/*,.pdf"
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
                          Support: JPG, PNG, PDF • Max 5MB per file
                        </p>
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

                {/* New Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">New Files to Add ({uploadedFiles.length})</p>
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
                            ) : (
                              <FileText className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>

                          <div className="flex gap-1">
                            {file.file.type.startsWith('image/') && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewFile(file)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Files */}
                {expense.file_urls && expense.file_urls.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Existing Attachments ({expense.file_urls.length})</p>
                    <div className="grid grid-cols-1 gap-2">
                      {expense.file_urls.map((url, index) => {
                        const isImage = url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') || url.toLowerCase().includes('.png') || url.toLowerCase().includes('.gif');
                        const isPdf = url.toLowerCase().includes('.pdf');
                        
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-blue-50">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                              {isImage ? (
                                <img 
                                  src={url} 
                                  alt={`Existing attachment ${index + 1}`}
                                  className="w-8 h-8 object-cover rounded"
                                  onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {isImage ? 'Image' : isPdf ? 'PDF Document' : 'File'} {index + 1}
                              </p>
                              <p className="text-xs text-blue-600">Existing attachment</p>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(url, '_blank')}
                                title="View existing file"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      Existing files will be preserved. Add new files below to append to this expense.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Existing Attachments</p>
                    <div className="text-center py-4 text-gray-500 border rounded-lg bg-gray-50">
                      <FileText className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs">No existing files. Add new files below.</p>
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
              onClick={() => onOpenChange(false)}
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
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Update Expense
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewFile.name}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={previewFile.preview} 
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}