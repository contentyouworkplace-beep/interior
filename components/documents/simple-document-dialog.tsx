"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, Loader2, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CompanyDataService } from '@/lib/services/company-data-service'
import { PDFGenerationService } from '@/lib/services/pdf-generation-service'
import { DEFAULT_TAX_CONFIG, UNITS, DocumentCalculator, TemplateType } from '@/lib/types/document-types'

interface SimpleDocumentDialogProps {
  type: 'quotation' | 'invoice'
  children: React.ReactNode
  onCreated?: (doc: any) => void
}

interface SimpleLineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

export function SimpleDocumentDialog({ type, children, onCreated }: SimpleDocumentDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [terms, setTerms] = useState('')
  const [template, setTemplate] = useState<TemplateType>('modern')
  const [currency] = useState('INR')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0])
  const [gstType, setGstType] = useState<'none' | 'cgst_sgst' | 'igst'>('none')
  const [taxPercent, setTaxPercent] = useState(18)
  const [lineItems, setLineItems] = useState<SimpleLineItem[]>([{
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit: 'Pcs',
    unitPrice: 0,
    total: 0
  }])
  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [total, setTotal] = useState(0)

  const companyService = new CompanyDataService()
  const pdfService = new PDFGenerationService()

  useEffect(() => {
    if (open) {
      initialize()
    }
  }, [open, type])

  useEffect(() => {
    const st = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
    setSubtotal(st)
    const tax = gstType === 'none' ? 0 : st * (taxPercent / 100)
    setTaxAmount(tax)
    setTotal(st + tax)
  }, [lineItems, gstType, taxPercent])

  const initialize = async () => {
    try {
      setLoading(true)
      // Fetch company data (will give templates & terms)
      const companyRes = await companyService.getCompanyData()
      if (companyRes.success && companyRes.data) {
        setCompanyData(companyRes.data)
        // Set terms based on type
        if (type === 'quotation') {
          setTerms(companyRes.data.terms.quotation_terms || '')
          setTemplate((companyRes.data.default_template.quotation as TemplateType) || 'modern')
        } else {
          setTerms(companyRes.data.terms.invoice_terms || '')
          setTemplate((companyRes.data.default_template.invoice as TemplateType) || 'modern')
        }
      }
      // Fetch clients (simple supabase query)
      const { data: clientRows, error } = await (companyService as any).supabase
        .from('clients')
        .select('id, first_name, last_name, company, email, phone, address, city, state, zip_code, gstin')
        .limit(100)
      if (!error && clientRows) setClients(clientRows)
    } catch (e) {
      console.error(e)
      toast({ title: 'Init Error', description: 'Failed to load defaults', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const updateLineItem = (id: string, field: keyof SimpleLineItem, value: any) => {
    setLineItems(items => items.map(it => it.id === id ? { ...it, [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value, total: field === 'quantity' || field === 'unitPrice' ? (field === 'quantity' ? (parseFloat(value)||0) * it.unitPrice : it.quantity * (parseFloat(value)||0)) : it.total } : it))
  }

  const addItem = () => setLineItems(items => [...items, { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, total: 0 }])
  const removeItem = (id: string) => setLineItems(items => items.length > 1 ? items.filter(it => it.id !== id) : items)

  const selectedClient = clients.find(c => c.id === selectedClientId)

  const handleCreate = async (download = true) => {
    try {
      if (!selectedClient) {
        toast({ title: 'Client required', description: 'Select a client', variant: 'destructive' })
        return
      }
      if (lineItems.some(li => !li.description || li.quantity <= 0)) {
        toast({ title: 'Line item issue', description: 'Fill all item descriptions & quantities', variant: 'destructive' })
        return
      }

      const documentData: any = {
        metadata: {
          documentType: type,
          documentNumber: `${type === 'quotation' ? 'QUO' : 'INV'}-${Date.now().toString().slice(-6)}`,
          issueDate,
          validUntil: type === 'quotation' ? validUntil : undefined,
          dueDate: type === 'invoice' ? dueDate : undefined,
          currency,
          template
        },
        client: {
          name: `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim(),
          company: selectedClient.company || '',
          email: selectedClient.email || '',
          phone: selectedClient.phone || '',
          address: selectedClient.address || '',
          city: selectedClient.city || '',
          state: selectedClient.state || '',
          pinCode: selectedClient.zip_code || '',
          gstin: selectedClient.gstin || ''
        },
        lineItems: lineItems.map(li => ({
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          unitPrice: li.unitPrice,
          total: li.quantity * li.unitPrice,
          taxable: gstType !== 'none'
        })),
        taxConfig: gstType === 'none' ? DEFAULT_TAX_CONFIG : (
          gstType === 'cgst_sgst' ? { ...DEFAULT_TAX_CONFIG, cgst: taxPercent/2, sgst: taxPercent/2 } : { ...DEFAULT_TAX_CONFIG, igst: taxPercent }
        ),
        discount: { type: 'percentage', value: 0 },
        totals: DocumentCalculator.calculateCompleteDocument(
          lineItems.map(li => ({ id: li.id, description: li.description, quantity: li.quantity, unit: li.unit, unitPrice: li.unitPrice, total: li.quantity * li.unitPrice, taxable: gstType !== 'none', notes: '' })),
          gstType === 'none' ? DEFAULT_TAX_CONFIG : (gstType === 'cgst_sgst' ? { ...DEFAULT_TAX_CONFIG, cgst: taxPercent/2, sgst: taxPercent/2 } : { ...DEFAULT_TAX_CONFIG, igst: taxPercent }),
          { type: 'percentage', value: 0 },
          selectedClient.state,
          companyData?.profile?.state
        ),
        terms,
        status: 'draft'
      }

      // TODO: Persist document to database (placeholder)

      if (download && companyData) {
        await pdfService.downloadDocument(documentData, companyData)
        toast({ title: 'PDF Ready', description: 'Downloaded successfully' })
      }

      onCreated?.(documentData)
      setOpen(false)
    } catch (e) {
      console.error(e)
      toast({ title: 'Error', description: 'Failed to create document', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{type === 'quotation' ? 'New Quotation' : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-6">
          {loading && (
            <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2"/>Loading defaults...</div>
          )}
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.company ? ` • ${c.company}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            {type === 'quotation' ? (
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            )}
          </div>
          {/* Template & GST */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>GST Type</Label>
              <Select value={gstType} onValueChange={(v: any) => setGstType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="cgst_sgst">CGST + SGST</SelectItem>
                  <SelectItem value="igst">IGST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {gstType !== 'none' && (
              <div className="space-y-2 col-span-2">
                <Label>Total GST %</Label>
                <Input type="number" min={0} value={taxPercent} onChange={e => setTaxPercent(parseFloat(e.target.value)||0)} />
              </div>
            )}
          </div>
          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Line Items</Label>
              <Button type="button" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1"/>Add</Button>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {lineItems.map(item => (
                <div key={item.id} className="border rounded-md p-3 space-y-2 bg-muted/30">
                  <div className="flex items-start gap-2">
                    <Textarea value={item.description} onChange={e=>updateLineItem(item.id,'description',e.target.value)} placeholder="Description" className="flex-1" rows={2}/>
                    {lineItems.length>1 && <Button variant="ghost" size="icon" onClick={()=>removeItem(item.id)}><Trash2 className="h-4 w-4"/></Button>}
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <Input type="number" min={0} value={item.quantity} onChange={e=>updateLineItem(item.id,'quantity',e.target.value)} placeholder="Qty" />
                    <Select value={item.unit} onValueChange={v=>updateLineItem(item.id,'unit',v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{UNITS.map(u=> <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" min={0} value={item.unitPrice} onChange={e=>updateLineItem(item.id,'unitPrice',e.target.value)} placeholder="Rate" />
                    <Input readOnly value={(item.quantity*item.unitPrice).toFixed(2)} />
                    <Input readOnly value={currency} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Totals */}
          <div className="space-y-1 text-sm border rounded-md p-3 bg-muted/40">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            {gstType !== 'none' && <div className="flex justify-between"><span>GST ({taxPercent}%)</span><span>₹{taxAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
          {/* Terms */}
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={terms} onChange={e=>setTerms(e.target.value)} rows={5} />
            </div>
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button onClick={()=>handleCreate(true)} disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}<Download className="h-4 w-4 mr-2"/>Save & Download PDF</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
