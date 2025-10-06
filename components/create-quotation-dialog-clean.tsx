"use client"

import React, { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatINR, RUPEE_SYMBOL } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Calculator, Loader2 } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { QuotationService, type CreateQuotationRequest } from "@/lib/services/quotation-service"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface CreateQuotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address?: string
  company?: string
}

export function CreateQuotationDialog({ open, onOpenChange, onSuccess }: CreateQuotationDialogProps) {
  console.log('🔄 CreateQuotationDialog rendered - open:', open)
  
  const { gstRate } = useSettings()
  const quotationService = new QuotationService()
  const supabase = createClient()
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const loadingToastId = useRef<string | number | null>(null)
  
  const [formData, setFormData] = useState({
    clientId: "",
    number: `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    date: new Date().toISOString().split("T")[0],
    validUntil: "",
    subject: "",
    description: "",
    currency: "INR",
    tax_type: "GST",
    tax_rate: gstRate,
    tax_amount: 0,
    subtotal: 0,
    total: 0,
    notes: "",
    terms: "Quotation valid for 30 days from the date of issue."
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unit_price: 0, amount: 0 },
  ])

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = (subtotal * gstRate) / 100
  const total = subtotal + taxAmount

  // Load initial data when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadCompanyTerms(),
        loadClients()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyTerms = async () => {
    try {
      console.log('📋 Loading company terms & conditions...')
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No user found')
        return
      }

      // Get user's organization from organization_members
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!orgMember) {
        console.log('❌ No organization found for user')
        return
      }

      console.log('🏢 Organization ID:', orgMember.organization_id)

      // Fetch terms from company_profiles table
      const { data: companyProfile, error } = await supabase
        .from('company_profiles')
        .select('terms_and_conditions')
        .eq('organization_id', orgMember.organization_id)
        .maybeSingle()

      if (error) {
        console.error('❌ Error fetching company profile:', error)
        return
      }

      console.log('✅ Company profile loaded:', companyProfile)

      // Type cast to handle Supabase type generation issue
      const profile = companyProfile as { terms_and_conditions?: string } | null
      
      if (profile && profile.terms_and_conditions) {
        console.log('✅ Terms & Conditions found, setting in form')
        setFormData(prev => ({
          ...prev,
          terms: profile.terms_and_conditions || "Quotation valid for 30 days from the date of issue."
        }))
      } else {
        console.log('⚠️ No terms & conditions found, using default')
      }
    } catch (error) {
      console.error('❌ Error loading company terms:', error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const result = await response.json()
      
      if (result.success && result.clients) {
        setClients(result.clients)
      } else {
        console.error('Failed to load clients:', result.error)
        toast.warning("Could not load clients. You can still create a quotation.")
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.warning("Could not load clients. You can still create a quotation.")
    }
  }

  // Update formData totals when line items change
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total
    }))
  }, [subtotal, taxAmount, total])

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "unit_price") {
            updated.amount = updated.quantity * updated.unit_price
          }
          return updated
        }
        return item
      })
    )
  }

  const resetForm = () => {
    setFormData({
      clientId: "",
      number: `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      date: new Date().toISOString().split("T")[0],
      validUntil: "",
      subject: "",
      description: "",
      currency: "INR",
      tax_type: "GST",
      tax_rate: gstRate,
      tax_amount: 0,
      subtotal: 0,
      total: 0,
      notes: "",
      terms: "Quotation valid for 30 days from the date of issue."
    })
    setLineItems([{ id: "1", description: "", quantity: 1, unit_price: 0, amount: 0 }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🏁 [CreateQuotationDialog] handleSubmit called')
    console.log('📋 [CreateQuotationDialog] Form data:', formData)
    console.log('📝 [CreateQuotationDialog] Line items:', lineItems)
    
    // Perform basic validation
    if (!formData.clientId) {
      console.log('❌ [CreateQuotationDialog] Validation failed: Missing client')
      toast.error("⚠️ Client Required", {
        description: "Please select a client from the dropdown to create a quotation.",
        dismissible: true,
        duration: 4000
      })
      return
    }
    
    if (!formData.subject) {
      console.log('❌ [CreateQuotationDialog] Validation failed: Missing subject')
      toast.error("⚠️ Subject Required", {
        description: "Please enter a descriptive subject/title for your quotation.",
        dismissible: true,
        duration: 4000
      })
      return
    }

    // Debug: Log current line items state
    console.log('🔍 [CreateQuotationDialog] Current lineItems:', lineItems)
    console.log('🔍 [CreateQuotationDialog] Filtered items:', lineItems.filter(item => item.description.trim()))
    
    if (lineItems.filter(item => item.description.trim()).length === 0) {
      console.log('❌ [CreateQuotationDialog] Validation failed: No line items')
      toast.error("⚠️ Items Required", {
        description: "Please add at least one item with description and pricing to create a quotation.",
        dismissible: true,
        duration: 4000
      })
      return
    }
    
    // Additional validations
    if (formData.validUntil && formData.validUntil < formData.date) {
      toast.error("⚠️ Invalid Date Range", {
        description: "Valid until date must be on or after the issue date.",
        dismissible: true,
        duration: 4000
      })
      return
    }
    
    const validLineItems = lineItems.filter(item => item.description.trim())
    const calculatedSubtotal = validLineItems.reduce((sum, item) => sum + item.amount, 0)
    const calculatedTaxAmount = (calculatedSubtotal * formData.tax_rate) / 100
    const calculatedTotal = calculatedSubtotal + calculatedTaxAmount
    
    if (calculatedSubtotal <= 0) {
      toast.error("⚠️ Invalid Amount", {
        description: "Total amount must be greater than zero. Please check your item prices.",
        dismissible: true,
        duration: 4000
      })
      return
    }
    
    // Update form data with calculated values
    setFormData(prev => ({
      ...prev,
      subtotal: calculatedSubtotal,
      tax_amount: calculatedTaxAmount,
      total: calculatedTotal
    }));

    console.log('✅ [CreateQuotationDialog] Validation passed, creating quotation...')
    setSubmitting(true)
    
    // Show immediate feedback to user (keep reference to dismiss later)
    try {
      if (loadingToastId.current) toast.dismiss(loadingToastId.current)
    } catch {}
    loadingToastId.current = toast.loading("Creating quotation...", {
      description: "Please wait while we create your quotation.",
      dismissible: true
    })
    
    try {
      const selectedClient = clients.find(c => c.id === formData.clientId)
      
      const quotationData: CreateQuotationRequest = {
        client_id: formData.clientId,
        title: formData.subject,
        issue_date: formData.date,
        valid_until: formData.validUntil || formData.date,
        subtotal: calculatedSubtotal,
        tax_rate: formData.tax_rate,
        tax_amount: calculatedTaxAmount,
        total_amount: calculatedTotal,
        currency: formData.currency,
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        items: lineItems
          .filter(item => item.description.trim())
          .map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            tax_rate: formData.tax_rate,
            tax_amount: (item.amount * formData.tax_rate) / 100,
            item_order: index + 1
          }))
      }

      console.log('📤 [CreateQuotationDialog] Sending quotation data:', quotationData)
      const result = await quotationService.createQuotation(quotationData)
      console.log('📥 Quotation service result:', result)
      
      if (result.success) {
        console.log('✅ Quotation created successfully!')
        const quotationNumber = result.data?.quotation_number || 'N/A'
        const clientName = clients.find(c => c.id === formData.clientId)
        const clientDisplayName = clientName ? `${clientName.first_name} ${clientName.last_name}` : 'Selected Client'
        // Dismiss loading toast before success
        try { if (loadingToastId.current) toast.dismiss(loadingToastId.current) } catch {}
        loadingToastId.current = null
        toast.success(`🎉 Quotation Created Successfully!`, {
          description: `Quotation ${quotationNumber} for ${clientDisplayName} has been created with total amount ${formatINR(calculatedTotal)}.`,
          dismissible: true,
          duration: 3500
        })
        resetForm()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        console.log('❌ Quotation creation failed:', result.error)
        try { if (loadingToastId.current) toast.dismiss(loadingToastId.current) } catch {}
        loadingToastId.current = null
        toast.error("❌ Failed to Create Quotation", {
          description: result.error || "There was an issue creating your quotation. Please try again or contact support if the problem persists.",
          dismissible: true,
          duration: 5000
        })
      }
    } catch (error) {
      console.error('💥 Error creating quotation:', error)
      try { if (loadingToastId.current) toast.dismiss(loadingToastId.current) } catch {}
      loadingToastId.current = null
      toast.error("💥 Unexpected Error", {
        description: "An unexpected error occurred while creating the quotation. Please check your internet connection and try again.",
        dismissible: true,
        duration: 5000
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedClient = clients.find(c => c.id === formData.clientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Quotation</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name} {client.company && `(${client.company})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Quotation Number</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                      placeholder="QUO-2025-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Issue Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter quotation subject"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Line Items
                  <Button type="button" onClick={addLineItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label htmlFor={`description-${item.id}`}>Description</Label>
                        <Input
                          id={`description-${item.id}`}
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          placeholder="Enter item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`quantity-${item.id}`}>Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`unit_price-${item.id}`}>Unit Price</Label>
                        <Input
                          id={`unit_price-${item.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Amount</Label>
                        <div className="text-sm font-medium p-2 bg-muted rounded">
                          {formatINR(item.amount)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          disabled={lineItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Totals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({gstRate}%):</span>
                    <span>{formatINR(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatINR(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Terms and Conditions</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    placeholder="Enter terms and conditions"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Quotation"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}