"use client"

import { useState } from 'react'
import { ExpenseService, type Expense } from '@/lib/services/expense-service'
import { useAuth } from '@/contexts/auth-context'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Badge } from './ui/badge'
import { 
  Trash2,
  AlertTriangle,
  IndianRupee,
  Calendar,
  FileText,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface DeleteExpenseDialogProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteExpenseDialog({ expense, open, onOpenChange, onSuccess }: DeleteExpenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  if (!expense) return null

  const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString()}`

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP')
    } catch {
      return dateString
    }
  }

  const handleDelete = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to delete expenses.",
        variant: "destructive",
      })
      return
    }

    if (!expense.id) {
      toast({
        title: "Error",
        description: "Expense ID is required for deletion.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await ExpenseService.deleteExpense(expense.id, user.id)
      
      if (error) {
        throw new Error(error.message || 'Failed to delete expense')
      }

      toast({
        title: "Expense Deleted",
        description: `Successfully deleted ${formatCurrency(expense.amount)} expense`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast({
        title: "Error",
        description: "Failed to delete expense. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Expense
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the expense and all associated files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense Details Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-red-800">Expense to be deleted:</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">Amount:</span>
                <span className="font-semibold text-red-800 flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {formatCurrency(expense.amount)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">Category:</span>
                <Badge variant="outline" className="border-red-300 text-red-700">
                  {expense.category}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">Date:</span>
                <span className="text-sm text-red-800 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(expense.expense_date)}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-sm text-red-700">Description:</span>
                <span className="text-sm text-red-800 text-right max-w-48 flex items-start gap-1">
                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{expense.description}</span>
                </span>
              </div>

              {expense.vendor && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-700">Vendor:</span>
                  <span className="text-sm text-red-800">{expense.vendor}</span>
                </div>
              )}

              {expense.file_urls && expense.file_urls.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-700">Attachments:</span>
                  <span className="text-sm text-red-800">{expense.file_urls.length} file(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Messages */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <span>All associated files and attachments will also be permanently deleted.</span>
            </div>
            
            {expense.billable && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>This is a billable expense. Make sure it hasn't been invoiced to the client yet.</span>
              </div>
            )}
          </div>

          {/* Confirmation Text */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 text-center">
              Are you absolutely sure you want to delete this expense?
            </p>
          </div>
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
            variant="destructive"
            onClick={handleDelete} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Expense
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}