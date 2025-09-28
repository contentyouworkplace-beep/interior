"use client"

import { useEffect, useState, useRef } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { uploadBrandFile } from '@/lib/storage/branding'
import { useCompanySettings } from '@/hooks/useCompanySettings'
import { useOrganization } from '@/hooks/useOrganization'
import { createClient } from '@/lib/supabase/client'

// UI components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  Building2, 
  Upload, 
  ImageIcon, 
  Save, 
  RefreshCcw, 
  FileText, 
  Receipt, 
  Eye, 
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Palette,
  CheckCircle,
  AlertCircle,
  Camera,
  User,
  Hash,
  Shield,
  IndianRupee
} from 'lucide-react'
import { DocumentTemplatePreview } from '@/components/document-template-preview'

// Enhanced validation schema with better error messages
const companyFormSchema = z.object({
  // Company Information
  company_name: z.string().min(1, "Company name is required").max(100, "Company name too long"),
  company_tagline: z.string().max(200, "Tagline too long").optional(),
  
  // Contact Details
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number").optional().or(z.literal('')),
  website: z.string().url("Invalid website URL").optional().or(z.literal('')),
  
  // Address Information
  address: z.string().max(500, "Address too long").optional(),
  city: z.string().max(50, "City name too long").optional(),
  state: z.string().max(50, "State name too long").optional(),
  pin_code: z.string().regex(/^[1-9][0-9]{5}$/, "Invalid PIN code").optional().or(z.literal('')),
  
  // Legal Information
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i, "Invalid GSTIN format").optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format").optional().or(z.literal('')),
  cin: z.string().regex(/^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, "Invalid CIN format").optional().or(z.literal('')),
  
  // Banking Information
  bank_name: z.string().max(100, "Bank name too long").optional(),
  account_number: z.string().regex(/^[0-9]{9,18}$/, "Invalid account number").optional().or(z.literal('')),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[0-9A-Z]{6}$/, "Invalid IFSC code").optional().or(z.literal('')),
  
  // Branding
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3B82F6"),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#1E40AF"),
  logo_url: z.string().optional(),
  signature_url: z.string().optional(),
  quotation_template: z.enum(["modern", "classic", "minimalist", "corporate", "creative", "premium"]).default("modern"),
  invoice_template: z.enum(["modern", "classic", "minimalist", "corporate", "creative", "premium"]).default("modern"),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

// Enhanced template options with better descriptions and visual indicators
const templateOptions = {
  quotation: [
    { 
      value: "modern", 
      label: "Modern Executive", 
      description: "Sleek gradient design with contemporary corporate branding",
      color: "#3B82F6",
      preview: "Modern"
    },
    { 
      value: "classic", 
      label: "Classic Professional", 
      description: "Timeless business elegance with traditional formatting",
      color: "#1F2937",
      preview: "Classic"
    },
    { 
      value: "minimalist", 
      label: "Minimalist Elite", 
      description: "Clean lines and sophisticated simplicity for premium brands",
      color: "#6B7280",
      preview: "Minimal"
    },
    { 
      value: "corporate", 
      label: "Corporate Power", 
      description: "Bold executive styling with professional dark theme",
      color: "#1E40AF",
      preview: "Corporate"
    },
    { 
      value: "creative", 
      label: "Creative Vision", 
      description: "Dynamic gradients and artistic flair for design professionals",
      color: "#7C3AED",
      preview: "Creative"
    },
    { 
      value: "premium", 
      label: "Luxury Premium", 
      description: "High-end gold accents with luxury brand positioning",
      color: "#D97706",
      preview: "Premium"
    }
  ],
  invoice: [
    { 
      value: "modern", 
      label: "Modern Professional", 
      description: "Clean and contemporary invoice design with subtle gradients",
      color: "#3B82F6",
      preview: "Modern"
    },
    { 
      value: "classic", 
      label: "Classic Business", 
      description: "Traditional invoice layout with professional typography",
      color: "#1F2937",
      preview: "Classic"
    },
    { 
      value: "minimalist", 
      label: "Minimalist Clean", 
      description: "Ultra-clean design focusing on clarity and readability",
      color: "#6B7280",
      preview: "Minimal"
    },
    { 
      value: "corporate", 
      label: "Corporate Standard", 
      description: "Formal business invoice with structured layout",
      color: "#1E40AF",
      preview: "Corporate"
    },
    { 
      value: "creative", 
      label: "Creative Accent", 
      description: "Stylish invoice with creative elements and branding focus",
      color: "#7C3AED",
      preview: "Creative"
    },
    { 
      value: "premium", 
      label: "Premium Elite", 
      description: "Luxury invoice design with sophisticated styling",
      color: "#D97706",
      preview: "Premium"
    }
  ]
}

interface Props {
  orgId: string
}

export function CompanyPage({ orgId }: Props) {
  const { toast } = useToast()
  const { data, getCompanySettings, updateCompanySettings, loading } = useCompanySettings()
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [sigUploading, setSigUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<{ value: string; label: string; description: string } | null>(null)
  const [previewType, setPreviewType] = useState<'quotation' | 'invoice'>('quotation')
  const supabase = createClient()

  // Expose test function for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Test function removed
      (window as any).testTemplateIntegration = testTemplateIntegration
    }
  }, [])

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { company_name: '' }
  })

  // Load existing
  useEffect(() => {
    console.log('Loading company settings for orgId:', orgId)
    getCompanySettings(orgId)
  }, [orgId, getCompanySettings])

  // Sync form when data loads
  useEffect(() => {
    console.log('Syncing form with data:', data)
    if (data) {
      const formData = {
        organization_id: orgId,
        company_name: data.profile?.company_name || '',
        company_tagline: data.profile?.company_tagline || '',
        gstin: data.profile?.gstin || '',
        pan: data.profile?.pan || '',
        phone: data.profile?.phone || '',
        email: data.profile?.email || '',
        address: data.profile?.address || '',
        city: data.profile?.city || '',
        state: data.profile?.state || '',
        pin_code: data.profile?.pin_code || '',
        website: data.profile?.website || '',
        cin: data.profile?.cin || '',
        bank_name: data.banking?.bank_name || '',
        account_number: data.banking?.account_number || '',
        ifsc_code: data.banking?.ifsc_code || '',
        primary_color: data.branding?.primary_color || '#3B82F6',
        secondary_color: data.branding?.secondary_color || '#1E40AF',
        logo_url: data.branding?.logo_url || '',
        signature_url: data.branding?.signature_url || '',
        quotation_template: (data.branding?.quotation_template as 'modern' | 'classic' | 'minimalist' | 'corporate' | 'creative' | 'premium') || 'modern',
        invoice_template: (data.branding?.invoice_template as 'modern' | 'classic' | 'minimalist' | 'corporate' | 'creative' | 'premium') || 'modern'
      }
      console.log('Setting form data:', formData)
      form.reset(formData)
    }
  }, [data, form, orgId])

  async function onSubmit(values: CompanyFormData) {
    setSaving(true)
    try {
      console.log('Submitting company settings:', values)
      
      const profilePayload = {
        company_name: values.company_name,
        company_tagline: values.company_tagline || null,
        gstin: values.gstin || null,
        pan: values.pan || null,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        pin_code: values.pin_code || null,
        website: values.website || null,
        cin: values.cin || null
      }
      const bankingPayload = {
        bank_name: values.bank_name || null,
        account_number: values.account_number || null,
        ifsc_code: values.ifsc_code || null
      }
      const brandingPayload = {
        primary_color: values.primary_color || null,
        secondary_color: values.secondary_color || null,
        logo_url: values.logo_url || null,
        signature_url: values.signature_url || null,
        quotation_template: values.quotation_template || 'modern',
        invoice_template: values.invoice_template || 'modern'
      }
      console.log('Sending update with payloads:', { profile: profilePayload, banking: bankingPayload, branding: brandingPayload })
      
      const result = await updateCompanySettings(orgId, {
        profile: profilePayload,
        banking: bankingPayload,
        branding: brandingPayload
      })
      
      console.log('Update result:', result)
      
      if (result.error) throw new Error(result.error)
      toast({ title: 'Saved', description: 'Company settings updated.' })
    } catch (e:any) {
      console.error('Save error:', e)
      toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(kind: 'logo'|'signature', file?: File) {
    if (!file) return
    const field = kind === 'logo' ? 'logo_url' : 'signature_url'
    try {
      kind === 'logo' ? setLogoUploading(true) : setSigUploading(true)
      const prev = form.getValues(field) as string | undefined
      console.log('Uploading', kind, 'file:', file.name)
      const { url, error } = await uploadBrandFile(kind, orgId, file, prev)
      if (error) throw new Error(error)
      console.log('Upload successful, URL:', url)
      
      // Update form value and trigger re-render
      form.setValue(field as any, url || '', { shouldValidate: true, shouldDirty: true })
      
      toast({ title: 'Uploaded', description: `${kind === 'logo' ? 'Logo' : 'Signature'} updated.` })
    } catch (e:any) {
      console.error('Upload error:', e)
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' })
    } finally {
      kind === 'logo' ? setLogoUploading(false) : setSigUploading(false)
    }
  }

  const handlePreview = (template: { value: string; label: string; description: string }, type: 'quotation' | 'invoice') => {
    setPreviewTemplate(template)
    setPreviewType(type)
    setPreviewOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading company settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Core identity and registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input {...form.register('company_name')} />
                {form.formState.errors.company_name && <p className="text-xs text-red-500">{form.formState.errors.company_name.message}</p>}
              </div>
              <div>
                <Label>Tagline</Label>
                <Input {...form.register('company_tagline')} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>GSTIN</Label>
                <Input {...form.register('gstin')} />
                {form.formState.errors.gstin && <p className="text-xs text-red-500">{form.formState.errors.gstin.message}</p>}
              </div>
              <div>
                <Label>PAN</Label>
                <Input {...form.register('pan')} />
                {form.formState.errors.pan && <p className="text-xs text-red-500">{form.formState.errors.pan.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input {...form.register('phone')} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...form.register('email')} />
                {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea rows={3} {...form.register('address')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>City</Label>
                <Input {...form.register('city')} />
              </div>
              <div>
                <Label>State</Label>
                <Input {...form.register('state')} />
              </div>
              <div>
                <Label>PIN</Label>
                <Input {...form.register('pin_code')} />
                {form.formState.errors.pin_code && <p className="text-xs text-red-500">{form.formState.errors.pin_code.message}</p>}
              </div>
              <div>
                <Label>Website</Label>
                <Input {...form.register('website')} />
                {form.formState.errors.website && <p className="text-xs text-red-500">{form.formState.errors.website.message}</p>}
              </div>
            </div>
            <div>
              <Label>CIN</Label>
              <Input {...form.register('cin')} />
            </div>
          </CardContent>
        </Card>

        {/* Banking */}
        <Card>
          <CardHeader>
            <CardTitle>Banking Information</CardTitle>
            <CardDescription>Used for invoices and payments</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Bank Name</Label>
              <Input {...form.register('bank_name')} />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input {...form.register('account_number')} />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input {...form.register('ifsc_code')} />
              {form.formState.errors.ifsc_code && <p className="text-xs text-red-500">{form.formState.errors.ifsc_code.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Logos, signature and colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo (max 2MB)</Label>
                <div className="flex items-center gap-4">
                  {form.watch('logo_url') ? (
                    <img src={form.watch('logo_url')} className="h-16 w-16 object-contain border rounded" alt="Logo" />
                  ) : (
                    <div className="h-16 w-16 border-2 border-dashed flex items-center justify-center rounded text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={e => e.target.files && handleUpload('logo', e.target.files[0])} />
                    {logoUploading && <p className="text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                  </div>
                </div>
              </div>
              {/* Signature */}
              <div className="space-y-2">
                <Label>Signature (max 1MB)</Label>
                <div className="flex items-center gap-4">
                  {form.watch('signature_url') ? (
                    <img src={form.watch('signature_url')} className="h-16 w-16 object-contain border rounded" alt="Signature" />
                  ) : (
                    <div className="h-16 w-16 border-2 border-dashed flex items-center justify-center rounded text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <Input type="file" accept="image/*" onChange={e => e.target.files && handleUpload('signature', e.target.files[0])} />
                    {sigUploading && <p className="text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" className="w-16 h-10" {...form.register('primary_color')} />
                  <Input {...form.register('primary_color')} />
                </div>
              </div>
              <div>
                <Label>Secondary Color</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" className="w-16 h-10" {...form.register('secondary_color')} />
                  <Input {...form.register('secondary_color')} />
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document Templates
                </h4>
                
                {/* Template Gallery Buttons */}
                <div className="mb-4 flex gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Quick preview:</span>
                  {templateOptions.quotation.slice(0, 3).map((template) => (
                    <Button
                      key={template.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template, 'quotation')}
                      className="text-xs"
                    >
                      {template.label} (Quote)
                    </Button>
                  ))}
                  {templateOptions.invoice.slice(0, 3).map((template) => (
                    <Button
                      key={template.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template, 'invoice')}
                      className="text-xs"
                    >
                      {template.label} (Invoice)
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quotation Template */}
                  <div className="space-y-2">
                    <Label>Quotation Template</Label>
                    <div className="space-y-2">
                      <Select value={form.watch('quotation_template')} onValueChange={(value) => form.setValue('quotation_template', value as 'modern' | 'classic' | 'minimalist' | 'corporate' | 'creative' | 'premium')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose quotation template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateOptions.quotation.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{template.label}</span>
                                <span className="text-xs text-gray-500">{template.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.watch('quotation_template') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const template = templateOptions.quotation.find(t => t.value === form.watch('quotation_template'))
                            if (template) handlePreview(template, 'quotation')
                          }}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Template
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Invoice Template */}
                  <div className="space-y-2">
                    <Label>Invoice Template</Label>
                    <div className="space-y-2">
                      <Select value={form.watch('invoice_template')} onValueChange={(value) => form.setValue('invoice_template', value as 'modern' | 'classic' | 'minimalist' | 'corporate' | 'creative' | 'premium')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose invoice template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templateOptions.invoice.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{template.label}</span>
                                <span className="text-xs text-gray-500">{template.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.watch('invoice_template') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const template = templateOptions.invoice.find(t => t.value === form.watch('invoice_template'))
                            if (template) handlePreview(template, 'invoice')
                          }}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Template
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <DocumentTemplatePreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          template={previewTemplate}
          type={previewType}
        />
      )}
    </div>
  )
}

export default CompanyPage
