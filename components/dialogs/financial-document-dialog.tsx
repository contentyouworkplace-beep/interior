"use client"

import { useState, useEffect } from "react"
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
import { Separator } from "@/components/ui/separator"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { LineItemsEditor, type LineItem } from "./line-items-editor"
import { TaxCalculator, type TaxConfig } from "./tax-calculator"

// Form schema for both quotations and invoices
const financialDocumentSchema = z.object({
  type: z.enum(["quotation", "invoice"]),
  projectId: z.string().uuid("Please select a project"),
  number: z.string().min(1, "Document number is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  dueDate: z.date().optional(),
  status: z.enum(["draft", "sent", "approved", "rejected", "paid", "overdue", "cancelled"]),
  currency: z.string().default("AED"),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
    amount: z.number(),
  })).min(1, "At least one item is required"),
  tax: z.object({
    type: z.enum(["none", "vat", "custom"]),
    rate: z.number(),
    amount: z.number(),
  }),
  subtotal: z.number(),
  total: z.number(),
})

type FinancialDocumentFormValues = z.infer<typeof financialDocumentSchema>

interface FinancialDocumentDialogProps {
  type: "quotation" | "invoice"
  children: React.ReactNode
  onSuccess?: () => void
}

export function FinancialDocumentDialog({ type, children, onSuccess }: FinancialDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const { toast } = useToast()
  const supabase = createClient()

  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [tax, setTax] = useState<TaxConfig>({ type: "vat", rate: 5, amount: 0 })
  const [subtotal, setSubtotal] = useState(0)
  const [total, setTotal] = useState(0)

  const form = useForm<FinancialDocumentFormValues>({
    resolver: zodResolver(financialDocumentSchema),
    defaultValues: {
      type,
      status: "draft",
      currency: "AED",
      items: [],
      tax: { type: "vat", rate: 5, amount: 0 },
      subtotal: 0,
      total: 0,
    },
  })

  // Calculate totals when line items or tax changes
  useEffect(() => {
    const newSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    setSubtotal(newSubtotal)
    setTotal(newSubtotal + tax.amount)
    
    // Update form values
    form.setValue("items", lineItems)
    form.setValue("tax", tax)
    form.setValue("subtotal", newSubtotal)
    form.setValue("total", newSubtotal + tax.amount)
  }, [lineItems, tax])

  // Fetch projects when dialog opens
  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, client:clients(id, first_name, last_name, company)')
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

  // Generate document number
  const generateDocumentNumber = async () => {
    try {
      // Get current year and month
      const now = new Date()
      const year = now.getFullYear().toString().slice(-2)
      const month = (now.getMonth() + 1).toString().padStart(2, '0')
      
      // Get count of existing documents for this month
      const { count, error } = await supabase
        .from(type === "quotation" ? 'quotations' : 'invoices')
        .select('id', { count: 'exact', head: true })
        .like('number', `${type === "quotation" ? 'Q' : 'INV'}-${year}${month}-%`)
      
      if (error) throw error
      
      // Generate number: Q-YYMM-XXX or INV-YYMM-XXX
      const sequence = ((count || 0) + 1).toString().padStart(3, '0')
      const number = `${type === "quotation" ? 'Q' : 'INV'}-${year}${month}-${sequence}`
      
      form.setValue("number", number)
    } catch (error) {
      console.error('Error generating document number:', error)
      toast({
        title: "Error",
        description: "Failed to generate document number. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function onSubmit(data: FinancialDocumentFormValues) {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      // Get project and client details
      const project = projects.find(p => p.id === data.projectId)
      
      let documentData: any
      
      if (type === "quotation") {
        documentData = {
          user_id: user!.id,
          project_id: data.projectId,
          client_id: project?.client?.id,
          quotation_number: data.number,
          title: `Quotation for ${project?.name || 'Project'}`,
          issue_date: data.date.toISOString(),
          due_date: data.dueDate?.toISOString() || null,
          status: data.status,
          subtotal: data.subtotal,
          tax_rate: data.tax.rate,
          tax_amount: data.tax.amount,
          total_amount: data.total,
          currency: data.currency,
          notes: data.notes,
          payment_terms: data.terms,
        }
      } else {
        documentData = {
          user_id: user!.id,
          project_id: data.projectId,
          client_id: project?.client?.id,
          invoice_number: data.number,
          title: `Invoice for ${project?.name || 'Project'}`,
          issue_date: data.date.toISOString(),
          due_date: data.dueDate?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: data.status,
          subtotal: data.subtotal,
          tax_rate: data.tax.rate,
          tax_amount: data.tax.amount,
          total_amount: data.total,
          currency: data.currency,
          notes: data.notes,
          payment_terms: data.terms,
        }
      }

      const { error: insertError } = await supabase
        .from(type === "quotation" ? 'quotations' : 'invoices')
        .insert(documentData)

      if (insertError) throw insertError

      toast({
        title: "Success",
        description: `${type === "quotation" ? "Quotation" : "Invoice"} has been created successfully.`,
      })

      setOpen(false)
      form.reset()
      setLineItems([])
      setTax({ type: "vat", rate: 5, amount: 0 })
      onSuccess?.()
    } catch (error) {
      console.error('Error creating document:', error)
      toast({
        title: "Error",
        description: `Failed to create ${type}. Please try again.`,
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
          generateDocumentNumber()
        }
      }}
    >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Create {type === "quotation" ? "Quotation" : "Invoice"}</DialogTitle>
          <DialogDescription>
            Create a new {type === "quotation" ? "quotation" : "invoice"} with line items and tax calculations.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
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
              {type === "invoice" && (
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
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
              )}
            </div>

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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      {type === "invoice" && (
                        <>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </>
                      )}
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Line Items</h3>
              <LineItemsEditor
                items={lineItems}
                onChange={setLineItems}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tax</h3>
              <TaxCalculator
                subtotal={subtotal}
                tax={tax}
                onTaxChange={setTax}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <Input
                  type="number"
                  value={subtotal.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Total</span>
                <Input
                  type="number"
                  value={total.toFixed(2)}
                  disabled
                  className="bg-muted font-medium"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter terms and conditions"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : `Create ${type === "quotation" ? "Quotation" : "Invoice"}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}