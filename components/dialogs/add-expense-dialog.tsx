"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

// Validation schema
const expenseFormSchema = z.object({
  projectId: z.string().uuid("Please select a project"),
  date: z.date({
    required_error: "Date is required",
  }),
  amount: z.string().min(1, "Amount is required"),
  type: z.enum([
    "materials",
    "labor",
    "transport",
    "equipment",
    "permits",
    "consulting",
    "marketing",
    "office",
    "other"
  ]),
  category: z.enum([
    "direct", // Direct project expenses
    "overhead", // General business expenses
    "marketing", // Marketing and sales expenses
    "administrative" // Administrative expenses
  ]),
  paymentMethod: z.enum([
    "cash",
    "bank_transfer",
    "credit_card",
    "debit_card",
    "cheque",
    "other"
  ]),
  status: z.enum([
    "pending",
    "approved",
    "paid",
    "rejected"
  ]),
  vendor: z.string().optional(),
  description: z.string().min(5, "Description must be at least 5 characters"),
  receipt: z.any().optional(), // For file upload
  notes: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseFormSchema>

interface AddExpenseDialogProps {
  children: React.ReactNode
  onExpenseAdded?: () => void
}

export function AddExpenseDialog({ children, onExpenseAdded }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: new Date(),
      type: "materials",
      category: "direct",
      paymentMethod: "cash",
      status: "pending",
    },
  })

  // Fetch projects when dialog opens
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client:clients(first_name, last_name, company)')
        .order('created_at')
      
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "File size should be less than 5MB",
          variant: "destructive",
        })
        return
      }
      setReceiptFile(file)
    }
  }

  async function onSubmit(data: ExpenseFormValues) {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      let receiptUrl = null
      
      // Upload receipt if exists
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `${user!.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError, data: uploadData } = await supabase
          .storage
          .from('receipts')
          .upload(fileName, receiptFile)

        if (uploadError) throw uploadError
        
        receiptUrl = uploadData.path
      }

      const expenseData = {
        user_id: user!.id,
        project_id: data.projectId,
        expense_date: data.date.toISOString(),
        amount: parseFloat(data.amount),
        category: data.type,
        description: data.description,
        receipt_url: receiptUrl,
        status: data.status,
      }

      const { error: insertError } = await supabase
        .from('expenses')
        .insert(expenseData)

      if (insertError) throw insertError

      toast({
        title: "Success",
        description: "Expense has been added successfully.",
      })

      setOpen(false)
      form.reset()
      setReceiptFile(null)
      onExpenseAdded?.()
    } catch (error) {
      console.error('Error adding expense:', error)
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (newOpen) {
          fetchProjects()
        }
      }}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Record a new expense with project association and receipt.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem 
                          key={project.id} 
                          value={project.id}
                        >
                          {project.name} - {project.client.company || `${project.client.first_name} ${project.client.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expense Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="permits">Permits</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="direct">Direct Project</SelectItem>
                        <SelectItem value="overhead">Overhead</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Vendor or supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the expense"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receipt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      {receiptFile && (
                        <span className="text-sm text-muted-foreground">
                          {receiptFile.name}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload receipt image or PDF (max 5MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes or details"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}